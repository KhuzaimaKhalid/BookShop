import { Clock, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useLiveClock from "../../hooks/useLiveClock";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

const AdminHeader = ({ onMenuClick }) => {
  const { time, day, date } = useLiveClock();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="w-full h-[70px] sm:h-[90px] bg-white border-b border-black/20 flex items-center justify-between px-3 sm:px-8 shrink-0 gap-2 sm:gap-4 overflow-hidden">
      {/* 1. Left: Hamburger & Brand Logo */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none shrink-0"
          title="Open Menu"
        >
          <Menu size={22} />
        </button>

        <img src={logo} alt="ATR Logo" className="w-8 h-8 sm:w-11 sm:h-11 object-contain shrink-0" />
      </div>

      {/* 2. Center Heading (Always visible, scaled down on mobile) */}
      <div className="flex items-baseline gap-1 sm:gap-2 leading-none shrink-0">
        <span className="text-[#CD051F] font-extrabold text-base sm:text-2xl lg:text-3xl tracking-tight">
          Learning
        </span>
        <span className="text-black font-extrabold text-base sm:text-2xl lg:text-3xl tracking-wider">
          Corner
        </span>
      </div>

      {/* 3. Live Clock Widget (Desktop/Tablet) */}
      <div className="hidden md:flex items-center gap-3 pl-6 border-l border-black/20 shrink-0">
        <Clock size={24} className="text-black/80" strokeWidth={1.8} />
        <div className="leading-tight text-left">
          <p className="text-sm font-bold text-black">{time}</p>
          <p className="text-xs font-semibold text-black/70">{day}</p>
          <p className="text-xs text-black/60">{date}</p>
        </div>
      </div>

      {/* 4. Right: Powered By & Logout */}
      <div className="flex items-center gap-2 sm:gap-6 shrink-0">
        <div className="text-right leading-tight hidden lg:block">
          <p className="text-[10px] font-bold text-black/60 tracking-wider">
            POWERED BY
          </p>
          <p className="text-xs font-extrabold text-[#CD051F]">
            TRUST NEXUS
          </p>
          <p className="text-[11px] font-medium text-black/80">
            0303-8184136
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-[#CD051F] hover:bg-red-700 text-white text-[10px] sm:text-xs font-extrabold px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-md transition shadow-sm whitespace-nowrap shrink-0"
        >
          LOGOUT
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;