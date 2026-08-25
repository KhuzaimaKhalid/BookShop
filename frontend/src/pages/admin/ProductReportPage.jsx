import { useEffect, useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const PERIOD_OPTIONS = ["Today", "This Week", "This Month", "Custom"];

const CATEGORY_COLORS = [
  "#CD051F", // red
  "#16A34A", // green
  "#F97316", // orange
  "#FACC15", // yellow
  "#1E1B4B", // navy
  "#0F766E", // teal
  "#EC4899", // pink
  "#A3A322", // olive
];

const ProductReportPage = () => {
  const [period, setPeriod] = useState("This Week");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [topProducts, setTopProducts] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
  
        // Construct the query parameters dynamically based on selected filters
        let range = {};
  
        if (period === "Today") {
          const today = new Date().toISOString().split("T")[0];
          range = { from: today, to: today };
        } else if (period === "Custom") {
          if (customFrom && customTo) {
            range = { from: customFrom, to: customTo };
          }
        }
        // Note: Backend controllers for /report/products and /report/category-sales
        // default to the last 7 days if 'from' and 'to' are not provided.
  
        const [productsRes, categoryRes] = await Promise.all([
          api.get("/report/products", { params: range }),
          api.get("/report/category-sales", { params: range }),
        ]);
  
        setTopProducts(Array.isArray(productsRes.data) ? productsRes.data.slice(0, 5) : []);
        setCategorySales(Array.isArray(categoryRes.data) ? categoryRes.data : []);
      } catch (error) {
        console.error("Error fetching product report:", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [period, customFrom, customTo]);

  const barData = useMemo(
    () =>
      topProducts.map((p) => ({
        name: p.name,
        sold: p.total_sold || 0,
      })),
    [topProducts]
  );

  const totalCategorySold = categorySales.reduce((sum, c) => sum + (c.total_sold || 0), 0);

  const pieData = useMemo(
    () =>
      categorySales.map((c) => ({
        name: c.name,
        value: c.total_sold || 0,
        percent: totalCategorySold > 0 ? Math.round((c.total_sold / totalCategorySold) * 100) : 0,
      })),
    [categorySales, totalCategorySold]
  );

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Product Report
          </h1>
          <p className="text-sm text-slate-500">Summary of product sales</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 items-start">
        {/* Top 5 Selling Products - Horizontal Bar Chart */}
        <div className="flex-1 min-w-[420px] bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6">
            Top 5 Selling Products
          </h3>

          {loading ? (
            <div className="h-[400px] flex items-center justify-center text-sm text-slate-400">
              Loading chart...
            </div>
          ) : barData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-sm text-slate-400">
              No product sales data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 10, right: 40, left: 10, bottom: 0 }}
                barSize={28}
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 13, fill: "#1E293B", fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip formatter={(v) => [v, "Sold"]} />
                <Bar dataKey="sold" fill="#CD051F" radius={[0, 4, 4, 0]}>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sales by Category - Donut Chart + Legend */}
        <div className="flex-1 min-w-[420px] bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-6">
            Sales by category
          </h3>

          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              Loading chart...
            </div>
          ) : pieData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-slate-400">
              No category sales data available.
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-8">
              <div className="w-[220px] h-[220px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={1}
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 min-w-[180px] flex flex-col gap-3">
                {pieData.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-4 h-4 rounded-sm shrink-0"
                        style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                      />
                      <span className="text-sm font-semibold text-slate-800">
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {entry.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductReportPage;