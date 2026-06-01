import { Product } from "../types";
import { getProductUnitPrice, formatCurrency } from "../utils";
import { Plus, Minus, Info } from "lucide-react";
import { motion } from "motion/react";

interface ProductCardProps {
  product: Product;
  quantity: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  key?: string;
}

export default function ProductCard({ product, quantity, onUpdateQuantity }: ProductCardProps) {
  const currentUnitPrice = getProductUnitPrice(product, quantity || 1);
  const isDiscounted = currentUnitPrice < product.price;

  // Find which category icon to display
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case "peanut":
        return { bg: "bg-natural-brand-subtle text-natural-brand border-natural-border/30", label: "頂級焙炒花生" };
      case "candy":
        return { bg: "bg-natural-brand-subtle text-natural-text-head border-natural-border/30", label: "職人手工甜品" };
      case "bag":
        return { bg: "bg-white/70 text-natural-text-muted border-natural-border-light", label: "精緻伴手紙袋" };
      default:
        return { bg: "bg-natural-brand-subtle text-natural-brand border-natural-border/30", label: "商品品項" };
    }
  };

  const themeConfig = getCategoryTheme(product.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl border border-natural-border-light hover:border-natural-border hover:shadow-md transition-all overflow-hidden flex flex-col h-full"
    >
      {/* Dynamic Graphic Top Section */}
      <div className="bg-gradient-to-br from-natural-brand-light/25 to-natural-brand-subtle p-6 flex flex-col justify-between relative h-48 border-b border-natural-border/20">
        <div className="flex justify-between items-start z-10 w-full">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${themeConfig.bg}`}>
            {themeConfig.label}
          </span>
          <span className="text-xs font-medium text-stone-500 bg-white/80 backdrop-blur px-2.5 py-1 rounded-full border border-stone-100">
            規格：{product.specs}
          </span>
        </div>

        {/* Floating visual representation */}
        <div className="self-center my-2 select-none filter drop-shadow-sm transform hover:scale-105 transition-transform h-24 max-h-24 flex items-center justify-center">
          {product.image && (product.image.startsWith("http") || product.image.includes("/") || product.image.includes(".")) ? (
            <img
              src={product.image}
              alt={product.name}
              className="max-h-full max-w-full object-contain rounded-lg shadow-xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="text-6xl">{product.image}</span>
          )}
        </div>

        {/* Dynamic Price Tiers quick peek */}
        {product.bulkDiscounts.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
            {product.bulkDiscounts.map((tier, idx) => (
              <span key={idx} className="text-[10px] text-natural-brand bg-natural-brand-subtle border border-natural-border/30 px-2 py-0.5 rounded-md font-bold whitespace-nowrap">
                滿 {tier.minQty} {product.category === "peanut" ? "罐" : "件"} 起 → {formatCurrency(tier.discountPrice)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content details bottom section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-natural-text-head font-serif mb-2 flex justify-between items-baseline">
            <span>{product.name}</span>
          </h3>
          <p className="text-xs text-natural-text-muted leading-relaxed min-h-12 mb-4">
            {product.description}
          </p>
        </div>

        <div>
          {/* Dynamic Price Display */}
          <div className="flex items-center justify-between mb-4 bg-natural-brand-subtle p-3 rounded-xl">
            <span className="text-xs text-natural-text-muted font-medium">單價：</span>
            <div className="text-right">
              {isDiscounted ? (
                <div className="flex flex-col">
                  <span className="text-natural-text-muted line-through text-xs font-medium decoration-natural-border">
                    {formatCurrency(product.price)}
                  </span>
                  <div className="flex items-center space-x-1 justify-end">
                    <span className="text-[11px] font-bold text-natural-brand bg-[#FAF3EA] border border-natural-border/30 px-1 py-0.5 rounded">
                      團購價
                    </span>
                    <span className="text-lg font-bold text-natural-brand">
                      {formatCurrency(currentUnitPrice)}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-lg font-bold text-natural-text-head">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Item Count Increment/Decrement Selector */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-natural-text-muted font-semibold">選購數量：</span>
            
            {quantity > 0 ? (
              <div className="flex items-center space-x-3 bg-natural-brand text-[#FAF3EA] rounded-full p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-natural-brand-hover focus:outline-hidden transition-colors cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-natural-brand-hover focus:outline-hidden transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onUpdateQuantity(product.id, 1)}
                className="px-5 py-2 bg-natural-brand hover:bg-natural-brand-hover text-white font-bold text-xs rounded-full shadow-xs hover:shadow-sm transition-all focus:outline-hidden flex items-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                加入訂購單
              </button>
            )}
          </div>
          
          {/* Dynamic Suggestive Notice to Trigger a Bulk Discount Tier */}
          {product.bulkDiscounts.length > 0 && quantity > 0 && (
            <div className="mt-3 text-right">
              {(() => {
                const pendingTiers = product.bulkDiscounts
                  .filter(t => quantity < t.minQty)
                  .sort((a,b) => a.minQty - b.minQty);
                if (pendingTiers.length > 0) {
                  const nextTier = pendingTiers[0];
                  const diff = nextTier.minQty - quantity;
                  return (
                    <p className="text-[10px] text-natural-brand font-bold animate-pulse">
                      💡 再加 <strong>{diff}</strong> {product.category === "peanut" ? "罐" : "件"}，單價即可省下{" "}
                      <strong>{formatCurrency(currentUnitPrice - nextTier.discountPrice)}</strong>/罐
                    </p>
                  );
                } else if (isDiscounted) {
                  return (
                    <p className="text-[10px] text-green-700 font-bold">
                      🎉 已享有最優惠團購價格！
                    </p>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
