import { useState, useEffect, FormEvent, useMemo } from "react";
import {
  checkAdminPasswordSetup,
  setupAdminPassword,
  verifyAdminPassword,
  getAllOrders,
  updateOrderStatus,
  getAllProducts,
  saveProduct,
  deleteProduct
} from "../dbService";
import { Order, Product, DiscountTier } from "../types";
import { formatCurrency, formatDate } from "../utils";
import { 
  Lock, Key, LogOut, LayoutDashboard, ShoppingCart, 
  PackageCheck, Calendar, Settings, Plus, Edit2, 
  Trash2, X, Check, Save, Layers, AlertCircle, TrendingUp, Users, RefreshCw,
  Download, FileSpreadsheet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

interface MemberRecord {
  name: string;
  phone: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  notesSummary: string;
}

// Excel-compatible UTF-8 CSV exporter with BOM
function exportToCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
    ...rows.map(row => 
      row.map(val => `"${(val || "").replace(/"/g, '""')}"`).join(",")
    )
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function AdminPanel() {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState("");
  
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  // Active Admin Tab: "dashboard" | "orders" | "products" | "members" | "settings"
  const [activeAdminTab, setActiveAdminTab] = useState<"dashboard" | "orders" | "products" | "members" | "settings">("dashboard");

  // Database lists
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [groupDeadline, setGroupDeadline] = useState("2026/06/30");

  // Filters
  const [orderFilter, setOrderFilter] = useState<"all" | Order["status"]>("all");
  const [orderQuery, setOrderQuery] = useState("");
  const [memberQuery, setMemberQuery] = useState("");

  // Product Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  // New/Edit Product Forms
  const [prodFormName, setProdFormName] = useState("");
  const [prodFormSpecs, setProdFormSpecs] = useState("");
  const [prodFormPrice, setProdFormPrice] = useState(0);
  const [prodFormDesc, setProdFormDesc] = useState("");
  const [prodFormCategory, setProdFormCategory] = useState<Product["category"]>("peanut");
  const [prodFormImage, setProdFormImage] = useState("🥜");
  const [prodTiers, setProdTiers] = useState<DiscountTier[]>([]);

  // Password reset settings
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  // Check auth status from sessionStorage on load
  useEffect(() => {
    async function checkSetup() {
      const isConfigured = await checkAdminPasswordSetup();
      setIsSetup(isConfigured);
      
      const adminSession = sessionStorage.getItem("snh_admin_auth");
      if (adminSession === "true") {
        setIsAuthenticated(true);
        fetchAdminData();
      }
    }
    checkSetup();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const fetchedOrders = await getAllOrders();
      const fetchedProducts = await getAllProducts();
      setOrders(fetchedOrders);
      setProducts(fetchedProducts);

      // Fetch general group deadline settings
      const settingsSnap = await getDoc(doc(db, "config", "general"));
      if (settingsSnap.exists()) {
        setGroupDeadline(settingsSnap.data().groupBuyDeadline || "2026/06/30");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPassword = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (setupPassword.length < 4) {
      setAuthError("為了系統安全，密碼必須至少為 4 個字元！");
      return;
    }
    if (setupPassword !== setupPasswordConfirm) {
      setAuthError("兩次輸入的密碼不一致！");
      return;
    }

    try {
      setLoading(true);
      await setupAdminPassword(setupPassword);
      setIsSetup(true);
      setIsAuthenticated(true);
      sessionStorage.setItem("snh_admin_auth", "true");
      await fetchAdminData();
    } catch {
      setAuthError("初始化設定管理者密碼失敗！");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      setLoading(true);
      const isValid = await verifyAdminPassword(passwordInput);
      if (isValid) {
        setIsAuthenticated(true);
        sessionStorage.setItem("snh_admin_auth", "true");
        await fetchAdminData();
      } else {
        setAuthError("管理者驗證密碼不正確！");
      }
    } catch {
      setAuthError("連線至 Firebase 資料庫時發生錯誤！");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("snh_admin_auth");
    setPasswordInput("");
  };

  // Status adjustment action
  const handleOrderStatusUpdate = async (orderId: string, nextStatus: Order["status"]) => {
    try {
      await updateOrderStatus(orderId, nextStatus);
      // Reload orders lists
      const reloadedOrders = await getAllOrders();
      setOrders(reloadedOrders);
    } catch (err) {
      console.error(err);
    }
  };

  // Product operations
  const handleOpenProductModal = (prod: Product | null) => {
    if (prod) {
      setEditingProduct(prod);
      setProdFormName(prod.name);
      setProdFormSpecs(prod.specs);
      setProdFormPrice(prod.price);
      setProdFormDesc(prod.description);
      setProdFormCategory(prod.category);
      setProdFormImage(prod.image);
      setProdTiers([...prod.bulkDiscounts]);
    } else {
      setEditingProduct(null);
      setProdFormName("");
      setProdFormSpecs("");
      setProdFormPrice(100);
      setProdFormDesc("");
      setProdFormCategory("peanut");
      setProdFormImage("🥜");
      setProdTiers([]);
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!prodFormName.trim() || !prodFormSpecs.trim() || prodFormPrice <= 0) {
      alert("請確實填妥商品名稱、包裝規格與基本售價！");
      return;
    }

    const payload: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: prodFormName.trim(),
      specs: prodFormSpecs.trim(),
      price: prodFormPrice,
      description: prodFormDesc.trim(),
      category: prodFormCategory,
      image: prodFormImage,
      bulkDiscounts: prodTiers.sort((a,b) => a.minQty - b.minQty)
    };

    try {
      await saveProduct(payload);
      setIsProductModalOpen(false);
      // reload
      const reloadedProducts = await getAllProducts();
      setProducts(reloadedProducts);
    } catch (err) {
      alert("儲存商品失敗！");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("確定要將此產品從系統上永久移除嗎？此動作將無法復原。")) return;
    try {
      await deleteProduct(productId);
      const reloadedProducts = await getAllProducts();
      setProducts(reloadedProducts);
    } catch (err) {
      alert("刪除商品失敗！");
    }
  };

  const handleUpdateDeadline = async () => {
    try {
      await setDoc(doc(db, "config", "general"), {
        groupBuyDeadline: groupDeadline
      });
      alert("團購截止日期已成功同步儲存！");
    } catch {
      alert("儲存團購截止日期失敗！");
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setResetMessage("");
    try {
      const isOldValid = await verifyAdminPassword(oldPassword);
      if (!isOldValid) {
        setResetMessage("舊管理者密碼驗證失敗！");
        return;
      }
      if (newPassword.length < 4) {
        setResetMessage("新密碼字元長度必須大於或等於 4！");
        return;
      }
      await setupAdminPassword(newPassword);
      setResetMessage("管理者密碼變更成功！");
      setOldPassword("");
      setNewPassword("");
    } catch {
      setResetMessage("變更密碼失敗。");
    }
  };

  const addDiscountTier = () => {
    setProdTiers([...prodTiers, { minQty: 10, discountPrice: prodFormPrice - 5 }]);
  };

  const removeDiscountTier = (idx: number) => {
    const updated = [...prodTiers];
    updated.splice(idx, 1);
    setProdTiers(updated);
  };

  const updateDiscountTier = (idx: number, field: keyof DiscountTier, val: number) => {
    const updated = [...prodTiers];
    updated[idx] = { ...updated[idx], [field]: val };
    setProdTiers(updated);
  };

  // Filtering Logic
  const filteredOrders = orders.filter((o) => {
    const matchesFilter = orderFilter === "all" || o.status === orderFilter;
    const searchString = `${o.customerName} ${o.customerPhone} ${o.orderNumber}`.toLowerCase();
    const matchesQuery = !orderQuery || searchString.includes(orderQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  // Members Analysis and Summarization
  const members: MemberRecord[] = useMemo(() => {
    const memberMap = new Map<string, MemberRecord>();
    const sortedOrders = [...orders].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    sortedOrders.forEach((o) => {
      const key = (o.customerPhone || "").trim();
      if (!key) return;

      const orderAmount = o.status !== "已取消" ? o.totalAmount : 0;
      const orderCountInc = o.status !== "已取消" ? 1 : 0;

      const existing = memberMap.get(key);
      if (existing) {
        memberMap.set(key, {
          name: o.customerName.trim() || existing.name,
          phone: key,
          address: o.customerAddress.trim() || existing.address,
          orderCount: existing.orderCount + orderCountInc,
          totalSpent: existing.totalSpent + orderAmount,
          lastOrderDate: o.createdAt,
          notesSummary: [existing.notesSummary, o.notes].filter(Boolean).join(" | ")
        });
      } else {
        memberMap.set(key, {
          name: o.customerName.trim(),
          phone: key,
          address: o.customerAddress.trim(),
          orderCount: orderCountInc,
          totalSpent: orderAmount,
          lastOrderDate: o.createdAt,
          notesSummary: o.notes || ""
        });
      }
    });

    return Array.from(memberMap.values());
  }, [orders]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const q = memberQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) || 
        m.phone.includes(q) || 
        m.address.toLowerCase().includes(q)
      );
    });
  }, [members, memberQuery]);

  // CSV Exporters
  const handleExportSalesStatsCSV = () => {
    const headers = [
      "商品ID",
      "商品名稱",
      "包裝規格",
      "分類",
      "零售單價",
      "已售出總數量",
      "銷售累積金額",
      "關聯銷售訂單筆數"
    ];

    const rows = products.map((prod) => {
      const validOrders = orders.filter((o) => o.status !== "已取消");
      const salesItems = validOrders.flatMap((o) => o.items).filter((item) => item.productId === prod.id);
      const totalQty = salesItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalRev = salesItems.reduce((sum, item) => sum + item.subtotal, 0);
      const linkedOrderCount = validOrders.filter((o) => o.items.some((item) => item.productId === prod.id)).length;
      const catText = prod.category === "peanut" ? "焙炒花生" : prod.category === "candy" ? "花生糖/糕點" : "配件袋";

      return [
        prod.id,
        prod.name,
        prod.specs,
        catText,
        String(prod.price),
        String(totalQty),
        String(totalRev),
        String(linkedOrderCount)
      ];
    });

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    exportToCSV(`新洽記商行_商品銷售統計_${timestamp}.csv`, headers, rows);
  };

  const handleExportOrderDetailsCSV = () => {
    const headers = [
      "訂單編號",
      "下單日期",
      "訂購人姓名",
      "聯絡電話",
      "配送方式",
      "付款管道",
      "配送/取貨地址",
      "顧客備註",
      "商品明細清單",
      "訂單款額",
      "訂單狀態"
    ];

    const rows = orders.map((o) => {
      const shippingText = o.shippingMethod === "delivery" ? "宅配到府" : "自取";
      const paymentText = o.paymentMethod === "cod" ? "貨到付款/自取付款" : "銀行匯款";
      const itemsDescription = o.items.map((it) => `${it.productName}(${it.specs}) x ${it.quantity} (單價:${it.priceAtPurchase})`).join("; ");

      return [
        o.orderNumber,
        formatDate(o.createdAt),
        o.customerName,
        o.customerPhone,
        shippingText,
        paymentText,
        o.customerAddress,
        o.notes || "",
        itemsDescription,
        String(o.totalAmount),
        o.status
      ];
    });

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    exportToCSV(`新洽記商行_銷售訂單明細_${timestamp}.csv`, headers, rows);
  };

  const handleExportMembersCSV = () => {
    const headers = [
      "會員姓名",
      "聯絡電話",
      "常用配送/取貨地址",
      "不重複累積下單次數",
      "累積消費總金額(不含已取消)",
      "最後下單日期",
      "歷史訂單備註匯總"
    ];

    const rows = filteredMembers.map((m) => [
      m.name,
      m.phone,
      m.address,
      String(m.orderCount),
      String(m.totalSpent),
      formatDate(m.lastOrderDate),
      m.notesSummary
    ]);

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    exportToCSV(`新洽記商行_不重複會員名冊_${timestamp}.csv`, headers, rows);
  };

  // Math totals for dashboard stats
  const totalSalesRevenue = orders
    .filter((o) => o.status !== "已取消")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const processingOrdersCount = orders.filter((o) => o.status === "處理中").length;
  const completedOrdersCount = orders.filter((o) => o.status === "已完成").length;

  // Render setup or authentication gates if necessary
  if (isSetup === null) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="animate-spin w-8 h-8 text-natural-brand" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-natural-border-light p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#FAF3EA] rounded-full flex items-center justify-center mx-auto mb-2 text-natural-brand">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-serif font-bold text-natural-text-head">新洽記商行後台</h2>
          <p className="text-xs text-natural-text-muted mt-1">
            {isSetup
              ? "系統已啟用，請輸入管理者驗證密碼進入控制面板。"
              : "歡迎初次使用！請在下方設定本系統唯一的管理者密碼。"}
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-semibold mb-4 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* 1. Setup Password UI for state isSetup === false */}
        {!isSetup ? (
          <form onSubmit={handleSetupPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-natural-text-head mb-1" htmlFor="set-pass">
                設定管理者密碼：
              </label>
              <input
                id="set-pass"
                type="password"
                required
                placeholder="建議 6 位數以上的安全複雜密碼"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                className="w-full bg-stone-50 border border-natural-border-light rounded-lg px-4 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-natural-brand transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-natural-text-head mb-1" htmlFor="conf-pass">
                再次確認新密碼：
              </label>
              <input
                id="conf-pass"
                type="password"
                required
                placeholder="確認並再次輸入您剛才的密碼"
                value={setupPasswordConfirm}
                onChange={(e) => setSetupPasswordConfirm(e.target.value)}
                className="w-full bg-stone-50 border border-natural-border-light rounded-lg px-4 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-natural-brand transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-natural-brand hover:bg-natural-brand-hover text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="animate-spin w-4 h-4" />
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>完成初始化並登入管理後台</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* 2. Login verification UI */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-natural-text-head mb-1.5" htmlFor="verify-pass">
                管理者登入密碼：
              </label>
              <input
                id="verify-pass"
                type="password"
                required
                autoFocus
                placeholder="請輸入後台登入識別碼"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-stone-50 border border-natural-border-light rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-natural-brand focus:outline-hidden transition-all font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-natural-brand hover:bg-natural-brand-hover text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="animate-spin w-4 h-4" />
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>安全驗證管理者身分</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    );
  }

  // Loaded Dashboard Render State
  return (
    <div className="bg-white rounded-2xl border border-natural-border-light p-6 shadow-xs">
      {/* Admin Panel Header with logout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-natural-border-light pb-5 mb-6 gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-natural-text-head flex items-center gap-2">
            <span className="text-natural-brand">洽</span>
            <span>新洽記商行後台控制台</span>
          </h2>
          <p className="text-xs text-natural-text-muted mt-1">
            資料儲存系統：Firestore ‧ 權限：系統管理者
          </p>
        </div>
        
        <button
          onClick={handleLogout}
          className="self-start sm:self-auto px-4 py-2 bg-[#FAF3EA] border border-natural-border-light hover:bg-[#EFE0CD] text-natural-text-head rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>登出</span>
        </button>
      </div>

      {/* Primary Administration navigation bar */}
      <div className="flex border-b border-natural-border-light mb-6 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveAdminTab("dashboard")}
          className={`flex items-center space-x-1.5 pb-3 px-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeAdminTab === "dashboard"
              ? "border-natural-brand text-natural-brand font-black"
              : "border-transparent text-natural-text-muted hover:text-natural-text-head"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>營運看板 (Dashboard)</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("orders")}
          className={`flex items-center space-x-1.5 pb-3 px-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeAdminTab === "orders"
              ? "border-natural-brand text-natural-brand font-black"
              : "border-transparent text-natural-text-muted hover:text-natural-text-head"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>訂單調度管理 ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("products")}
          className={`flex items-center space-x-1.5 pb-3 px-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeAdminTab === "products"
              ? "border-natural-brand text-natural-brand font-black"
              : "border-transparent text-natural-text-muted hover:text-natural-text-head"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>商品品項異動 ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("members")}
          className={`flex items-center space-x-1.5 pb-3 px-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeAdminTab === "members"
              ? "border-natural-brand text-natural-brand font-black"
              : "border-transparent text-natural-text-muted hover:text-natural-text-head"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>會員名冊管理 ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab("settings")}
          className={`flex items-center space-x-1.5 pb-3 px-3 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeAdminTab === "settings"
              ? "border-natural-brand text-natural-brand font-black"
              : "border-transparent text-natural-text-muted hover:text-natural-text-head"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>參數與系統設定</span>
        </button>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <RefreshCw className="animate-spin w-6 h-6 text-natural-brand" />
        </div>
      )}

      {/* Admin content blocks based on active admin tab */}
      {!loading && (
        <div>
          {/* Tab 1: Dashboard Panel */}
          {activeAdminTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* Financial Stats Bento Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-amber-50 hover:bg-amber-100/60 transition-colors border border-amber-100 p-5 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-amber-900 mb-2">
                    <span className="text-xs font-bold tracking-wide">總接單營業總額</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-serif font-black text-amber-850">
                    {formatCurrency(totalSalesRevenue)}
                  </p>
                  <span className="text-[10px] text-stone-500 block mt-1">包含所有已確認、備貨中、以及已完成訂單款項</span>
                </div>

                <div className="bg-blue-50 hover:bg-blue-100/60 transition-colors border border-blue-100 p-5 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-blue-900 mb-2">
                    <span className="text-xs font-bold tracking-wide">累計收訖訂單筆數</span>
                    <PackageCheck className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-blue-800">
                    {orders.length} 筆
                  </p>
                  <span className="text-[10px] text-stone-500 block mt-1">本團購計畫目前收集到的所有客戶訂單</span>
                </div>

                <div className="bg-orange-50 hover:bg-orange-100/60 transition-colors border border-orange-100 p-5 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-orange-950 mb-2">
                    <span className="text-xs font-bold tracking-wide">待處理訂單數 (處理中)</span>
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-orange-800">
                    {processingOrdersCount} 筆
                  </p>
                  <span className="text-[10px] text-stone-500 block mt-1">需要為其安排包裝配貨以及快遞發貨的單據</span>
                </div>

                <div className="bg-green-50 hover:bg-green-100/60 transition-colors border border-green-100 p-5 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between text-green-950 mb-2">
                    <span className="text-xs font-bold tracking-wide">已結案訂單 (已完成)</span>
                    <Check className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-bold text-green-800">
                    {completedOrdersCount} 筆
                  </p>
                  <span className="text-[10px] text-stone-500 block mt-1">顧客已取貨完成，或物流已成功簽收結案</span>
                </div>

              </div>

              {/* Graphic visual overview about orders */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
                <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4">
                  各項商品訂購總量統計
                </h3>
                
                <div className="space-y-4">
                  {products.map((prod) => {
                    // Count total units ordered
                    const totalUnits = orders
                      .filter((o) => o.status !== "已取消")
                      .flatMap((o) => o.items)
                      .filter((item) => item.productId === prod.id)
                      .reduce((sum, item) => sum + item.quantity, 0);

                    // Find percentage of orders
                    const maxUnits = 100; // scaling reference
                    const progressVal = Math.min(100, (totalUnits / maxUnits) * 100);

                    return (
                      <div key={prod.id} className="text-xs space-y-1">
                        <div className="flex justify-between items-baseline font-medium">
                          <span className="text-stone-800 font-serif font-bold">
                            {prod.name} ({prod.specs})
                          </span>
                          <span className="text-stone-500">
                            已訂購 <strong className="text-amber-850 font-mono text-sm">{totalUnits}</strong> {prod.category === "peanut" ? "罐" : prod.category === "candy" ? "盒/包" : "件"}
                          </span>
                        </div>
                        <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden flex">
                          <div
                            style={{ width: `${progressVal}%` }}
                            className="bg-amber-800 h-full rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sales Statistics CSV Export Panel Section */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-text-head font-serif">
                      營運數據與銷售統計匯出
                    </h3>
                    <p className="text-xs text-natural-text-muted mt-1">
                      可將最新的銷售統計報表及客戶訂單明細匯出為 Excel 最佳相容之 UTF-8 CSV 格式。
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={handleExportSalesStatsCSV}
                      className="px-4 py-2 bg-amber-850 hover:bg-amber-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>匯出商品銷售統計 CSV</span>
                    </button>

                    <button
                      onClick={handleExportOrderDetailsCSV}
                      className="px-4 py-2 bg-[#FAF3EA] border border-natural-border-light hover:bg-[#EFE0CD] text-natural-text-head rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>匯出全部訂單明細 CSV</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Orders Management Panel */}
          {activeAdminTab === "orders" && (
            <div className="space-y-4">
              
              {/* Order Filtering options and query search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-stone-50 p-4 rounded-xl border border-stone-150">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setOrderFilter("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      orderFilter === "all" ? "bg-stone-800 text-white shadow-xs" : "bg-white text-stone-600 hover:text-stone-800 border"
                    }`}
                  >
                    全部 ({orders.length})
                  </button>
                  <button
                    onClick={() => setOrderFilter("處理中")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      orderFilter === "處理中" ? "bg-amber-850 text-white shadow-xs" : "bg-white text-stone-600 hover:text-stone-800 border"
                    }`}
                  >
                    處理中
                  </button>
                  <button
                    onClick={() => setOrderFilter("已出貨")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      orderFilter === "已出貨" ? "bg-blue-800 text-white shadow-xs" : "bg-white text-stone-600 hover:text-stone-800 border"
                    }`}
                  >
                    已出貨
                  </button>
                  <button
                    onClick={() => setOrderFilter("已完成")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      orderFilter === "已完成" ? "bg-green-700 text-white shadow-xs" : "bg-white text-stone-600 hover:text-stone-800 border"
                    }`}
                  >
                    已完成
                  </button>
                  <button
                    onClick={() => setOrderFilter("已取消")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      orderFilter === "已取消" ? "bg-stone-500 text-white shadow-xs" : "bg-white text-stone-600 hover:text-stone-800 border"
                    }`}
                  >
                    已取消
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜尋姓名/電話/訂單編號"
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                    className="bg-white border rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-850 focus:outline-hidden min-w-[200px]"
                  />
                </div>
              </div>

              {/* Data list orders table */}
              {filteredOrders.length === 0 ? (
                <div className="py-12 border border-dashed rounded-xl text-center text-stone-400">
                  查無任何符合條件對應的客戶訂單。
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 font-bold bg-stone-50/50">
                        <th className="p-3">訂單編號</th>
                        <th className="p-3">聯絡詳情</th>
                        <th className="p-3">明細與數量</th>
                        <th className="p-3 text-right">結算金額</th>
                        <th className="p-3">目前狀態</th>
                        <th className="p-3 text-center">狀態更改動作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-amber-50/10 font-medium">
                          <td className="p-3">
                            <span className="font-mono font-bold text-stone-700 block">
                              {order.orderNumber}
                            </span>
                            <span className="text-[10px] text-stone-400 block mt-0.5">
                              {formatDate(order.createdAt)}
                            </span>
                          </td>
                          <td className="p-3 space-y-0.5">
                            <p className="font-bold text-stone-850">{order.customerName}</p>
                            <p className="text-stone-500">{order.customerPhone}</p>
                            <p className="text-[10px] text-stone-400 max-w-[180px] truncate" title={order.customerAddress}>
                              {order.customerAddress}
                            </p>
                          </td>
                          <td className="p-3 max-w-[220px]">
                            <ul className="space-y-0.5 max-h-16 overflow-y-auto text-[11px] list-disc pl-3">
                              {order.items.map((item, idx) => (
                                <li key={idx} className="text-stone-705">
                                  {item.productName} ({item.specs}) x {item.quantity}
                                </li>
                              ))}
                            </ul>
                            {order.notes && (
                              <p className="text-[10px] text-orange-900 bg-orange-50 px-1 py-0.5 rounded mt-1.5 italic">
                                備註: {order.notes}
                              </p>
                            )}
                          </td>
                          <td className="p-3 text-right font-serif font-bold text-stone-850">
                            {formatCurrency(order.totalAmount)}
                            <span className="text-[9px] text-stone-400 block font-sans">
                              {order.paymentMethod === "cod" ? "📦 貨到刷/收" : "🏦 匯款對帳"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              order.status === "處理中" ? "bg-amber-100 text-amber-800 border-amber-200" :
                              order.status === "已出貨" ? "bg-blue-100 text-blue-800 border-blue-200" :
                              order.status === "已完成" ? "bg-green-100 text-green-800 border-green-200" :
                              "bg-stone-100 text-stone-400 border-stone-200"
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1 justify-center">
                              {order.status !== "處理中" && (
                                <button
                                  onClick={() => handleOrderStatusUpdate(order.id, "處理中")}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded font-bold text-[10px] border transition-colors cursor-pointer"
                                >
                                  重設待處
                                </button>
                              )}
                              {order.status === "處理中" && (
                                <button
                                  onClick={() => handleOrderStatusUpdate(order.id, "已出貨")}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded font-bold text-[10px] border transition-colors cursor-pointer"
                                >
                                  核准出貨
                                </button>
                              )}
                              {order.status === "已出貨" && (
                                <button
                                  onClick={() => handleOrderStatusUpdate(order.id, "已完成")}
                                  className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-800 rounded font-bold text-[10px] border transition-colors cursor-pointer"
                                >
                                  確認簽收
                                </button>
                              )}
                              {order.status !== "已取消" && order.status !== "已完成" && (
                                <button
                                  onClick={() => handleOrderStatusUpdate(order.id, "已取消")}
                                  className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded font-bold text-[10px] border transition-colors cursor-pointer"
                                >
                                  取消訂單
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Products Management Panel */}
          {activeAdminTab === "products" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-stone-50 p-4 rounded-xl border border-stone-150">
                <p className="text-xs text-stone-500 font-medium">
                  可管理及異動前台展示之主要花生與糕點商品，包含基本價及團購折扣級距。
                </p>
                <button
                  onClick={() => handleOpenProductModal(null)}
                  className="px-3.5 py-1.5 bg-amber-850 hover:bg-amber-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>新增商品項目</span>
                </button>
              </div>

              {/* Grid Catalog for Admin list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((prod) => (
                  <div key={prod.id} className="border border-stone-150 rounded-xl p-4 bg-white flex flex-col justify-between hover:shadow-xs transition-shadow">
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-3xl p-1 bg-stone-100 rounded-lg">{prod.image}</span>
                        <span className="bg-stone-100 text-stone-605 text-[10px] font-bold px-2 py-0.5 rounded">
                          {prod.category === "peanut" ? "花生" : prod.category === "candy" ? "花生糖" : "配件袋"}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-stone-850 font-serif text-sm">{prod.name}</h4>
                        <p className="text-[10px] text-stone-400">規格：{prod.specs}</p>
                        <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">{prod.description}</p>
                      </div>

                      <div className="bg-stone-50 p-2.5 rounded-lg text-xs">
                        <p className="flex justify-between text-stone-605">
                          <span>零售單價：</span>
                          <strong className="text-stone-800">{formatCurrency(prod.price)}</strong>
                        </p>
                        {prod.bulkDiscounts.length > 0 ? (
                          <div className="border-t border-dashed border-stone-250 mt-1.5 pt-1.5 space-y-1">
                            <p className="text-[10px] text-stone-400 font-semibold">折扣級距：</p>
                            {prod.bulkDiscounts.map((tier, idx) => (
                              <p key={idx} className="flex justify-between text-[10px] text-red-800 font-medium">
                                <span>滿 {tier.minQty} 罐/件起 ─</span>
                                <span>{formatCurrency(tier.discountPrice)} / 單位</span>
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-stone-400 italic mt-1">無團購折扣方案</p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 border-t border-stone-100 pt-3 mt-4">
                      <button
                        onClick={() => handleOpenProductModal(prod)}
                        className="flex-1 py-1 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        編輯品項
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="py-1 px-2 text-stone-400 hover:text-red-700 rounded transition-colors cursor-pointer"
                        title="刪除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3.5: Members CRM/List Panel */}
          {activeAdminTab === "members" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-50 p-4 rounded-xl border border-stone-150">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold font-serif text-natural-text-head flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-natural-brand" />
                    <span>顧客會員名冊彙總</span>
                  </h3>
                  <p className="text-xs text-natural-text-muted">
                    自動分析歷史訂購單，統計出不重複訂購人的配送名冊、已完成與處理中之消費總額與消費頻次。
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleExportMembersCSV}
                    className="px-3.5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    <span>匯出不重複會員名冊 CSV</span>
                  </button>
                </div>
              </div>

              {/* Filtering / Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white pt-1">
                <div className="relative max-w-xs w-full">
                  <input
                    type="text"
                    placeholder="搜尋姓名、電話、地址..."
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-natural-brand focus:outline-hidden font-medium"
                  />
                </div>
                <div className="text-xs text-natural-text-muted font-bold">
                  共計 {filteredMembers.length} 名符合條件會員 ‧ 全體 {members.length} 名 Unique Clients
                </div>
              </div>

              {/* Members Table Details */}
              {filteredMembers.length === 0 ? (
                <div className="py-12 border border-dashed rounded-xl text-center text-stone-400">
                  查無任何符合篩選條件的顧客會員資料。
                </div>
              ) : (
                <div className="overflow-x-auto border border-stone-150 rounded-xl bg-white shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 bg-stone-50/40 font-bold">
                        <th className="p-3">顧客姓名</th>
                        <th className="p-3">聯絡電話</th>
                        <th className="p-3">配送/取貨地址 (最新)</th>
                        <th className="p-3 text-center">累積不重複訂購數</th>
                        <th className="p-3 text-right">累積出貨消費額</th>
                        <th className="p-3">最後處理日期</th>
                        <th className="p-3">歷史相關備註</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium text-stone-700">
                      {filteredMembers.map((m, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/10 transition-colors">
                          <td className="p-3 font-bold text-natural-text-head">
                            {m.name || "無姓名"}
                          </td>
                          <td className="p-3 font-mono text-stone-700">
                            {m.phone}
                          </td>
                          <td className="p-3 text-stone-600 max-w-[200px] truncate" title={m.address}>
                            {m.address || <span className="text-stone-400 italic">自取無填寫</span>}
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-[#FAF3EA] text-natural-brand px-2.5 py-0.5 rounded-full font-bold">
                              {m.orderCount} 次
                            </span>
                          </td>
                          <td className="p-3 text-right font-serif font-bold text-natural-brand text-sm">
                            {formatCurrency(m.totalSpent)}
                          </td>
                          <td className="p-3 text-stone-400 font-mono text-[11px]">
                            {m.lastOrderDate ? formatDate(m.lastOrderDate) : "—"}
                          </td>
                          <td className="p-3 text-[11px] text-stone-500 max-w-[150px] truncate" title={m.notesSummary}>
                            {m.notesSummary || <span className="text-stone-300 italic">無</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {/* Tab 4: System Parameters Settings Panel */}
          {activeAdminTab === "settings" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Box A: Configure group deadline info */}
              <div className="border border-stone-150 rounded-xl p-5 space-y-4 bg-stone-50/30">
                <h3 className="text-sm font-bold font-serif text-stone-800 flex items-center gap-1.5 border-b border-stone-100 pb-2">
                  <Calendar className="w-4 h-4 text-amber-800" />
                  <span>團購活動參數設定</span>
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="set-deadline">
                      訂購截止日期 (展示於前台預訂事項中)：
                    </label>
                    <input
                      id="set-deadline"
                      type="text"
                      placeholder="例：2026年6月30日 或者是隨意敘述"
                      value={groupDeadline}
                      onChange={(e) => setGroupDeadline(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-800"
                    />
                  </div>

                  <button
                    onClick={handleUpdateDeadline}
                    className="w-full py-2 bg-amber-850 hover:bg-amber-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Save className="w-4 h-4" />
                    <span>同步參數到雲端</span>
                  </button>
                </div>
              </div>

              {/* Box B: Reset Admin Password */}
              <form onSubmit={handleResetPassword} className="border border-stone-150 rounded-xl p-5 space-y-4 bg-stone-50/30">
                <h3 className="text-sm font-bold font-serif text-stone-850 flex items-center gap-1.5 border-b border-stone-100 pb-2">
                  <Key className="w-4 h-4 text-amber-800" />
                  <span>重設管理者驗證密碼</span>
                </h3>

                {resetMessage && (
                  <div className="p-2.5 bg-amber-50 text-amber-900 text-xs font-semibold rounded-lg border border-amber-200">
                    {resetMessage}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="old-pass">
                      驗證舊管理者密碼：
                    </label>
                    <input
                      id="old-pass"
                      type="password"
                      required
                      placeholder="輸入目前的密碼"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-805"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="new-pass">
                      輸入安全新密碼：
                    </label>
                    <input
                      id="new-pass"
                      type="password"
                      required
                      placeholder="最少 4 個字元長度"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-805"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>確認重新設定新載密碼</span>
                  </button>
                </div>
              </form>

            </div>
          )}
        </div>
      )}

      {/* product editor dialog modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex justify-center items-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden"
          >
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex justify-between items-center">
              <h3 className="text-base font-serif font-bold text-stone-850">
                {editingProduct ? `編輯商品 ─ ${editingProduct.name}` : "新增全新商品品項"}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="prod-name">
                    商品名稱：
                  </label>
                  <input
                    id="prod-name"
                    type="text"
                    required
                    placeholder="例：五香焙炒花生"
                    value={prodFormName}
                    onChange={(e) => setProdFormName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-850"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="prod-specs">
                    規包規格 / 裝量：
                  </label>
                  <input
                    id="prod-specs"
                    type="text"
                    required
                    placeholder="例：280g/罐"
                    value={prodFormSpecs}
                    onChange={(e) => setProdFormSpecs(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="prod-price">
                    基本零售單價 (元)：
                  </label>
                  <input
                    id="prod-price"
                    type="number"
                    min={1}
                    required
                    value={prodFormPrice}
                    onChange={(e) => setProdFormPrice(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-850"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="prod-cat">
                    商品所屬主題分類：
                  </label>
                  <select
                    id="prod-cat"
                    value={prodFormCategory}
                    onChange={(e) => setProdFormCategory(e.target.value as Product["category"])}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-850"
                  >
                    <option value="peanut">頂級焙炒花生</option>
                    <option value="candy">手工喜糖/花生糖</option>
                    <option value="bag">專屬牛皮提袋</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="prod-img">
                    商品展示貼圖/圖標：
                  </label>
                  <select
                    id="prod-img"
                    value={prodFormImage}
                    onChange={(e) => setProdFormImage(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-850"
                  >
                    <option value="🥜">🥜 花生/炒件</option>
                    <option value="🍬">🍬 減糖糖品</option>
                    <option value="🎁">🎁 手工禮盒</option>
                    <option value="🛍️">🛍️ 伴手紙袋</option>
                    <option value="📦">📦 箱裝貨運</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1" htmlFor="prod-desc">
                  商品簡介 / 烹調細節：
                </label>
                <textarea
                  id="prod-desc"
                  rows={2}
                  value={prodFormDesc}
                  onChange={(e) => setProdFormDesc(e.target.value)}
                  placeholder="簡要描述古法製程或口感..."
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-850 resize-none"
                />
              </div>

              {/* Tiers Discount editor */}
              <div className="border border-stone-200 rounded-xl p-4 space-y-3 bg-stone-50">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-stone-700 flex items-center gap-1">
                    <Layers className="w-4 h-4 text-amber-800" />
                    <span>團購量大優惠折扣方案 (選填)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={addDiscountTier}
                    className="px-2 py-1 bg-amber-850 hover:bg-amber-900 text-white rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>增加折扣門檻</span>
                  </button>
                </div>

                {prodTiers.length === 0 ? (
                  <p className="text-[10px] text-stone-400 italic">目前尚未設定任何團購大宗折扣，客戶將完全以零售原價計算。</p>
                ) : (
                  <div className="space-y-2">
                    {prodTiers.map((tier, idx) => (
                      <div key={idx} className="flex items-center space-x-2 bg-white p-2 border border-stone-150 rounded-lg text-xs font-medium">
                        <span>滿足數量 ≥</span>
                        <input
                          type="number"
                          min={2}
                          value={tier.minQty}
                          onChange={(e) => updateDiscountTier(idx, "minQty", Number(e.target.value))}
                          className="w-16 bg-stone-50 border border-stone-300 rounded px-1.5 py-1 text-center"
                        />
                        <span>件，此件折扣單價變更為NT$:</span>
                        <input
                          type="number"
                          min={1}
                          value={tier.discountPrice}
                          onChange={(e) => updateDiscountTier(idx, "discountPrice", Number(e.target.value))}
                          className="w-20 bg-stone-50 border border-stone-300 rounded px-1.5 py-1 text-center font-bold text-red-700"
                        />
                        <button
                          type="button"
                          onClick={() => removeDiscountTier(idx)}
                          className="p-1 text-stone-400 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="border-t border-stone-150 pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-bold text-stone-600 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-850 hover:bg-amber-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>儲存此商品</span>
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
