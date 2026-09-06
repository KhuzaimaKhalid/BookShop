import { useState, useEffect } from "react";
import { Search, LogOut, ArrowLeft, ArrowRight, Menu, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import logo from "../../assets/logo.png";

const POSHeader = ({
  pages = [],
  selectedPageId,
  onSelectPage,
  searchTerm = "",
  onSearchChange,
  onMenuClick,
  showDashboardLink = false,
}) => {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState("LEARNING CORNER");

  useEffect(() => {
    const fetchBusinessName = async () => {
      try {
        const res = await api.get("/business/name");
        if (res?.data?.business?.name) {
          setBusinessName(res.data.business.name);
        }
      } catch (error) {
        console.error("Failed to fetch business name:", error);
      }
    };

    fetchBusinessName();
  }, []);

  const words = businessName.trim().split(/\s+/);
  const totalLength = businessName.length;

  // Auto-adjust font size based on character count so it never overflows
  // (bumped up a size step across the board)
  const getFontSizeClass = (length) => {
    if (length <= 10) return "text-lg sm:text-3xl lg:text-4xl";
    if (length <= 16) return "text-base sm:text-2xl lg:text-3xl";
    if (length <= 24) return "text-sm sm:text-xl lg:text-2xl";
    return "text-xs sm:text-lg lg:text-xl";
  };

  const fontSizeClass = getFontSizeClass(totalLength);

  const activePageIndex = pages.findIndex((p) => {
    const pageId = p.id ?? p._id ?? p.page_id;
    return String(pageId) === String(selectedPageId);
  });

  const currentIndex = activePageIndex >= 0 ? activePageIndex : 0;
  const activePage = pages[currentIndex];

  // 1. Updated navigation handlers (stop wrapping around when clicking prev/next)
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < pages.length - 1;

  const handlePrevPage = () => {
    if (!hasPrev || typeof onSelectPage !== "function") return;
    const targetPage = pages[currentIndex - 1];
    onSelectPage(targetPage.id ?? targetPage._id ?? targetPage.page_id);
  };

  const handleNextPage = () => {
    if (!hasNext || typeof onSelectPage !== "function") return;
    const targetPage = pages[currentIndex + 1];
    onSelectPage(targetPage.id ?? targetPage._id ?? targetPage.page_id);
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <header className="w-full h-[70px] sm:h-[90px] bg-white border-b border-black/20 flex items-center justify-between px-3 sm:px-8 shrink-0 gap-2 sm:gap-4 overflow-hidden">
      {/* 1. Left: Hamburger & Brand Logo with Branding underneath */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none shrink-0"
          title="Open Categories"
        >
          <Menu size={22} />
        </button>

        <div className="flex flex-col items-center text-center shrink-0">
          <img src={logo} alt="ATR Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          <div className="leading-tight mt-0.5">
            <p className="text-[7px] sm:text-[8px] font-bold text-black/60 tracking-wider uppercase">
              POWERED BY
            </p>
            <p className="text-[9px] sm:text-[10px] font-extrabold text-[#CD051F]">
              TRUST NEXUS
            </p>
            <p className="text-[8px] sm:text-[9px] font-medium text-black/80">
              0303-8184136
            </p>
          </div>
        </div>
      </div>

      {/* 2. Page Switcher Controls (or Dashboard link) */}
      {/* 2. Page Switcher Controls (or Dashboard link) */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-x border-slate-200 px-2 sm:px-4">
        {showDashboardLink ? (
          <button
            onClick={() => navigate("/pos")}
            className="flex items-center gap-1.5 bg-[#151B26] hover:bg-[#20293b] text-white font-extrabold text-xs sm:text-sm uppercase tracking-wide px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition shrink-0"
            title="Back to Dashboard"
          >
            <LayoutDashboard size={15} />
            Dashboard
          </button>
        ) : (
          <>
            {/* Left Arrow: Red if hasPrev, Black otherwise */}
            <button
              onClick={handlePrevPage}
              disabled={!hasPrev}
              className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md text-white transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${hasPrev
                  ? "bg-[#CD051F] hover:bg-red-700"
                  : "bg-[#151B26] hover:bg-[#20293b]"
                }`}
              title="Previous Page"
            >
              <ArrowLeft size={15} />
            </button>

            <span className="text-xs sm:text-base font-extrabold text-slate-900 uppercase tracking-wide min-w-[70px] sm:min-w-[100px] text-center px-1 truncate">
              {activePage ? (activePage.name || activePage.title) : "PAGE"}
            </span>

            {/* Right Arrow: Red if hasNext, Black otherwise */}
            <button
              onClick={handleNextPage}
              disabled={!hasNext}
              className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md text-white transition shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${hasNext
                  ? "bg-[#CD051F] hover:bg-red-700"
                  : "bg-[#151B26] hover:bg-[#20293b]"
                }`}
              title="Next Page"
            >
              <ArrowRight size={15} />
            </button>
          </>
        )}
      </div>

      {/* 3. Center Brand Title (Dynamic & Auto-Scaled) */}
      <div className="hidden md:flex items-center flex-1 min-w-0 justify-center overflow-hidden">
        <div
          className={`flex items-baseline gap-1 sm:gap-2 leading-none font-extrabold tracking-tight whitespace-nowrap overflow-hidden max-w-full ${fontSizeClass}`}
          title={businessName}
        >
          {words.map((word, index) => (
            <span
              key={index}
              className={index % 2 === 0 ? "text-[#CD051F]" : "text-black"}
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      {/* 4. Right: Expense/Course, Search & Logout Button */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Expense & Course Navigation Buttons - now beside the search bar */}
        <div className="hidden sm:flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => navigate("/expenses")}
            className="bg-[#CD051F] hover:bg-red-700 text-white font-bold text-xs px-4 py-1 rounded-md transition shadow-sm text-center"
          >
            Expense
          </button>
          <button
            onClick={() => navigate("/courses")}
            className="bg-[#CD051F] hover:bg-red-700 text-white font-bold text-xs px-4 py-1 rounded-md transition shadow-sm text-center"
          >
            Course
          </button>
        </div>

        <div className="relative w-[130px] sm:w-[220px] lg:w-[260px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search items by name..."
            className="w-full border border-slate-300 rounded-lg pl-3 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#CD051F] transition"
          />
          <Search
            size={16}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        <button
          onClick={handleLogin}
          className="bg-[#CD051F] hover:bg-red-700 text-white text-[10px] sm:text-xs font-extrabold px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-md transition shadow-sm flex items-center gap-1 shrink-0"
        >
          <LogOut size={13} />
          ADMIN LOGIN
        </button>
      </div>
    </header>
  );
};

export default POSHeader;