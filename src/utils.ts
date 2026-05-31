import { Product } from "./types";

/**
 * Calculates the dynamic unit price of a product depending on quantity ordered and bulk tiers.
 */
export function getProductUnitPrice(product: Product, quantity: number): number {
  if (!product.bulkDiscounts || product.bulkDiscounts.length === 0) {
    return product.price;
  }
  // Sort descending by minQty so we match the largest tier first
  const sortedTiers = [...product.bulkDiscounts].sort((a, b) => b.minQty - a.minQty);
  for (const tier of sortedTiers) {
    if (quantity >= tier.minQty) {
      return tier.discountPrice;
    }
  }
  return product.price;
}

/**
 * Formats numbers into currency format NT$12,345
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace("TWD", "NT$");
}

/**
 * Formats date into human-readable string.
 */
export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return isoString;
  }
}
