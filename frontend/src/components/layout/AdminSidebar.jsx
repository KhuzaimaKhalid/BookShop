import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutGrid,
  Package,
  ShoppingCart,
  ClipboardList,
  Receipt,
  User,
  ArrowLeft,
  X,
} from "lucide-react";
import api from "../../services/api";
import defaultLogo from "../../assets/book.png";

const navItems = [
  { label: "Dashboard", icon: LayoutGrid, path: "/admin/dashboard" },
  { label: "Manage Inventory", icon: Package, path: "/admin/products" },
  {
    label: "Sales",
    icon: ShoppingCart,
    path: "/admin/sales",
    children: [
      { label: "Sales History", path: "/admin/sales/history" },
      { label: "Returns/Refunds", path: "/admin/sales/returns" },
    ],
  },
  {
    label: "Reports",
    icon: ClipboardList,
    path: "/admin/reports",
    children: [
      { label: "Sales Report", path: "/admin/reports/sales" },
      { label: "Product Report", path: "/admin/reports/products" },
      { label: "Profit Report", path: "/admin/reports/profit" },
      { label: "Stock Report", path: "/admin/reports/stock" },
      { label: "Expense Report", path: "/admin/reports/expense" }
    ],
  },
  { label: "Expenses", icon: Receipt, path: "/admin/expenses" },
  { label: "User", icon: User, path: "/admin/user" },
];

const AdminSidebar = ({ mobileOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState({});
  const [businessLogo, setBusinessLogo] = useState("");
  const [businessName, setBusinessName] = useState("");

  useEffect(() => {
    const fetchBusinessLogo = async () => {
      try {
        const res = await api.get("/business/name");
        if (res?.data?.business) {
          const rawLogo = res.data.business.logo;
          // Construct full image path if server returns relative upload path
          if (rawLogo && !rawLogo.startsWith("http") && !rawLogo.startsWith("blob:")) {
            const baseURL = api.defaults.baseURL ? api.defaults.baseURL.replace(/\/api\/?$/, "") : "";
            setBusinessLogo(`${baseURL}${rawLogo.startsWith('/') ? '' : '/'}${rawLogo}`);
          } else {
            setBusinessLogo(rawLogo || "");
          }
          setBusinessName(res.data.business.name || "");
        }
      } catch (err) {
        console.error("Error loading business logo in sidebar:", err);
      }
    };

    fetchBusinessLogo();
  }, []);

  useEffect(() => {
    const next = {};
    navItems.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((c) =>
          location.pathname.startsWith(c.path)
        );
        if (isChildActive) next[item.label] = true;
      }
    });
    setExpanded((prev) => ({ ...prev, ...next }));
  }, [location.pathname]);

  const toggleExpand = (label) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#151B26] flex flex-col justify-between py-6 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Header with Close Button */}
        <div className="flex items-center justify-between px-4 mb-2 lg:hidden">
          <span className="text-white font-extrabold text-lg tracking-wider">
            ADMIN MENU
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <nav className="px-4 flex flex-col gap-2 overflow-y-auto flex-1">
          {navItems.map(({ label, icon: Icon, path, children }) => {
            const isParentActive = location.pathname.startsWith(path);
            const isOpen = !!expanded[label];

            if (!children) {
              return (
                <NavLink
                  key={label}
                  to={path}
                  onClick={onClose}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition ${
                    isParentActive
                      ? "bg-[#CD051F] text-white shadow-md"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={20} strokeWidth={2} />
                  <span>{label}</span>
                </NavLink>
              );
            }

            return (
              <div key={label} className="flex flex-col">
                <button
                  onClick={() => {
                    toggleExpand(label);
                    navigate(path);
                  }}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-semibold transition w-full text-left ${
                    isParentActive
                      ? "bg-[#CD051F] text-white shadow-md"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={20} strokeWidth={2} />
                  <span>{label}</span>
                </button>

                {isOpen && (
                  <div className="mt-1 ml-5 pl-4 border-l border-white/10 flex flex-col gap-1">
                    {children.map((child) => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={onClose}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition ${
                            isChildActive ? "text-white" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 transition ${
                              isChildActive ? "bg-[#CD051F]" : "bg-slate-500"
                            }`}
                          />
                          {child.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Pinned Bottom Container */}
        <div className="px-4 pt-4 flex flex-col gap-3 items-center shrink-0">
          <img
            src={businessLogo || defaultLogo}
            alt={businessName || "Business Logo"}
            className="w-full max-w-[160px] max-h-24 object-contain drop-shadow-xl pointer-events-none select-none"
          />

          <button
            onClick={() => {
              onClose();
              navigate("/");
            }}
            className="w-full flex items-center justify-center gap-2 bg-transparent border border-white/20 rounded-lg py-2 text-white text-xs font-semibold hover:bg-white/10 transition"
          >
            <ArrowLeft size={16} />
            Back to POS
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;