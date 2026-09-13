import React, { useState, useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const PAGE_SIZE = 8;

const DYNAMIC_COLORS = [
  "#CD051F",
  "#00A651",
  "#FF8042",
  "#FFBB28",
  "#1A0066",
  "#164E4D",
  "#D946EF",
  "#0284C7",
  "#6B7280",
];

const PERIOD_OPTIONS = ["This Week", "Today", "This Month", "This Year", "Custom"];

const formatDate = (isoStr) => {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  const datePart = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}  ${timePart}`;
};

const ExpenseReportPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [timeFilter, setTimeFilter] = useState("This Week");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchExpenseReport = async () => {
      try {
        setLoading(true);
        const res = await api.get("/expenses");
        const data = res.data?.expenses || (Array.isArray(res.data) ? res.data : []);
        setExpenses(data);
      } catch (err) {
        console.error("Error fetching expense records:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenseReport();
  }, []);

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    const now = new Date();

    return expenses.filter((exp) => {
      if (!exp.created_at) return false;
      const expDate = new Date(exp.created_at);

      if (timeFilter === "Custom") {
        const dateStr = exp.created_at.split("T")[0];
        const matchesFrom = !fromDate || dateStr >= fromDate;
        const matchesTo = !toDate || dateStr <= toDate;
        return matchesFrom && matchesTo;
      }

      if (timeFilter === "Today") {
        return expDate.toDateString() === now.toDateString();
      }

      if (timeFilter === "This Week") {
        const startOfWeek = new Date(now);
        const day = now.getDay() || 7;
        startOfWeek.setDate(now.getDate() - day + 1);
        startOfWeek.setHours(0, 0, 0, 0);
        return expDate >= startOfWeek;
      }

      if (timeFilter === "This Month") {
        return (
          expDate.getMonth() === now.getMonth() &&
          expDate.getFullYear() === now.getFullYear()
        );
      }

      if (timeFilter === "This Year") {
        return expDate.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [expenses, timeFilter, fromDate, toDate]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedExpenses = filteredExpenses.slice(startIdx, startIdx + PAGE_SIZE);

  // Total Calculation
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  // Dynamic Expense Grouping (Groups non-other expenses by name, aggregates all is_other expenses into "Other")
  const { summaryList, chartData } = useMemo(() => {
    const map = {};
    let otherTotal = 0;

    filteredExpenses.forEach((exp) => {
      const isOther =
        exp.is_other === 1 ||
        exp.is_other === true ||
        exp.is_other === "1" ||
        exp.is_other === "true";

      const amount = Number(exp.amount) || 0;

      if (isOther) {
        otherTotal += amount;
      } else {
        const name = (exp.name || exp.category || "Uncategorized").trim();
        map[name] = (map[name] || 0) + amount;
      }
    });

    const list = Object.entries(map).map(([name, amount], index) => ({
      name,
      amount,
      color: DYNAMIC_COLORS[index % DYNAMIC_COLORS.length],
    }));

    if (otherTotal > 0 || list.length === 0) {
      list.push({
        name: "Other",
        amount: otherTotal,
        color: DYNAMIC_COLORS[list.length % DYNAMIC_COLORS.length],
      });
    }

    const chart = list
      .filter((item) => item.amount > 0)
      .map((item) => ({
        name: item.name,
        value: item.amount,
        color: item.color,
      }));

    return { summaryList: list, chartData: chart };
  }, [filteredExpenses]);

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Top Bar: Title + Controls in exact 1 Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Expenses
          </h1>

          <div className="flex items-center gap-4">
            {/* Period Select Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm flex items-center justify-between min-w-[160px] hover:bg-slate-50 transition"
              >
                <span>{timeFilter}</span>
                <ChevronDown size={16} className={isDropdownOpen ? "rotate-180 transition" : "transition"} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setTimeFilter(opt);
                        setIsDropdownOpen(false);
                        setPage(1);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold transition hover:bg-slate-50 ${
                        opt === timeFilter ? "text-[#CD051F]" : "text-slate-700"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Date Filters Container */}
            <div className="flex items-center gap-2 bg-[#E2E8F0]/60 border border-slate-300 rounded-lg p-1.5 shadow-sm text-xs font-bold text-slate-700">
              <span className="px-2 font-semibold">Custom</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setTimeFilter("Custom");
                  setPage(1);
                }}
                className="bg-slate-100/80 border border-slate-300 rounded px-2 py-1 focus:outline-none text-slate-600 font-medium"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setTimeFilter("Custom");
                  setPage(1);
                }}
                className="bg-slate-100/80 border border-slate-300 rounded px-2 py-1 focus:outline-none text-slate-600 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Main Grid: Table Left & Summary Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Table & Pagination (8 Columns) */}
          <div className="lg:col-span-8 flex flex-col justify-between min-h-[520px]">
            <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-slate-300 text-slate-800">
                    <th className="text-left font-semibold text-xs px-6 py-3.5">Expense</th>
                    <th className="text-left font-semibold text-xs px-6 py-3.5">Date</th>
                    <th className="text-left font-semibold text-xs px-6 py-3.5">Total Amount (PKR)</th>
                    <th className="text-left font-semibold text-xs px-6 py-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400 font-medium text-xs">
                        Loading expenses...
                      </td>
                    </tr>
                  ) : paginatedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400 font-medium text-xs">
                        No expense records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-3.5 font-semibold text-slate-800 capitalize">
                          {exp.is_other ? "Other" : exp.name}
                        </td>
                        <td className="px-6 py-3.5 text-slate-700 font-medium text-xs whitespace-nowrap">
                          {formatDate(exp.created_at)}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-900">
                          {Number(exp.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 text-xs font-normal">
                          {exp.notes || exp.description || ""}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs font-semibold text-slate-700">
                {filteredExpenses.length === 0
                  ? "Showing 0 Expenses"
                  : `Showing ${startIdx + 1} to ${Math.min(startIdx + PAGE_SIZE, filteredExpenses.length)} of ${filteredExpenses.length} Expenses`}
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setPage(num)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                      currentPage === num
                        ? "bg-[#CD051F] text-white shadow-xs"
                        : "border border-slate-300 text-slate-800 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-md text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Total Card & Donut Chart (4 Columns) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Total Expenses Card */}
            <div className="bg-white border border-slate-300 rounded-xl p-5 shadow-xs text-center">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">TOTAL EXPENSES</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-1">
                Rs {totalAmount.toLocaleString()}
              </p>
            </div>

            {/* Pie Chart & Categorized Legend */}
            <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-xs flex flex-col items-center">
              <div className="w-full h-64 flex items-center justify-center">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={65}
                        outerRadius={100}
                        paddingAngle={1}
                        dataKey="value"
                      >
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-48 h-48 rounded-full border-[10px] border-slate-100" />
                )}
              </div>

              {/* Dynamic Expense Category Color Legend */}
              <div className="w-full mt-4 space-y-2">
                {summaryList.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm font-bold">
                    <span style={{ color: item.color }}>{item.name}</span>
                    <span style={{ color: item.color }}>Rs. {item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ExpenseReportPage;