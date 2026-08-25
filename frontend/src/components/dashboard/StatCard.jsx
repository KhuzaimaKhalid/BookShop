const StatCard = ({ icon: Icon, iconBg, iconColor, label, value, trend, trendColor, link, onLinkClick }) => {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 flex-1 min-w-[220px] shadow-sm">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon size={28} color={iconColor} strokeWidth={2} />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {label}
          </span>
          <span className="text-2xl font-extrabold text-slate-900 leading-tight">
            {value}
          </span>
          {trend && (
            <span className="text-xs font-semibold" style={{ color: trendColor }}>
              {trend}
            </span>
          )}
          {link && (
            <button
              onClick={onLinkClick}
              className="text-xs font-bold text-[#CD051F] hover:underline text-left mt-0.5"
            >
              {link}
            </button>
          )}
        </div>
      </div>
    );
  };
  
  export default StatCard;