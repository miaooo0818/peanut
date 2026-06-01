import { Product } from "./types";
import pepperImage from "./assets/images/bottled_pepper_peanuts_1780245032900.png";
import fivespiceImage from "./assets/images/bottled_fivespice_peanuts_1780245014107.png";
import redImage from "./assets/images/bottled_red_peanuts_1780244994859.png";
import handmadeCandyImage from "./assets/images/giftbox_handmade_candy_1780245071747.png";
import lowsugarCandyImage from "./assets/images/paperbag_lowsugar_candy_1780245053816.png";

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-pepper-peanut",
    name: "焙炒椒麻花生",
    specs: "280g/罐",
    price: 150,
    bulkDiscounts: [
      { minQty: 30, discountPrice: 140 },
      { minQty: 50, discountPrice: 135 }
    ],
    description: "經典香脆焙炒，特選椒麻微辣風味，微麻微辣，佐茶下酒、聚會休閒的絕配良伴。",
    image: pepperImage,
    category: "peanut",
    sortOrder: 1
  },
  {
    id: "prod-spive-peanut",
    name: "焙炒五香花生",
    specs: "280g/罐",
    price: 150,
    bulkDiscounts: [
      { minQty: 30, discountPrice: 140 },
      { minQty: 50, discountPrice: 135 }
    ],
    description: "五香濃郁漫溢，顆顆飽滿香脆，遵循古法精心焙炒，保留最純粹的經典花生香氣氣息。",
    image: fivespiceImage,
    category: "peanut",
    sortOrder: 2
  },
  {
    id: "prod-red-peanut",
    name: "金鑽紅仁花生",
    specs: "280g/罐",
    price: 180,
    bulkDiscounts: [
      { minQty: 30, discountPrice: 170 },
      { minQty: 50, discountPrice: 160 }
    ],
    description: "嚴選在地頂級紅仁花生，外皮晶瑩細緻，富含高營養價值，口感加倍甘甜深邃。",
    image: redImage,
    category: "peanut",
    sortOrder: 3
  },
  {
    id: "prod-handmade-candy",
    name: "手工花生糖",
    specs: "禮盒14入",
    price: 200,
    bulkDiscounts: [
      { minQty: 20, discountPrice: 180 }
    ],
    description: "職人純手工精心製作，獨門麥芽糖黃金比例。酥脆濃郁，香醇持久不黏牙，精裝禮盒最宜大器送禮。",
    image: handmadeCandyImage,
    category: "candy",
    sortOrder: 4
  },
  {
    id: "prod-lowsugar-candy",
    name: "減糖花生糖",
    specs: "140g/包",
    price: 120,
    bulkDiscounts: [
      { minQty: 30, discountPrice: 100 }
    ],
    description: "貼心配製輕盈減糖健康配方，保有關鍵酥脆口感，無任何人工防腐劑，口口純樸輕盈無負擔。",
    image: lowsugarCandyImage,
    category: "candy",
    sortOrder: 5
  },
  {
    id: "prod-small-bag",
    name: "小紙袋",
    specs: "可裝2罐炒花生",
    price: 5,
    bulkDiscounts: [],
    description: "新洽記商行原創經典設計牛皮小紙袋，雅緻小巧，適合提送部分零星餽贈。",
    image: "🛍️",
    category: "bag",
    sortOrder: 6
  },
  {
    id: "prod-large-bag",
    name: "大紙袋",
    specs: "可裝兩盒花生糖禮盒",
    price: 10,
    bulkDiscounts: [],
    description: "新洽記商行經典加厚寬幅大紙袋，挺貼結實，送禮體面、大方且環保。",
    image: "🛍️",
    category: "bag",
    sortOrder: 7
  }
];
