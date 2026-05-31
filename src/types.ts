export interface DiscountTier {
  minQty: number;
  discountPrice: number;
}

export interface Product {
  id: string;
  name: string;
  specs: string;
  price: number;
  bulkDiscounts: DiscountTier[];
  description: string;
  image: string; // placeholder description or visual indicator
  category: "peanut" | "candy" | "bag";
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  specs: string;
  priceAtPurchase: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string; // SNH-YYYYMMDD-XXXX
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
  shippingMethod: "delivery" | "pickup";
  paymentMethod: "cod" | "transfer";
  items: OrderItem[];
  totalAmount: number;
  status: "處理中" | "已出貨" | "已完成" | "已取消";
  createdAt: string;
  updatedAt: string;
}
