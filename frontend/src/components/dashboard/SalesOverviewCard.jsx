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

const RANGE_OPTIONS = ["Daily Sales", "Weekly Sales", "Monthly Sales"];

const SalesOverviewCard = () => {
  const [range, setRange] = useState("Daily Sales");
  const [open, setOpen] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to format date keys for display
  const formatXAxisLabel = (dateStr, selectedRange) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;

    if (selectedRange === "Daily Sales") {
      return dateObj.toLocaleTimeString([], { hour: "numeric", hour12: true });
    }
    if (selectedRange === "Weekly Sales") {
      return dateObj.toLocaleDateString("en-US", { weekday: "short" });
    }
    return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true);

        const now = new Date();
        let fromDate = new Date();

        if (range === "Daily Sales") {
          fromDate.setHours(0, 0, 0, 0);
        } else if (range === "Weekly Sales") {
          fromDate.setDate(now.getDate() - 6);
          fromDate.setHours(0, 0, 0, 0);
        } else if (range === "Monthly Sales") {
          fromDate.setDate(now.getDate() - 29);
          fromDate.setHours(0, 0, 0, 0);
        }

        const from = fromDate.toISOString().split("T")[0];
        const to = now.toISOString().split("T")[0];

        // Fetch sales using existing date-range backend endpoint
        const response = await api.get(`/sales/date-range?from=${from}&to=${to}`);
        const rawSales = Array.isArray(response.data) ? response.data : [];

        if (range === "Weekly Sales") {
          // Build a dictionary of the last 7 days
          const daysMap = {};
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const key = d.toISOString().split("T")[0];
            const label = d.toLocaleDateString("en-US", { weekday: "short" });
            daysMap[key] = { label, sales: 0 };
          }

          rawSales.forEach((sale) => {
            const saleDate = sale.created_at ? sale.created_at.split("T")[0] : null;
            if (saleDate && daysMap[saleDate]) {
              daysMap[saleDate].sales += Number(sale.total || sale.subtotal || 0);
            }
          });

          setSalesData(Object.values(daysMap));
        } else if (range === "Monthly Sales") {
          // Group sales by day across the 30-day window
          const daysMap = {};
          for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const key = d.toISOString().split("T")[0];
            const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            daysMap[key] = { label, sales: 0 };
          }

          rawSales.forEach((sale) => {
            const saleDate = sale.created_at ? sale.created_at.split("T")[0] : null;
            if (saleDate && daysMap[saleDate]) {
              daysMap[saleDate].sales += Number(sale.total || sale.subtotal || 0);
            }
          });

          setSalesData(Object.values(daysMap));
        } else {
          // Daily Sales grouped by hour
          const hoursMap = {};
          rawSales.forEach((sale) => {
            const label = formatXAxisLabel(sale.created_at, "Daily Sales");
            if (!hoursMap[label]) {
              hoursMap[label] = { label, sales: 0 };
            }
            hoursMap[label].sales += Number(sale.total || sale.subtotal || 0);
          });

          setSalesData(Object.values(hoursMap));
        }
      } catch (error) {
        console.error("Error fetching sales overview chart:", error);
        setSalesData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [range]);

  return (
    <div className="relative mb-2 bg-white p-2 border border-slate-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[9px] font-bold text-slate-900 leading-none uppercase tracking-wider">
          Sales Overview
        </h3>

        <div className="relative">
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            {range}
            <ChevronDown
              size={9}
              className={open ? "rotate-180 transition" : "transition"}
            />
          </button>

          {open && (
            <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-200 rounded shadow-lg z-20 py-0.5">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setRange(opt);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-2 py-0.5 text-[9px] font-medium hover:bg-slate-50 ${
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
        <div className="h-[90px] flex items-center justify-center text-[9px] text-slate-400">
          Loading chart...
        </div>
      ) : salesData.length === 0 ? (
        <div className="h-[90px] flex items-center justify-center text-[9px] text-slate-400">
          No sales recorded for this period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart
            data={salesData}
            margin={{ top: 2, right: 2, left: -25, bottom: 0 }}
          >
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#CD051F" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#CD051F" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
              interval={range === "Monthly Sales" ? "preserveStartEnd" : 0}
            />
            <YAxis
              domain={[0, "auto"]}
              tickFormatter={(v) =>
                v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v}`
              }
              tick={{ fontSize: 9, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(v) => [`Rs ${Number(v).toLocaleString()}`, "Sales"]}
              contentStyle={{ fontSize: "9px", padding: "2px 6px" }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#CD051F"
              strokeWidth={1.5}
              fill="url(#salesGradient)"
              dot={{ r: 2, fill: "#CD051F", strokeWidth: 0 }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default SalesOverviewCard;