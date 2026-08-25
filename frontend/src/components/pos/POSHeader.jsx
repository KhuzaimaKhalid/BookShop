import { Search, LogOut, ArrowLeft, ArrowRight, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

const POSHeader = ({
  pages = [],
  selectedPageId,
  onSelectPage,
  searchTerm = "",
  onSearchChange,
  onMenuClick,
}) => {
  const navigate = useNavigate();

  // 1. Safely find the current page index (handles id, _id, or page_id)
  const activePageIndex = pages.findIndex((p) => {
    const pageId = p.id ?? p._id ?? p.page_id;
    return String(pageId) === String(selectedPageId);
  });

  // Default to index 0 if not found
  const currentIndex = activePageIndex >= 0 ? activePageIndex : 0;
  const activePage = pages[currentIndex];

  const handlePrevPage = () => {
    if (!pages.length || typeof onSelectPage !== "function") return;
    const prevIdx = (currentIndex - 1 + pages.length) % pages.length;
    const targetPage = pages[prevIdx];
    onSelectPage(targetPage.id ?? targetPage._id ?? targetPage.page_id);
  };

  const handleNextPage = () => {
    if (!pages.length || typeof onSelectPage !== "function") return;
    const nextIdx = (currentIndex + 1) % pages.length;
    const targetPage = pages[nextIdx];
    onSelectPage(targetPage.id ?? targetPage._id ?? targetPage.page_id);
  };

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <header className="w-full h-[70px] sm:h-[90px] bg-white border-b border-black/20 flex items-center justify-between px-3 sm:px-8 shrink-0 gap-2 sm:gap-4 overflow-hidden">
      {/* 1. Left: Hamburger & Brand Logo */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none shrink-0"
          title="Open Categories"
        >
          <Menu size={22} />
        </button>

        <img src={logo} alt="ATR Logo" className="w-8 h-8 sm:w-11 sm:h-11 object-contain shrink-0" />

        <div className="leading-tight hidden sm:block">
          <p className="text-[10px] font-bold text-black/60 tracking-wider">
            POWERED BY
          </p>
          <p className="text-xs font-extrabold text-[#CD051F]">TRUST NEXUS</p>
          <p className="text-[11px] font-medium text-black/80">0303-8184136</p>
        </div>
      </div>

      {/* 2. Page Switcher Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-x border-slate-200 px-2 sm:px-4">
        <button
          onClick={handlePrevPage}
          disabled={pages.length <= 1}
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md bg-[#151B26] text-white hover:bg-[#20293b] disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0"
          title="Previous Page"
        >
          <ArrowLeft size={15} />
        </button>

        <span className="text-xs sm:text-base font-extrabold text-slate-900 uppercase tracking-wide min-w-[70px] sm:min-w-[100px] text-center px-1 truncate">
          {activePage ? (activePage.name || activePage.title) : "PAGE"}
        </span>

        <button
          onClick={handleNextPage}
          disabled={pages.length <= 1}
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md bg-[#CD051F] text-white hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0"
          title="Next Page"
        >
          <ArrowRight size={15} />
        </button>
      </div>

      {/* 3. Center Brand Title */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <span className="text-[#CD051F] font-extrabold text-2xl lg:text-3xl tracking-tight">
          Learning
        </span>
        <span className="text-black font-extrabold text-2xl lg:text-3xl tracking-wider">
          Corner
        </span>
      </div>

      {/* 4. Right: Search & Logout Button */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="relative w-[130px] sm:w-[220px] lg:w-[260px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search parts..."
            className="w-full border border-slate-300 rounded-lg pl-3 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#CD051F] transition"
          />
          <Search
            size={16}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        <button
          onClick={handleLogout}
          className="bg-[#CD051F] hover:bg-red-700 text-white text-[10px] sm:text-xs font-extrabold px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-md transition shadow-sm flex items-center gap-1 shrink-0"
        >
          <LogOut size={13} />
          LOGOUT
        </button>
      </div>
    </header>
  );
};

export default POSHeader;