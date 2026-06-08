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
  sortOrder?: number;
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

export interface BrandConfig {
  logoText: string;      // 文字 Logo 的中文字，如 "洽"
  logoImage?: string;    // 上傳的圖片或者 Logo base64, 如果有，則以圖片顯示為主
  brandName: string;     // 公司/品牌名稱，如 "新洽記商行"
  slogan: string;        // 品牌 slogan，如 "• 經典花生。手工點心 •"
  engName: string;       // 英文名稱或代表字，如 "SIN-HIÁP-KÌ"
  
  // Hero section banner
  heroBadge: string;     // 如 "🥜 經典老舖 ‧ 世代相傳"
  heroTitle: string;     // 如 "古早風味，純手作焙炒。"
  heroSubtitle: string;  // 古法細細慢火低溫焙炒...
  heroBannerImage?: string; // 橫幅背景圖片，可上傳或設定 url
  
  // Footer text
  footerCopyright: string; // "新洽記商行 © 2026 SIN-HIÁP-KÌ. All Rights Reserved."
  footerSubtitle: string;  // "台中中區古法花生糕點名舖 ‧ 系統雲端由 Firestore 數據永固驅動"

  // Preset Theme selection
  themePreset: "classic" | "emerald" | "plum" | "royal" | "cosmic";
}

export interface ThemeColors {
  brand: string;
  brandHover: string;
  brandDark: string;
  brandLight: string;
  brandSubtle: string;
  border: string;
  borderLight: string;
  textMain: string;
  textHead: string;
  textMuted: string;
  bg: string;
}

export const THEME_PRESETS: Record<BrandConfig["themePreset"], ThemeColors> = {
  classic: {
    brand: "#8B5A2B",
    brandHover: "#704822",
    brandDark: "#5D4037",
    brandLight: "#F5E6D3",
    brandSubtle: "#FAF3EA",
    border: "#D2B48C",
    borderLight: "#E6D5C3",
    textMain: "#4A3728",
    textHead: "#5D4037",
    textMuted: "#8B735B",
    bg: "#FDFBF7",
  },
  emerald: {
    brand: "#2C5E43",
    brandHover: "#1E442F",
    brandDark: "#13301F",
    brandLight: "#D1E7DD",
    brandSubtle: "#F0F7F4",
    border: "#8FA89B",
    borderLight: "#C3D2C9",
    textMain: "#1A2F25",
    textHead: "#13301F",
    textMuted: "#5B7B6B",
    bg: "#FAFCFA",
  },
  plum: {
    brand: "#9E2A2B",
    brandHover: "#7A1F21",
    brandDark: "#5C1214",
    brandLight: "#F8D7DA",
    brandSubtle: "#FDF1F2",
    border: "#E09F9F",
    borderLight: "#ECD2D2",
    textMain: "#4D1617",
    textHead: "#5C1214",
    textMuted: "#8E5B5D",
    bg: "#FFFDFC",
  },
  royal: {
    brand: "#2B4C7E",
    brandHover: "#1E355A",
    brandDark: "#12233D",
    brandLight: "#D6E4F0",
    brandSubtle: "#F0F4F8",
    border: "#8DA9C4",
    borderLight: "#C4D3E0",
    textMain: "#152A4A",
    textHead: "#12233D",
    textMuted: "#5C7291",
    bg: "#FAFBFD",
  },
  cosmic: {
    brand: "#C5A880",
    brandHover: "#B3946B",
    brandDark: "#262626",
    brandLight: "#2E2A24",
    brandSubtle: "#1F1E1C",
    border: "#44403C",
    borderLight: "#2C2520",
    textMain: "#E7ECE9",
    textHead: "#F5F5F4",
    textMuted: "#A8A29E",
    bg: "#121212",
  },
};

export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  logoText: "洽",
  brandName: "新洽記商行",
  slogan: "• 經典花生。手工點心 •",
  engName: "SIN-HIÁP-KÌ",
  heroBadge: "🥜 經典老舖 ‧ 世代相傳",
  heroTitle: "古早風味，純手作焙炒。",
  heroSubtitle: "新洽記商行堅持選用頂級金鑽紅仁花生與純淨大麥芽糖。古法細細慢火低溫焙炒，造就每一顆飽滿充實的香郁花生點心，滿滿的真材實料，送禮自用兩相宜。",
  footerCopyright: "新洽記商行 © 2026 SIN-HIÁP-KÌ. All Rights Reserved.",
  footerSubtitle: "台中中區古法花生糕點名舖 ‧ 系統雲端由 Firestore 數據永固驅動",
  themePreset: "classic"
};
