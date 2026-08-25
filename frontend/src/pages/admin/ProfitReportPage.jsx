import { useEffect, useState, useMemo } from "react";
import { ChevronDown, BarChart2 } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const PERIOD_OPTIONS = ["Today", "This Week", "This Month", "Custom"];

const toDateStr = (date) => date.toISOString().split("T")[0];

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

  return { from: customFrom || "", to: customTo || "" };
};

const formatChartMonth = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short" });
};

const ProfitReportPage = () => {
  const [period, setPeriod] = useState("This Month");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [profitData, setProfitData] = useState(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(
    () => getRangeForPeriod(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  useEffect(() => {
    const fetchProfitReport = async () => {
      try {
        setLoading(true);
        const params = {};
        if (range.from && range.to) {
          params.from = range.from;
          params.to = range.to;
        }
        const res = await api.get("/report/profit", { params });
        setProfitData(res.data);
      } catch (error) {
        console.error("Error fetching profit report:", error);
      } finally {
        setLoading(false);
      }
    };

    if (period === "Custom" && (!customFrom || !customTo)) {
      setLoading(false);
      return;
    }

    fetchProfitReport();
  }, [range, period, customFrom, customTo]);

  const monthlyBreakdown = profitData?.monthly_breakdown || [];

  const lineChartData = useMemo(() => {
    return monthlyBreakdown.map((item) => ({
      month: formatChartMonth(item.month),
      revenue: item.revenue || 0,
      profit: item.profit || 0,
    }));
  }, [monthlyBreakdown]);

  const barChartData = useMemo(() => {
    return monthlyBreakdown.map((item) => ({
      month: formatChartMonth(item.month),
      profit: item.profit || 0,
    }));
  }, [monthlyBreakdown]);

  return (
    <AdminLayout>
      {/* Header & Controls */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
            PROFIT REPORT
          </h1>
          <p className="text-sm text-slate-500">Profit and financial performance</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPeriodOpen((p) => !p)}
              className="flex items-center gap-2 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition min-w-[130px] justify-between"
            >
              {period === "Custom" ? "Select" : period}
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

          {/* Date Picker */}
          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
            <span className="text-sm font-semibold text-slate-800">Custom</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => {
                setCustomFrom(e.target.value);
                setPeriod("Custom");
              }}
              className="text-sm text-slate-700 focus:outline-none"
            />
            <span className="text-xs font-semibold text-slate-500 uppercase px-1">TO</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => {
                setCustomTo(e.target.value);
                setPeriod("Custom");
              }}
              className="text-sm text-slate-700 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <BarChart2 size={24} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL REVENUE</p>
            <p className="text-xl font-extrabold text-slate-900">
              {loading ? "..." : `Rs. ${Number(profitData?.total_revenue || 0).toLocaleString()}`}
            </p>
          </div>
        </div>

        {/* Total Cost */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <BarChart2 size={24} className="text-rose-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL COST</p>
            <p className="text-xl font-extrabold text-slate-900">
              {loading ? "..." : `Rs. ${Number(profitData?.total_cost || 0).toLocaleString()}`}
            </p>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <BarChart2 size={24} className="text-blue-900" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL PROFIT</p>
            <p className="text-xl font-extrabold text-slate-900">
              {loading ? "..." : Number(profitData?.total_profit || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
            <BarChart2 size={24} className="text-purple-700" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PROFIT MARGIN</p>
            <p className="text-xl font-extrabold text-slate-900">
              {loading ? "..." : `${Number(profitData?.profit_margin || 0).toFixed(2)}%`}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Container */}
      <div className="flex flex-wrap lg:flex-nowrap gap-6 items-stretch">
        {/* Line Chart - Revenue vs Profit */}
        <div className="w-full lg:w-7/12 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
              REVENUE VS PROFIT
            </h3>
            <div className="flex items-center gap-4 text-xs font-bold uppercase">
              <span className="flex items-center gap-1.5 text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CD051F]"></span> REVENUE
              </span>
              <span className="flex items-center gap-1.5 text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> PROFIT
              </span>
            </div>
          </div>

          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              Loading chart...
            </div>
          ) : lineChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              No revenue/profit records found.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#1E293B" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `${v / 1000}K`}
                  tick={{ fontSize: 12, fill: "#1E293B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(v, name) => [`Rs. ${Number(v).toLocaleString()}`, name.toUpperCase()]} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#CD051F"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#CD051F" }}
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#10B981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart - Profit */}
        <div className="w-full lg:w-5/12 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-6">
            Profit
          </h3>

          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              Loading chart...
            </div>
          ) : barChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              No profit data found.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={24}>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#1E293B" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `${v / 1000}K`}
                  tick={{ fontSize: 12, fill: "#1E293B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip formatter={(v) => [`Rs. ${Number(v).toLocaleString()}`, "Profit"]} />
                <Bar dataKey="profit" fill="#CD051F" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProfitReportPage;