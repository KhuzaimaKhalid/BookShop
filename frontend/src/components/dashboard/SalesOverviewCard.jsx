import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import api from "../../services/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const RANGE_OPTIONS = ["Daily Sales", "Monthly Sales"];

const SalesOverviewCard = () => {
  const [range, setRange] = useState("Daily Sales");
  const [open, setOpen] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);

        // GET /api/report/daily-sales OR /api/report/monthly-sales
        const endpoint =
          range === "Daily Sales"
            ? "/report/daily-sales"
            : "/report/monthly-sales";

            const response = await api.get(endpoint);
            const data = Array.isArray(response.data) ? response.data : [];
            
            const formattedData = data.map((item) => ({
              day: item.date || item.month || "N/A",
              sales: item.total_sales || 0,
            }));
            
            setSalesData(formattedData);

      } catch (error) {
        console.error("Error fetching sales overview chart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [range]);

  return (
    <div className="relative mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Sales Overview</h3>

        <div className="relative">
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            {range}
            <ChevronDown
              size={14}
              className={open ? "rotate-180 transition" : "transition"}
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setRange(opt);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-slate-50 ${
                    opt === range ? "text-[#CD051F] font-bold" : "text-slate-700"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
          Loading chart...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#CD051F" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#CD051F" stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#CD051F"
              strokeWidth={3}
              fill="url(#salesGradient)"
              dot={{ r: 4, fill: "#CD051F", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default SalesOverviewCard;