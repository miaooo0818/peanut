import { ShoppingBag, Search, ShieldCheck } from "lucide-react";

interface HeaderProps {
  activeTab: "shop" | "lookup" | "admin";
  setActiveTab: (tab: "shop" | "lookup" | "admin") => void;
  cartCount: number;
}

export default function Header({ activeTab, setActiveTab, cartCount }: HeaderProps) {
  return (
    <header className="bg-natural-brand-light/95 backdrop-blur border-b border-natural-border sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          
          {/* Logo & Calligraphy Branding */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-natural-brand rounded-full flex items-center justify-center text-white font-serif text-2xl font-black shadow-sm select-none shrink-0">
              洽
            </div>
            
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-natural-text-head tracking-wider">
                新洽記商行
              </h1>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-xs font-mono font-bold text-natural-brand bg-natural-brand-subtle px-1.5 py-0.5 rounded uppercase border border-natural-border/30 tracking-widest">
                  SIN-HIÁP-KÌ
                </span>
                <span className="text-[10px] text-natural-text-muted font-sans font-semibold">
                  • 經典花生。手工點心 •
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Control Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-natural-border-light/40 p-1 rounded-full self-start md:self-auto border border-natural-border/30">
            <button
              onClick={() => setActiveTab("shop")}
              className={`flex items-center space-x-1.5 px-4.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "shop"
                  ? "bg-natural-brand text-[#FAF3EA] shadow-sm"
                  : "text-natural-text-muted hover:text-natural-text-head hover:bg-natural-brand-subtle"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>線上訂購</span>
              {cartCount > 0 && (
                <span className={`inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full ${
                  activeTab === "shop" ? "bg-natural-brand-light text-natural-brand-dark" : "bg-natural-brand text-white"
                }`}>
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("lookup")}
              className={`flex items-center space-x-1.5 px-4.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "lookup"
                  ? "bg-natural-brand text-[#FAF3EA] shadow-sm"
                  : "text-natural-text-muted hover:text-natural-text-head hover:bg-natural-brand-subtle"
              }`}
            >
              <Search className="w-4 h-4" />
              <span>訂單查詢</span>
            </button>

            {activeTab === "admin" && (
              <button
                onClick={() => setActiveTab("admin")}
                className="flex items-center space-x-1.5 px-4.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer bg-natural-brand text-[#FAF3EA] shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>後台管理</span>
              </button>
            )}
          </nav>

        </div>
      </div>
    </header>
  );
}
