import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, TrendingUp, ShoppingCart, Package, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const toDateStr = (date) => date.toISOString().split("T")[0];

const PERIOD_OPTIONS = ["Today", "This Week", "This Month", "Custom"];

const getRangeForPeriod = (period, customFrom, customTo) => {
  const today = new Date();
  const todayStr = toDateStr(today);

  if (period === "Today") {
    return { from: todayStr, to: todayStr };
  }

  if (period === "This Week") {
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diffToMonday = day === 0 ? 6 : day - 1;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);
    return { from: toDateStr(startOfWeek), to: todayStr };
  }

  if (period === "This Month") {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: toDateStr(startOfMonth), to: todayStr };
  }

  // Custom
  return { from: customFrom || todayStr, to: customTo || todayStr };
};

const formatChartDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const formatTableDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
};

const SalesReportPage = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("This Week");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(
    () => getRangeForPeriod(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.get("/report/sales", { params: range });
        setReport(res.data);
      } catch (error) {
        console.error("Error fetching sales report:", error);
      } finally {
        setLoading(false);
      }
    };

    // For "Custom", wait until both dates are picked before fetching
    if (period === "Custom" && (!customFrom || !customTo)) {
      setLoading(false);
      return;
    }

    fetchReport();
  }, [range, period, customFrom, customTo]);

  const chartData = (report?.sales_overview || []).map((item) => ({
    day: formatChartDate(item.date),
    sales: item.total || 0,
  }));

  const recentSales = report?.recent_sales || [];

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sales Report
          </h1>
          <p className="text-sm text-slate-500">Overview of sales performance</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPeriodOpen((p) => !p)}
              className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition min-w-[160px] justify-between"
            >
              {period}
              <ChevronDown size={14} className={periodOpen ? "rotate-180 transition" : "transition"} />
            </button>
            {periodOpen && (
              <div className="absolute right-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setPeriod(opt);
                      setPeriodOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-50 ${
                      opt === period ? "text-[#CD051F] font-bold" : "text-slate-700"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Date Range (only enabled meaningfully when period === "Custom") */}
          <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2.5 bg-white">
            <span className="text-sm font-semibold text-slate-600">Custom</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => {
                setCustomFrom(e.target.value);
                setPeriod("Custom");
              }}
              className="text-sm text-slate-700 focus:outline-none"
              placeholder="From date"
            />
            <span className="text-slate-300">|</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => {
                setCustomTo(e.target.value);
                setPeriod("Custom");
              }}
              className="text-sm text-slate-700 focus:outline-none"
              placeholder="To date"
            />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#FEE2E2] flex items-center justify-center shrink-0">
            <TrendingUp size={26} color="#DC2626" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</p>
            <p className="text-2xl font-extrabold text-slate-900">
              {loading ? "..." : `Rs ${Number(report?.total_sales || 0).toLocaleString()}`}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#FFEDD5] flex items-center justify-center shrink-0">
            <ShoppingCart size={26} color="#EA580C" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-extrabold text-slate-900">
              {loading ? "..." : Number(report?.total_orders || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#FFEDD5] flex items-center justify-center shrink-0">
            <Package size={26} color="#D97706" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Order Value</p>
            <p className="text-2xl font-extrabold text-slate-900">
              {loading ? "..." : `Rs. ${Number(report?.avg_order_value || 0).toFixed(2)}`}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-[#FEE2E2] flex items-center justify-center shrink-0">
            <BarChart3 size={26} color="#DC2626" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Items Sold</p>
            <p className="text-2xl font-extrabold text-slate-900">
              {loading ? "..." : Number(report?.total_items_sold || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Chart + Recent Sales */}
      <div className="flex flex-wrap gap-6 items-start">
        <div className="flex-1 min-w-[400px] bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Sales Overview</h3>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              Loading chart...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${v / 1000}K`}
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, "Sales"]} />
                <Bar dataKey="sales" fill="#CD051F" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="w-full max-w-[420px] bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Recent Sales</h3>

          <div className="flex flex-col">
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Invoice #</span>
              <span className="text-xs font-bold text-slate-500 uppercase">Date</span>
              <span className="text-xs font-bold text-slate-500 uppercase text-right">Amount</span>
            </div>

            {loading ? (
              <p className="text-sm text-slate-400 text-center py-8">Loading...</p>
            ) : recentSales.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No sales found.</p>
            ) : (
              recentSales.map((sale, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_1fr_1fr] gap-2 py-3 border-b border-slate-50 last:border-0"
                >
                  <span className="text-sm font-semibold text-slate-800">{sale.invoice_no}</span>
                  <span className="text-sm text-slate-600">{formatTableDate(sale.created_at)}</span>
                  <span className="text-sm font-medium text-slate-800 text-right">
                    Rs. {Number(sale.total).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => navigate("/admin/sales/history")}
            className="w-full mt-5 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            View All Sales
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default SalesReportPage;