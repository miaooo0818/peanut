import { useState, useEffect } from "react";
import { Product, CartItem, Order } from "./types";
import { seedProductsIfEmpty } from "./dbService";
import Header from "./components/Header";
import ProductCard from "./components/ProductCard";
import Cart from "./components/Cart";
import OrderLookup from "./components/OrderLookup";
import AdminPanel from "./components/AdminPanel";
import { formatCurrency } from "./utils";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, ChevronRight, Copy, Search, ArrowRight, Printer, ShoppingBag } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"shop" | "lookup" | "admin">("shop");
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Success view tracking
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Simple Hidden Routing Effect for /admin
  useEffect(() => {
    const checkRoute = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (
        pathname === "/admin" ||
        pathname.endsWith("/admin") ||
        hash === "#/admin" ||
        hash === "#admin"
      ) {
        setActiveTab("admin");
      }
    };
    // Run on mount
    checkRoute();

    // Listen to url navigation changes
    window.addEventListener("popstate", checkRoute);
    window.addEventListener("hashchange", checkRoute);
    return () => {
      window.removeEventListener("popstate", checkRoute);
      window.removeEventListener("hashchange", checkRoute);
    };
  }, []);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        // Seeds if empty, returns all active products
        const data = await seedProductsIfEmpty();
        setProducts(data);
      } catch (err) {
        console.error("Error loading catalogue: ", err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    // If quantity is 0 or less, remove from cart
    if (quantity <= 0) {
      setCartItems(cartItems.filter((item) => item.product.id !== productId));
      return;
    }

    const existingIndex = cartItems.findIndex((item) => item.product.id === productId);
    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex] = { ...updated[existingIndex], quantity };
      setCartItems(updated);
    } else {
      const targetProduct = products.find((p) => p.id === productId);
      if (targetProduct) {
        setCartItems([...cartItems, { product: targetProduct, quantity }]);
      }
    }
  };

  const handleClearCart = () => setCartItems([]);

  const handleOrderSuccess = (order: Order) => {
    setLastPlacedOrder(order);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("訂單編號已成功複製到剪貼簿！");
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col font-sans selection:bg-natural-brand selection:text-white border-8 border-natural-border-light max-w-[100vw] overflow-x-hidden">
      
      {/* Heritage Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // If customer navigates, clear any success state
          if (tab !== "shop") {
            setLastPlacedOrder(null);
          }
        }}
        cartCount={totalCartCount}
      />

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        <AnimatePresence mode="wait">
          
          {/* View Segment 1: Shopping Online Panel */}
          {activeTab === "shop" && (
            <motion.div
              key="shop-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-12"
            >
              {/* If an order has just been processed successfully */}
              {lastPlacedOrder ? (
                <motion.div 
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="max-w-xl mx-auto bg-white rounded-3xl border border-natural-border p-8 text-center shadow-md"
                >
                  <div className="w-16 h-16 bg-natural-brand-subtle rounded-full flex items-center justify-center mx-auto mb-4 border border-natural-border">
                    <CheckCircle2 className="w-10 h-10 text-natural-brand animate-bounce" />
                  </div>
                  
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-natural-text-head">
                    🎉 您的團購訂單已送往新洽記備貨！
                  </h2>
                  <p className="text-xs text-natural-text-muted mt-1 max-w-sm mx-auto leading-relaxed">
                    感謝您的指名支持，出貨部門已核定您的訂單，正在安排包裝配料流程。
                  </p>

                  {/* High fidelity order details receipt */}
                  <div className="bg-natural-brand-subtle/80 border border-natural-border/55 rounded-2xl p-5 my-6 text-left space-y-4 font-sans text-xs">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-natural-text-muted">團購訂單編號</span>
                      <div className="flex items-center space-x-1.5">
                        <strong className="font-mono text-natural-text-head font-bold bg-natural-brand-light/30 px-2 py-0.5 rounded border border-natural-border/40 uppercase tracking-widest text-[11px]">
                          {lastPlacedOrder.orderNumber}
                        </strong>
                        <button
                          onClick={() => handleCopyToClipboard(lastPlacedOrder.orderNumber)}
                          className="p-1 text-natural-text-muted hover:text-natural-text-head transition-colors cursor-pointer"
                          title="複製編號"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-natural-text-muted">訂購人</p>
                        <p className="font-semibold text-natural-text-head mt-0.5">{lastPlacedOrder.customerName}</p>
                      </div>
                      <div>
                        <p className="text-natural-text-muted">聯絡電話</p>
                        <p className="font-semibold text-natural-text-head mt-0.5">{lastPlacedOrder.customerPhone}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-natural-text-muted">寄送地址 / 領取總舖</p>
                      <p className="font-semibold text-natural-text-head mt-0.5 break-all">{lastPlacedOrder.customerAddress}</p>
                    </div>

                    <div className="flex justify-between items-center border-t pt-3 font-serif">
                      <span className="text-natural-text-head font-bold">總計應付額：</span>
                      <strong className="text-lg text-natural-brand font-bold">
                        {formatCurrency(lastPlacedOrder.totalAmount)}
                      </strong>
                    </div>

                    {lastPlacedOrder.paymentMethod === "transfer" && (
                      <div className="bg-[#FAF3EA] border border-natural-border rounded-xl p-3 text-[10px] sm:text-xs text-natural-text-main leading-relaxed font-semibold">
                        💡 <strong>請盡速安排銀行匯款</strong><br />
                        中信商銀 (822) • 帳戶：045-812953-2384<br />
                        轉帳完畢後，歡迎至「訂單查詢」查看或是對帳。
                      </div>
                    )}
                  </div>

                  {/* Actions navigation shortcut button */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setLastPlacedOrder(null)}
                      className="flex-1 py-2.5 bg-natural-brand hover:bg-natural-brand-hover text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <span>繼續選購花生商品</span>
                    </button>
                    <button
                      onClick={() => {
                        setLastPlacedOrder(null);
                        setActiveTab("lookup");
                      }}
                      className="flex-1 py-2.5 bg-[#FAF3EA] border border-natural-border hover:bg-[#F0E4D4] text-natural-text-head rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>追蹤此訂單進度</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Hero banner visual layout */}
                  <div className="relative rounded-3xl bg-natural-brand-dark border-4 border-natural-border-light p-8 sm:p-12 text-[#FAF3EA] overflow-hidden shadow-sm">
                    {/* Background decorations */}
                    <div className="absolute top-0 bottom-0 right-0 left-0 bg-gradient-to-br from-natural-brand via-natural-brand-dark to-[#4A3728] -z-10" />
                    <div className="absolute right-0 bottom-0 text-9xl opacity-10 font-black font-serif pointer-events-none select-none">
                      洽
                    </div>
                    
                    <div className="max-w-2xl space-y-4">
                      <span className="inline-flex items-center space-x-1 px-3 py-1 bg-natural-brand border border-natural-border rounded-full text-xs font-semibold text-[#FAF3EA] tracking-wider">
                        🥜 經典老舖 ‧ 世代相傳
                      </span>
                      <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight">
                        古早風味，純手作焙炒。
                      </h2>
                      <p className="text-xs sm:text-sm text-natural-brand-light/95 leading-relaxed">
                        新洽記商行堅持選用頂級金鑽紅仁花生與純淨大麥芽糖。
                        古法細細慢火低溫焙炒，造就每一顆飽滿充實的香郁花生點心，
                        滿滿的真材實料，送禮自用兩相宜。
                      </p>
                    </div>
                  </div>

                  {/* Main section: Products selection list */}
                  <div className="space-y-6">
                    <div className="border-b border-natural-border/40 pb-3 flex items-center justify-between">
                      <h3 className="text-lg font-serif font-bold text-natural-text-head">
                        第一步：挑選團購商品品項
                      </h3>
                      <span className="text-xs text-natural-text-muted font-medium">
                        (單項產品起訂 1 單位即可享有雲端配送服務)
                      </span>
                    </div>

                    {loading ? (
                      <div className="py-20 text-center flex flex-col items-center">
                        <svg className="animate-spin h-8 w-8 text-amber-800" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-xs text-stone-500 mt-2 font-medium">正在取得「新洽記商行」最新商品型錄...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => {
                          const cartItem = cartItems.find((item) => item.product.id === product.id);
                          return (
                            <ProductCard
                              key={product.id}
                              product={product}
                              quantity={cartItem ? cartItem.quantity : 0}
                              onUpdateQuantity={handleUpdateQuantity}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Checkout & cart drawer/block */}
                  <div className="mt-12 pt-12 border-t border-natural-border/30">
                    <h3 className="text-lg font-serif font-bold text-natural-text-head mb-6 flex items-center gap-1.5">
                      <span>第二步：確認購物並填單</span>
                    </h3>
                    
                    <Cart
                      cartItems={cartItems}
                      onUpdateQuantity={handleUpdateQuantity}
                      onClearCart={handleClearCart}
                      onOrderSuccess={handleOrderSuccess}
                    />
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* View Segment 2: Lookup Tracking Panel */}
          {activeTab === "lookup" && (
            <motion.div
              key="lookup-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <OrderLookup />
            </motion.div>
          )}

          {/* View Segment 3: System Administrator backend login */}
          {activeTab === "admin" && (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <AdminPanel />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer information */}
      <footer className="bg-natural-brand-subtle border-t border-natural-border/40 py-6 text-center text-xs text-natural-text-muted">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-serif">新洽記商行 © 2026 SIN-HIÁP-KÌ. All Rights Reserved.</p>
          <p className="font-mono text-[10px]">台中中區古法花生糕點名舖 ‧ 系統雲端由 Firestore 數據永固驅動</p>
        </div>
      </footer>

    </div>
  );
}
