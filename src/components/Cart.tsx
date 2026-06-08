import { useState, useEffect, FormEvent } from "react";
import { Product, CartItem, Order, OrderItem } from "../types";
import { getProductUnitPrice, formatCurrency } from "../utils";
import { createOrder } from "../dbService";
import { ShoppingCart, Trash2, Calendar, ClipboardCheck, ArrowRight, CheckCircle2, ChevronRight, MapPin, Truck, Landmark, Store } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: Order) => void;
}

export default function Cart({ cartItems, onUpdateQuantity, onClearCart, onOrderSuccess }: CartProps) {
  // Input fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"delivery" | "pickup" | "store_pickup">("delivery");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "transfer">("cod");
  const [notes, setNotes] = useState("");
  
  // Custom group deadline from Firestore admin configs
  const [deadline, setDeadline] = useState("2026/06/30");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    // Fetch group buy settings (e.g. customized deadline date)
    async function fetchSettings() {
      try {
        const docRef = doc(db, "config", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDeadline(docSnap.data().groupBuyDeadline || "2026/06/30");
        }
      } catch {
        // Fallback silently to default
      }
    }
    fetchSettings();
  }, []);

  // Calculate order item summaries
  const orderItemsSummary: OrderItem[] = cartItems.map((item) => {
    const finalUnitPrice = getProductUnitPrice(item.product, item.quantity);
    return {
      productId: item.product.id,
      productName: item.product.name,
      specs: item.product.specs,
      priceAtPurchase: finalUnitPrice,
      quantity: item.quantity,
      subtotal: finalUnitPrice * item.quantity
    };
  });

  const totalAmount = orderItemsSummary.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setErrorText("");

    if (cartItems.length === 0) {
      setErrorText("您的訂購單是空的，請先挑選商品！");
      return;
    }
    if (!customerName.trim()) {
      setErrorText("請填寫訂購人姓名！");
      return;
    }
    if (!customerPhone.trim()) {
      setErrorText("請填寫聯絡電話！");
      return;
    }
    if (shippingMethod === "delivery" && !customerAddress.trim()) {
      setErrorText("請輸入準確的收件地址！");
      return;
    }
    if (shippingMethod === "store_pickup" && !customerAddress.trim()) {
      setErrorText("請填寫全家便利商店店到店的「取件門市」與「6碼店號」！");
      return;
    }
    if (shippingMethod === "store_pickup" && paymentMethod === "cod") {
      setErrorText("全家店到店寄送方式不支援貨到付款，務必選用先「銀行匯款/轉帳」！");
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: 
          shippingMethod === "delivery" 
            ? customerAddress.trim() 
            : shippingMethod === "store_pickup"
              ? `全家店到店：${customerAddress.trim()}`
              : "到店自取 (台中市新洽記總行)",
        shippingMethod,
        paymentMethod,
        notes: notes.trim(),
        items: orderItemsSummary,
        totalAmount,
        status: "處理中" as const
      };

      const finalOrder = await createOrder(orderData);
      onClearCart();
      onOrderSuccess(finalOrder);
    } catch (err: any) {
      setErrorText("送出訂單時發生錯誤，請稍後再試！");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Left Columns: Shopping Cart Items List (8 Cols) */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-natural-border-light p-6 shadow-xs flex flex-col h-full">
        <div className="flex items-center justify-between border-b border-natural-border-light pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-natural-brand" />
            <h2 className="text-xl font-bold font-serif text-natural-text-head">您的訂購項目</h2>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-natural-text-muted hover:text-red-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              清空
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center">
            <span className="text-5xl mb-3 select-none">🥜</span>
            <p className="text-natural-text-head font-bold font-serif text-lg">目前訂購清單空空如也</p>
            <p className="text-natural-text-muted text-xs mt-1">快去上方產品分類挑選美味伴手禮吧！</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-natural-border/30 text-natural-text-muted font-medium">
                    <th className="py-2.5">商品品項 / 規格</th>
                    <th className="py-2.5 text-center px-2">數量</th>
                    <th className="py-2.5 text-right px-2">單價</th>
                    <th className="py-2.5 text-right">小計</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-natural-brand-subtle">
                  {orderItemsSummary.map((item, index) => {
                    // Match original product price to show original unit vs discount unit info
                    const matchedCartItem = cartItems.find((ci) => ci.product.id === item.productId);
                    const originalPrice = matchedCartItem?.product.price || item.priceAtPurchase;
                    const isDiscounted = item.priceAtPurchase < originalPrice;

                    return (
                      <tr key={item.productId} className="hover:bg-natural-brand-subtle/40 transition-colors">
                        <td className="py-4">
                          <p className="font-bold text-natural-text-head font-serif">{item.productName}</p>
                          <span className="text-xs text-natural-brand bg-[#FAF3EA] border border-natural-border/20 px-1.5 py-0.5 rounded font-mono font-bold">
                            {item.specs}
                          </span>
                        </td>
                        
                        {/* Interactive Counter Inside Table */}
                        <td className="py-4 text-center px-2">
                          <div className="inline-flex items-center space-x-2 bg-natural-brand-subtle text-natural-text-head rounded-lg p-0.5 border border-natural-border/20">
                            <button
                              onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-natural-border-light/35 focus:outline-hidden transition-colors cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                            <button
                              onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                              className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-natural-border-light/35 focus:outline-hidden transition-colors cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="py-4 text-right px-2">
                          {isDiscounted ? (
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] text-natural-text-muted line-through">
                                {formatCurrency(originalPrice)}
                              </span>
                              <span className="font-bold text-natural-brand text-xs">
                                {formatCurrency(item.priceAtPurchase)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-natural-text-muted text-xs">
                              {formatCurrency(item.priceAtPurchase)}
                            </span>
                          )}
                        </td>

                        <td className="py-4 text-right font-serif font-bold text-natural-text-head">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Math Block */}
            <div className="border-t border-natural-border/30 pt-5 mt-4 flex flex-col space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-natural-text-muted">商品細計：</span>
                <span className="text-natural-text-head font-bold pr-1">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-dashed border-natural-border/30 pb-3 text-sm">
                <span className="text-natural-text-muted">運費：</span>
                <span className="text-green-700 font-bold pr-1 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                  滿千免運 ‧ 限時優惠 NT$0
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-natural-text-head font-serif font-bold text-base">總計應付：</span>
                <span className="text-2xl font-serif font-bold text-natural-brand">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
            
            {/* Informational Guidelines as display on image flyer */}
            <div className="bg-[#FAF3EA] rounded-xl p-4 border border-natural-border/40 text-xs text-natural-text-main space-y-2 mt-4">
              <div className="flex items-center space-x-1.5 font-bold">
                <Calendar className="w-4 h-4 text-natural-brand" />
                <span>團購預訂重要事項及細則</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed text-natural-text-muted">
                <li>
                  訂購截止日期：<strong className="text-natural-brand font-serif">{deadline} 止</strong>
                </li>
                <li>
                  預計到貨日期：訂購完成及對帳成功後 <strong>14天內</strong> 寄出或通知取貨。
                </li>
                <li>
                  請確實填寫正確完整的聯絡電話與收件地址，以便後續出貨順暢。
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Customer Details Checkout Form (5 Cols) */}
      <form onSubmit={handleSubmitOrder} className="lg:col-span-5 bg-natural-brand-subtle rounded-2xl border border-natural-border p-6 shadow-sm focus-visible:outline-hidden">
        <div className="flex items-center space-x-2 border-b border-natural-border pb-4 mb-6">
          <ClipboardCheck className="w-5 h-5 text-natural-brand" />
          <h2 className="text-xl font-bold font-serif text-natural-text-head">填寫訂購資料</h2>
        </div>

        {errorText && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 text-xs font-semibold rounded-lg border border-red-200">
            {errorText}
          </div>
        )}

        <div className="space-y-4">
          
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-bold text-natural-text-head mb-1.5" htmlFor="cust-name">
              訂購人姓名 <span className="text-red-600">*</span>
            </label>
            <input
              id="cust-name"
              type="text"
              required
              placeholder="例：陳大維"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-white border border-natural-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-natural-brand focus:border-natural-brand transition-all font-medium"
            />
          </div>

          {/* Customer Phone */}
          <div>
            <label className="block text-xs font-bold text-natural-text-head mb-1.5" htmlFor="cust-phone">
              聯絡電話 <span className="text-red-600">*</span>
            </label>
            <input
              id="cust-phone"
              type="tel"
              required
              placeholder="例：0912345678"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full bg-white border border-natural-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-natural-brand focus:border-natural-brand transition-all font-medium"
            />
          </div>

          {/* Shipping Method Selector */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
              <label className="block text-xs font-bold text-natural-text-head">
                配送方式 <span className="text-red-600">*</span>
              </label>
              <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                💡 超商店到店限用「銀行匯款/轉帳」，不支援貨到付款
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setShippingMethod("delivery");
                  setCustomerAddress("");
                }}
                className={`py-2.5 rounded-xl border flex items-center justify-center space-x-1.5 text-xs font-bold transition-all cursor-pointer ${
                  shippingMethod === "delivery"
                    ? "bg-natural-brand text-white border-natural-brand-hover shadow-xs"
                    : "bg-white text-natural-text-head border-natural-border-light hover:bg-[#FAF3EA]"
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>宅配到府</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShippingMethod("store_pickup");
                  setCustomerAddress("");
                  setPaymentMethod("transfer"); // Automatically switch to transfer
                }}
                className={`py-2.5 rounded-xl border flex items-center justify-center space-x-1.5 text-xs font-bold transition-all cursor-pointer ${
                  shippingMethod === "store_pickup"
                    ? "bg-natural-brand text-white border-natural-brand-hover shadow-xs"
                    : "bg-white text-natural-text-head border-natural-border-light hover:bg-[#FAF3EA]"
                }`}
              >
                <Store className="w-4 h-4" />
                <span>超商店到店</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShippingMethod("pickup");
                  setCustomerAddress("");
                }}
                className={`py-2.5 rounded-xl border flex items-center justify-center space-x-1.5 text-xs font-bold transition-all cursor-pointer ${
                  shippingMethod === "pickup"
                    ? "bg-natural-brand text-white border-natural-brand-hover shadow-xs"
                    : "bg-white text-natural-text-head border-natural-border-light hover:bg-[#FAF3EA]"
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>自行到店取貨</span>
              </button>
            </div>
          </div>

          {/* Delivery Details conditionally shown */}
          <AnimatePresence mode="wait">
            {shippingMethod === "delivery" && (
              <motion.div
                key="delivery"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <label className="block text-xs font-bold text-natural-text-head mb-1.5" htmlFor="cust-addr">
                  收件地址 <span className="text-red-600">*</span>
                </label>
                <input
                  id="cust-addr"
                  type="text"
                  required={shippingMethod === "delivery"}
                  placeholder="請輸入精確縣市、道路、門牌號碼"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full bg-white border border-natural-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-natural-brand focus:border-natural-brand transition-all font-medium"
                />
              </motion.div>
            )}

            {shippingMethod === "store_pickup" && (
              <motion.div
                key="store_pickup"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 overflow-hidden text-xs"
              >
                {/* FamilyMart Map Selection Promotion Tool */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 space-y-2 text-stone-800">
                  <div className="flex items-center space-x-1.5 text-emerald-850 font-bold font-serif">
                    <Store className="w-4 h-4 text-emerald-700" />
                    <span>全家便利商店 ── 店到店服務與店舖查詢</span>
                  </div>
                  <p className="text-[11px] text-emerald-800/90 leading-relaxed font-medium">
                    請點選下方按鈕開啟全家官方門市地圖查詢您的取件店舖名稱與六碼店號。
                  </p>
                  <a
                    href="https://fmec.famiport.com.tw/FP_Entrance/QueryShop"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-3 rounded-lg text-[11px] shadow-xs cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <span>🌐 開啟全家店到店選單/地圖</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Store details input box */}
                <div>
                  <label className="block text-xs font-bold text-natural-text-head mb-1.5" htmlFor="store-addr">
                    全家取件門市名稱與六碼店號 <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="store-addr"
                    type="text"
                    required={shippingMethod === "store_pickup"}
                    placeholder="例：全家台中中興店 (店號：012234)"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full bg-white border border-natural-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-natural-brand focus:border-natural-brand transition-all font-medium"
                  />
                </div>
              </motion.div>
            )}

            {shippingMethod === "pickup" && (
              <motion.div
                key="pickup"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[#FAF3EA] rounded-xl p-3 border border-natural-border text-[11px] text-natural-text-head font-medium flex items-start gap-2 overflow-hidden"
              >
                <MapPin className="w-4 h-4 text-natural-brand shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-natural-text-head font-serif">自取總行：新洽記商行</p>
                  <p className="text-natural-text-muted text-[10px]">地址：台中市中區民族路142號 (古意老鋪)</p>
                  <p className="text-natural-text-muted text-[10px] mt-0.5">預約電話：(04) 2221-5088</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Payment Method Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-natural-text-head">
                付款方式 <span className="text-red-600">*</span>
              </label>
              {shippingMethod === "store_pickup" && (
                <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100 animate-pulse">
                  ⚠️ 超商寄送限用匯款
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={shippingMethod === "store_pickup"}
                onClick={() => setPaymentMethod("cod")}
                className={`py-2.5 rounded-xl border flex items-center justify-center space-x-1.5 text-xs font-bold transition-all ${
                  paymentMethod === "cod"
                    ? "bg-natural-brand text-white border-natural-brand-hover shadow-xs"
                    : "bg-white text-natural-text-head border-natural-border-light hover:bg-[#FAF3EA]"
                } ${
                  shippingMethod === "store_pickup"
                    ? "opacity-40 cursor-not-allowed bg-stone-50 border-stone-100 text-stone-400"
                    : "cursor-pointer"
                }`}
                title={shippingMethod === "store_pickup" ? "超商店到店不開放貨到付款" : ""}
              >
                <span>📦 貨到付款</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("transfer")}
                className={`py-2.5 rounded-xl border flex items-center justify-center space-x-1.5 text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === "transfer"
                    ? "bg-natural-brand text-white border-natural-brand-hover shadow-xs"
                    : "bg-white text-natural-text-head border-natural-border-light hover:bg-[#FAF3EA]"
                }`}
              >
                <Landmark className="w-4 h-4" />
                <span>🏦 銀行匯款/轉帳</span>
              </button>
            </div>
            {shippingMethod === "store_pickup" && (
              <p className="text-[10px] text-amber-800 font-semibold mt-1.5 leading-relaxed bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">
                ※ 已選擇「超商店到店」，故付款方式鎖定為「銀行匯款/轉帳」。請於匯款後在下方備註欄提供您的轉帳後五碼，我們將最快為您核對並安排出貨。
              </p>
            )}
          </div>

          {/* Bank Wire Guidelines */}
          {paymentMethod === "transfer" && (
            <motion.div
              layout
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-white/95 border border-natural-border/60 p-3.5 rounded-xl text-xs text-natural-text-main space-y-1.5 leading-relaxed font-semibold shadow-2xs"
            >
              <p className="font-serif font-bold text-natural-brand-dark">新洽記商行 • 銀行匯款資訊：</p>
              <p>銀行代碼：<strong>822 台灣中國信託商業銀行</strong></p>
              <p>帳戶號碼：<strong>045-812953-2384</strong></p>
              <p>備註：轉帳收據請妥善保存，在下方備註填寫轉帳帳號後五碼以利出貨人員對帳。</p>
            </motion.div>
          )}

          {/* Extra Notes */}
          <div>
            <label className="block text-xs font-bold text-natural-text-head mb-1.5" htmlFor="cust-notes">
              備註說明 (可寫匯款後五碼或自取時間 / 裝袋想法)
            </label>
            <textarea
              id="cust-notes"
              rows={2}
              placeholder="例：轉帳後五碼：12345。希望裝入同一大紙袋內送禮用。"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white border border-natural-border-light rounded-xl px-4 py-2.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-natural-brand focus:border-natural-brand transition-all font-medium resize-none"
            />
          </div>

        </div>

        {/* Submit Order Action Button */}
        <button
          type="submit"
          disabled={loading || cartItems.length === 0}
          className={`w-full mt-6 py-3 px-4 rounded-xl text-sm font-bold text-white shadow-md flex items-center justify-center space-x-1.5 transition-all outline-hidden cursor-pointer ${
            cartItems.length === 0
              ? "bg-natural-border-light text-natural-text-muted cursor-not-allowed shadow-none border border-natural-border/10"
              : "bg-natural-brand hover:bg-natural-brand-hover text-[#FAF3EA] transform hover:-translate-y-0.5 active:translate-y-0"
          }`}
        >
          {loading ? (
            <span className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>正在向總行寫入訂購資料...</span>
            </span>
          ) : (
            <>
              <span>確認送出團購訂購單</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>

      </form>
      
    </div>
  );
}
