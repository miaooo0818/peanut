import { useState, FormEvent } from "react";
import { findOrdersByCustomer, findOrderByNumber } from "../dbService";
import { Order } from "../types";
import { formatCurrency, formatDate } from "../utils";
import { Search, Package, Clock, ShieldCheck, MailCheck, Coins, HelpCircle, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function OrderLookup() {
  const [lookupMode, setLookupMode] = useState<"name_phone" | "order_number">("name_phone");
  
  // Fields for lookup
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  
  // Collapsible accordion for single orders in results list
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const handleLookup = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setExpandedOrderId(null);

    try {
      if (lookupMode === "name_phone") {
        if (!customerName || !customerPhone) return;
        const results = await findOrdersByCustomer(customerName, customerPhone);
        setOrders(results);
      } else {
        if (!orderNumber) return;
        const singleOrder = await findOrderByNumber(orderNumber);
        setOrders(singleOrder ? [singleOrder] : []);
      }
    } catch (err) {
      console.error("Error looking up order: ", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "處理中":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "已出貨":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "已完成":
        return "bg-green-100 text-green-800 border-green-200";
      case "已取消":
        return "bg-red-50 text-stone-500 border-stone-200";
      default:
        return "bg-stone-100 text-stone-800 border-stone-200";
    }
  };

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Introduction Card */}
      <div className="bg-white rounded-2xl border border-natural-border-light p-6 shadow-xs mb-8 text-center">
        <span className="text-4xl filter drop-shadow-xs select-none">📜</span>
        <h2 className="text-xl font-bold font-serif text-natural-text-head mt-2">新洽記 • 團購訂單自助追蹤</h2>
        <p className="text-xs text-natural-text-muted mt-1 max-w-lg mx-auto">
          輸入您的訂購人姓名與電話，或是訂單送出時產生的專屬訂單編號，即可即時查詢備單狀態、配送快遞資訊或備註。
        </p>

        {/* Tab Selector */}
        <div className="flex justify-center mt-6">
          <div className="bg-natural-brand-subtle p-1 rounded-full flex space-x-1 border border-natural-border/30">
            <button
              onClick={() => {
                setLookupMode("name_phone");
                setOrders([]);
                setSearched(false);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                lookupMode === "name_phone" ? "bg-natural-brand text-white shadow-sm" : "text-natural-text-muted hover:text-natural-text-head"
              }`}
            >
              依姓名 + 電話 查詢
            </button>
            <button
              onClick={() => {
                setLookupMode("order_number");
                setOrders([]);
                setSearched(false);
              }}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                lookupMode === "order_number" ? "bg-natural-brand text-white shadow-sm" : "text-natural-text-muted hover:text-natural-text-head"
              }`}
            >
              依訂單編號 查詢
            </button>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleLookup} className="mt-6 max-w-md mx-auto">
          {lookupMode === "name_phone" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  required
                  placeholder="訂購人姓名"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-white border border-natural-border-light rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-natural-brand focus:border-natural-brand outline-hidden font-medium"
                />
              </div>
              <div>
                <input
                  type="tel"
                  required
                  placeholder="聯絡電話"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white border border-natural-border-light rounded-xl px-4 py-2 text-xs focus:ring-1 focus:ring-natural-brand focus:border-natural-brand outline-hidden font-medium"
                />
              </div>
            </div>
          ) : (
            <div>
              <input
                type="text"
                required
                placeholder="例：SNH-20260531-1234"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full bg-white border border-natural-border-light rounded-xl px-4 py-2.5 text-xs text-center focus:ring-1 focus:ring-natural-brand focus:border-natural-brand outline-hidden font-mono font-bold tracking-widest uppercase"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-natural-brand hover:bg-natural-brand-hover text-white py-2.5 rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>立即查詢訂單狀態</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Query Results Panel */}
      <AnimatePresence mode="wait">
        {searched && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {orders.length === 0 ? (
              <div className="bg-natural-brand-subtle border border-natural-border/30 rounded-2xl p-8 text-center">
                <span className="text-3xl select-none">🧐</span>
                <p className="text-natural-text-head font-bold font-serif mt-2">查無任何訂購單資料</p>
                <p className="text-natural-text-muted text-xs mt-1">
                  請確認您輸入的姓名、電話或訂單編號是否正確（注意有無空格）；若尚未下單，請至「線上訂購」頁面填單。
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-natural-text-muted uppercase tracking-wider mb-2">
                  查詢結果 ({orders.length} 筆訂單)
                </h3>
                
                {orders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  
                  return (
                    <div
                      key={order.id}
                      className="bg-white border border-natural-border-light rounded-2xl shadow-xs overflow-hidden transition-all hover:border-natural-border/60"
                    >
                      {/* Order Core Header Section */}
                      <div
                        onClick={() => toggleExpandOrder(order.id)}
                        className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none bg-natural-brand-subtle/30 hover:bg-natural-brand-subtle/70 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold tracking-wider text-natural-text-head bg-[#FAF3EA] border border-natural-border/30 px-2 py-0.5 rounded">
                              {order.orderNumber}
                            </span>
                            <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="text-xs text-natural-text-muted flex flex-wrap gap-x-3 gap-y-1 pt-1 font-medium">
                            <span className="font-serif">訂購人：<strong>{order.customerName}</strong></span>
                            <span>電話：{order.customerPhone}</span>
                            <span>日期：{formatDate(order.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-natural-border/10 pt-3 sm:pt-0">
                          <div className="text-right">
                            <p className="text-[10px] text-natural-text-muted font-medium">訂單款額</p>
                            <p className="text-base font-serif font-bold text-natural-brand">
                              {formatCurrency(order.totalAmount)}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-stone-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-stone-400 shrink-0" />
                          )}
                        </div>
                      </div>

                      {/* Expandable Order Invoice Items Detail */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden border-t border-natural-border/25"
                          >
                            <div className="p-5 bg-white space-y-4">
                              <h4 className="text-xs font-bold text-natural-text-muted uppercase tracking-wide flex items-center gap-1.5 border-b border-natural-border-light pb-1.5">
                                <Package className="w-4 h-4" />
                                <span>商品細明</span>
                              </h4>
                              
                              <div className="space-y-3">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <div className="space-y-0.5">
                                      <p className="font-bold text-natural-text-head font-serif">
                                        {item.productName}
                                      </p>
                                      <p className="text-[10px] text-natural-text-muted">
                                        規格：{item.specs} x {item.quantity} 件
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] text-natural-text-muted">
                                        單價: {formatCurrency(item.priceAtPurchase)}
                                      </p>
                                      <p className="font-bold font-serif text-natural-text-head mt-0.5">
                                        {formatCurrency(item.subtotal)}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Logistics details */}
                              <div className="border-t border-natural-border/20 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-natural-brand-subtle p-3.5 rounded-xl border border-natural-border/15">
                                <div className="space-y-1 leading-relaxed">
                                  <p className="font-bold text-natural-text-head flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-natural-brand" />
                                    <span>配送與領取細節：</span>
                                  </p>
                                  <p className="text-natural-text-muted font-medium">
                                    方式：{order.shippingMethod === "delivery" ? "🚀 宅配到府" : order.shippingMethod === "store_pickup" ? "🏪 超商店到店 (全家)" : "🏪 自行到總舖取貨"}
                                  </p>
                                  <p className="text-natural-text-muted font-medium">
                                    收件：{order.customerAddress}
                                  </p>
                                </div>

                                <div className="space-y-1 leading-relaxed">
                                  <p className="font-bold text-natural-text-head flex items-center gap-0.5">
                                    <Coins className="w-3.5 h-3.5 text-natural-brand" />
                                    <span>付款明細：</span>
                                  </p>
                                  <p className="text-natural-text-muted font-medium">
                                    管道：{order.paymentMethod === "cod" ? "📦 貨到付款" : "🏦 銀行匯款/轉帳"}
                                  </p>
                                  {order.notes && (
                                    <p className="text-natural-text-muted bg-white px-2 py-1 rounded text-[11px] border border-natural-border/20 overflow-hidden text-ellipsis whitespace-normal">
                                      訂單備註：{order.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Customer satisfaction helper */}
                              <div className="text-center text-[10px] text-natural-text-muted font-bold">
                                如有訂單異動、規格修改需求，請聯絡「新洽記商行」：(04) 2221-5088。
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
