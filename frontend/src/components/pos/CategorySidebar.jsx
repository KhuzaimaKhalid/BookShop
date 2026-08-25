import {
  ChevronRight,
  LayoutGrid,
  Cog,
  CircleDot,
  Waves,
  Filter,
  BatteryCharging,
  Car,
  Droplet,
  Wrench,
  Package,
  X,
} from "lucide-react";

const ICON_RULES = [
  { match: /engine/i, icon: Cog },
  { match: /brake/i, icon: CircleDot },
  { match: /suspension/i, icon: Waves },
  { match: /filter/i, icon: Filter },
  { match: /electric/i, icon: BatteryCharging },
  { match: /body/i, icon: Car },
  { match: /oil|fluid/i, icon: Droplet },
  { match: /accessor/i, icon: Wrench },
];

const getIconFor = (name) => {
  const rule = ICON_RULES.find((r) => r.match.test(name));
  return rule ? rule.icon : Package;
};

const CategorySidebar = ({
  categories = [],
  selectedCategoryId,
  onSelectCategory,
  mobileOpen,
  onClose,
}) => {
  const safeCategories = Array.isArray(categories) ? categories : [];

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Container without Scrollbar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[240px] bg-[#151B26] flex flex-col py-3 overflow-hidden transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:h-full ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-3 mb-2 lg:hidden shrink-0">
            <span className="text-white font-extrabold text-sm tracking-wider">
              CATEGORIES
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>

          {/* All Categories Button */}
          <button
            onClick={() => {
              onSelectCategory(null);
              onClose();
            }}
            className={`mx-3 mb-2 flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition shrink-0 ${
              selectedCategoryId === null
                ? "bg-[#CD051F] text-white shadow-md"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <LayoutGrid size={18} strokeWidth={2} />
            <span>All Categories</span>
          </button>

          {/* Navigation List - Hidden Scrollbar */}
          <nav className="px-3 flex flex-col gap-1 overflow-hidden flex-1">
            {safeCategories.map((cat) => {
              const Icon = getIconFor(cat.name);
              const isActive = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelectCategory(cat.id);
                    onClose();
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#5c1017] text-white font-bold"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon size={16} strokeWidth={2} className="shrink-0" />
                    <span className="truncate">{cat.name}</span>
                  </span>
                  <ChevronRight size={14} className="text-slate-500 shrink-0" />
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default CategorySidebar;