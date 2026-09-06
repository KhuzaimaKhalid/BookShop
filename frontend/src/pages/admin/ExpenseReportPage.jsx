import { useEffect, useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const CHART_COLORS = [
  "#1A0066", // Electricity (Dark Navy)
  "#F24E1E", // Snacks (Bright Orange-Red)
  "#00A651", // Internet (Green)
  "#CD051F", // Others (Red)
  "#164E4D", // Tea (Dark Teal)
  "#FFBB28", // Transport (Yellow)
  "#FF8042", // Salary (Orange)
  "#D946EF",
  "#0284C7",
];

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

  return { from: customFrom || todayStr, to: customTo || todayStr };
};

const formatTableDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const ExpenseReportPage = () => {
  const [period, setPeriod] = useState("This Week");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const range = useMemo(
    () => getRangeForPeriod(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const res = await api.get("/expenses", { params: range });
        const fetched = res.data?.expenses || (Array.isArray(res.data) ? res.data : []);
        setExpenses(fetched);
      } catch (error) {
        console.error("Error fetching expense report:", error);
      } finally {
        setLoading(false);
      }
    };

    if (period === "Custom" && (!customFrom || !customTo)) {
      setLoading(false);
      return;
    }

    fetchExpenses();
  }, [range, period, customFrom, customTo]);

  // Aggregate Category Totals for Chart & Summary
  const categoryTotals = useMemo(() => {
    const map = {};
    expenses.forEach((exp) => {
      const categoryName = exp.is_other ? "Others" : exp.name || "Uncategorized";
      const amt = Number(exp.amount) || 0;
      map[categoryName] = (map[categoryName] || 0) + amt;
    });

    return Object.keys(map).map((name) => ({
      name,
      amount: map[name],
    }));
  }, [expenses]);

  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [expenses]);

  const chartData = categoryTotals
    .filter((item) => item.amount > 0)
    .map((item) => ({
      name: item.name,
      value: item.amount,
    }));

  // Pagination Calculations
  const totalItems = expenses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentExpenses = expenses.slice(startIndex, startIndex + itemsPerPage);

  return (
    <AdminLayout>
      {/* Top Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Expenses
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPeriodOpen((p) => !p)}
              className="flex items-center gap-2 border border-slate-300 rounded-lg px-5 py-2 text-sm font-medium text-slate-800 bg-white hover:bg-slate-50 transition min-w-[150px] justify-between shadow-sm"
            >
              {period}
              <ChevronDown
                size={16}
                className={periodOpen ? "rotate-180 transition" : "transition"}
              />
            </button>
            {periodOpen && (
              <div className="absolute right-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setPeriod(opt);
                      setPeriodOpen(false);
                      setCurrentPage(1);
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

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-4 py-1.5 bg-white shadow-sm text-sm">
            <span className="font-medium text-slate-700">Custom</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => {
                setCustomFrom(e.target.value);
                setPeriod("Custom");
                setCurrentPage(1);
              }}
              className="text-slate-600 focus:outline-none bg-transparent"
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => {
                setCustomTo(e.target.value);
                setPeriod("Custom");
                setCurrentPage(1);
              }}
              className="text-slate-600 focus:outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Expense Table */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-800 bg-slate-50/50">
                  <th className="py-4 px-6">Expense</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Total Amount (PKR)</th>
                  <th className="py-4 px-6">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      Loading expenses...
                    </td>
                  </tr>
                ) : currentExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      No expenses found for this period.
                    </td>
                  </tr>
                ) : (
                  currentExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {exp.name}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {formatTableDate(exp.created_at)}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-900">
                        {exp.amount}
                      </td>
                      <td className="py-4 px-6 text-slate-500">
                        {exp.description || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Donut Chart & Category Breakdown */}
        <div className="w-full lg:w-80 xl:w-96 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col shrink-0">
          <div className="border border-slate-200 rounded-xl p-4 text-center mb-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              TOTAL Expenses
            </p>
            <p className="text-2xl font-black text-slate-900">
              Rs {totalExpenseAmount.toLocaleString()}
            </p>
          </div>

          <div className="relative w-full h-56 flex items-center justify-center mb-6">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-40 h-40 rounded-full border-8 border-slate-100" />
            )}
          </div>

          <div className="space-y-3">
            {categoryTotals.map((item, idx) => (
              <div
                key={item.name + idx}
                className="flex items-center justify-between text-sm font-bold"
              >
                <span
                  style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}
                  className="truncate pr-2"
                >
                  {item.name}
                </span>
                <span style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}>
                  Rs. {item.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination Bar */}
      {!loading && totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
          <p className="text-sm font-medium text-slate-800">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of{" "}
            {totalItems} Expenses
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition ${
                  currentPage === pageNum
                    ? "bg-[#CD051F] text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ExpenseReportPage;