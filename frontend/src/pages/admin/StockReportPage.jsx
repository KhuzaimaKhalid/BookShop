import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Package, AlertTriangle, XCircle } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const STATUS_COLORS = {
  "In Stock": "#1E1B4B",     // Navy
  "Low Stock": "#FACC15",    // Yellow
  "Out of Stock": "#CD051F",  // Red
};

const StockReportPage = () => {
  const navigate = useNavigate();
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStockReport = async () => {
      try {
        setLoading(true);
        const res = await api.get("/report/stock");
        setStockList(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error fetching stock report:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockReport();
  }, []);

  // Compute counts based on report data
  const totalItems = stockList.length;
  const lowStockList = useMemo(
    () => stockList.filter((item) => item.stock_status === "Low Stock"),
    [stockList]
  );
  const outOfStockList = useMemo(
    () => stockList.filter((item) => item.stock_status === "Out of Stock"),
    [stockList]
  );
  const inStockCount = stockList.filter((item) => item.stock_status === "In Stock").length;

  // Donut chart calculations
  const donutData = useMemo(() => {
    if (totalItems === 0) return [];
    
    return [
      {
        name: "In Stock",
        value: inStockCount,
        percent: Math.round((inStockCount / totalItems) * 100),
        color: STATUS_COLORS["In Stock"],
      },
      {
        name: "Low Stock",
        value: lowStockList.length,
        percent: Math.round((lowStockList.length / totalItems) * 100),
        color: STATUS_COLORS["Low Stock"],
      },
      {
        name: "Out of Stock",
        value: outOfStockList.length,
        percent: Math.round((outOfStockList.length / totalItems) * 100),
        color: STATUS_COLORS["Out of Stock"],
      },
    ];
  }, [totalItems, inStockCount, lowStockList, outOfStockList]);

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Stock Report
        </h1>
        <p className="text-sm text-slate-500">Current stock status overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Total Stock Items */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Package size={26} className="text-indigo-900" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                TOTAL STOCK ITEMS
              </p>
              <p className="text-2xl font-extrabold text-slate-900">
                {loading ? "..." : totalItems}
              </p>
              <button
                onClick={() => navigate("/admin/products")}
                className="text-xs font-semibold text-[#CD051F] hover:underline mt-0.5 inline-block"
              >
                View Items
              </button>
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={26} className="text-amber-500" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                LOW STOCK ITEMS
              </p>
              <p className="text-2xl font-extrabold text-slate-900">
                {loading ? "..." : lowStockList.length}
              </p>
              <button
                onClick={() => navigate("/admin/products")}
                className="text-xs font-semibold text-[#CD051F] hover:underline mt-0.5 inline-block"
              >
                View Items
              </button>
            </div>
          </div>
        </div>

        {/* Out of Stock Items */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
              <XCircle size={26} className="text-rose-500" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                OUT OF STOCK ITEMS
              </p>
              <p className="text-2xl font-extrabold text-slate-900">
                {loading ? "..." : outOfStockList.length}
              </p>
              <button
                onClick={() => navigate("/admin/products")}
                className="text-xs font-semibold text-[#CD051F] hover:underline mt-0.5 inline-block"
              >
                View Items
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Stock Status Chart & Low Stock Table */}
      <div className="flex flex-wrap lg:flex-nowrap gap-6 items-stretch">
        {/* Donut Chart Card */}
        <div className="w-full lg:w-1/2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight mb-6">
            STOCK STATUS
          </h3>

          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              Loading chart...
            </div>
          ) : donutData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              No stock data available.
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-8 py-4">
              <div className="w-[220px] h-[220px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={0}
                    >
                      {donutData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, name) => [v, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col gap-5 min-w-[160px]">
                {donutData.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-4 h-4 rounded-xs shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm font-bold text-slate-800">
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-slate-900">
                      {entry.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Low Stock Items Table Card */}
        <div className="w-full lg:w-1/2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight mb-4">
              LOW STOCK ITEMS
            </h3>

            <div className="flex flex-col">
              <div className="grid grid-cols-[2fr_2fr_1fr] gap-2 py-2 border-b border-slate-200 bg-slate-50 px-2 rounded-t-md">
                <span className="text-xs font-bold text-slate-700">Item Name</span>
                <span className="text-xs font-bold text-slate-700">Category</span>
                <span className="text-xs font-bold text-slate-700 text-right">QTY</span>
              </div>

              {loading ? (
                <p className="text-sm text-slate-400 text-center py-8">Loading...</p>
              ) : lowStockList.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No low stock items!</p>
              ) : (
                lowStockList.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[2fr_2fr_1fr] gap-2 py-3 px-2 border-b border-slate-100 last:border-0 items-center"
                  >
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {item.name}
                    </span>
                    <span className="text-sm text-slate-600 truncate">
                      {item.category_name || "Uncategorized"}
                    </span>
                    <span className="text-sm font-bold text-slate-900 text-right">
                      {String(item.stock_quantity).padStart(2, "0")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => navigate("/admin/products")}
            className="w-full mt-6 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
          >
            View All Stock
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default StockReportPage;