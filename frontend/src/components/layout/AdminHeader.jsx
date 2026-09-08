import { useState, useEffect } from "react";
import { Clock, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useLiveClock from "../../hooks/useLiveClock";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import logo from "../../assets/logo.png";

const AdminHeader = ({ onMenuClick }) => {
  const { time, day, date } = useLiveClock();
  const { logout } = useAuth();
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const words = businessName.trim().split(/\s+/);
  const totalLength = businessName.length;

  const getFontSizeClass = (length) => {
    if (length <= 10) return "text-base sm:text-2xl lg:text-3xl [&_*]:!text-[#CD051F]";
    if (length <= 16) return "text-sm sm:text-xl lg:text-2xl [&_*]:!text-[#CD051F]";
    if (length <= 24) return "text-xs sm:text-lg lg:text-xl [&_*]:!text-[#CD051F]";
    return "text-[10px] sm:text-base lg:text-lg [&_*]:!text-[#CD051F]";
  };

  const fontSizeClass = getFontSizeClass(totalLength);

  return (
    <header className="w-full h-[70px] sm:h-[90px] bg-white border-b border-black/20 flex items-center justify-between px-3 sm:px-8 shrink-0 gap-2 sm:gap-4 overflow-hidden">
      {/* 1. Left: Hamburger & Brand Logo with Stacked Branding underneath */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-lg text-slate-800 hover:bg-slate-100 lg:hidden focus:outline-none shrink-0"
          title="Open Menu"
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

      {/* 2. Center Section: Business Name */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 justify-center overflow-hidden">
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

      {/* 3. Right Section: Live Clock & Logout */}
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        <div className="hidden md:flex items-center gap-3 pr-2 sm:pr-4 border-r border-black/20 shrink-0">
          <Clock size={22} className="text-black/80" strokeWidth={1.8} />
          <div className="leading-tight text-left">
            <p className="text-xs sm:text-sm font-bold text-black">{time}</p>
            <p className="text-[10px] sm:text-xs font-semibold text-black/70">{day}</p>
            <p className="text-[10px] sm:text-xs text-black/60">{date}</p>
          </div>
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