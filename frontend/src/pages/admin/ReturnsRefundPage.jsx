import { useEffect, useState, useMemo } from "react";
import { Search, ChevronDown, RotateCcw, Eye } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const PERIOD_OPTIONS = ["Today", "This Week", "This Month", "Custom"];

const toDateStr = (date) => date.toISOString().split("T")[0];

const getPresetRanges = () => {
  const today = new Date();
  const todayStr = toDateStr(today);

  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    Today: { from: todayStr, to: todayStr },
    "This Week": { from: toDateStr(startOfWeek), to: todayStr },
    "This Month": { from: toDateStr(startOfMonth), to: todayStr },
  };
};

const formatDate = (isoStr) => {
  if (!isoStr) return { datePart: "-", timePart: "" };
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
  return { datePart, timePart };
};

const ReturnsRefundsPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [period, setPeriod] = useState("Custom");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        const res = await api.get("/returns");
        const data = Array.isArray(res.data) ? res.data : [];
        setReturns(data);
      } catch (error) {
        console.error("Error fetching returns history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, []);

  const handlePeriodSelect = (opt) => {
    setPeriod(opt);
    setPeriodOpen(false);
    setSearch("");

    if (opt !== "Custom") {
      const presets = getPresetRanges();
      if (presets[opt]) {
        setFromDate(presets[opt].from);
        setToDate(presets[opt].to);
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    if (e.target.value) {
      setFromDate("");
      setToDate("");
      setPeriod("Custom");
    }
  };

  const handleFromDateChange = (e) => {
    setFromDate(e.target.value);
    setPeriod("Custom");
    if (e.target.value) setSearch("");
  };

  const handleToDateChange = (e) => {
    setToDate(e.target.value);
    setPeriod("Custom");
    if (e.target.value) setSearch("");
  };

  const handleResetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setPeriod("Custom");
  };

  const filteredReturns = useMemo(() => {
    return returns.filter((item) => {
      const matchesSearch =
        !search ||
        item.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
        item.return_no?.toLowerCase().includes(search.toLowerCase());

      const returnDate = item.created_at ? item.created_at.split("T")[0] : "";
      const matchesFrom = !fromDate || returnDate >= fromDate;
      const matchesTo = !toDate || returnDate <= toDate;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [returns, search, fromDate, toDate]);

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Single Row Control Bar Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          {/* Main Title */}
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Sales
          </h1>

          {/* Controls Container in One Line */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-56">
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search by Invoice number"
                className="w-full border border-slate-200 rounded-xl pl-4 pr-9 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-red-500 shadow-sm transition"
              />
              <Search
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* From Date Picker */}
            <input
              type="date"
              value={fromDate}
              onChange={handleFromDateChange}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 bg-white focus:outline-none focus:border-red-500 shadow-sm transition"
            />

            {/* To Date Picker */}
            <input
              type="date"
              value={toDate}
              onChange={handleToDateChange}
              className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 bg-white focus:outline-none focus:border-red-500 shadow-sm transition"
            />

            {/* Period Dropdown */}
            <div className="relative">
              <button
                onClick={() => setPeriodOpen((p) => !p)}
                className="flex items-center justify-between gap-2 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm min-w-[110px]"
              >
                <span>{period}</span>
                <ChevronDown
                  size={14}
                  className={periodOpen ? "rotate-180 transition" : "transition"}
                />
              </button>
              {periodOpen && (
                <div className="absolute right-0 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
                  {PERIOD_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handlePeriodSelect(opt)}
                      className={`w-full text-left px-3 py-1.5 text-xs font-bold hover:bg-slate-50 ${
                        opt === period ? "text-red-600" : "text-slate-700"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reset Filters Button */}
            {(search || fromDate || toDate || period !== "Custom") && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition shadow-sm"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}

            {/* Total Returns Badge */}
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2 text-xs font-bold text-red-600 flex items-center gap-1.5 ml-2 shadow-sm">
              <span>TOTAL RETURNS</span>
              <span className="text-sm font-extrabold text-red-700">
                {filteredReturns.length}
              </span>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500">
                <th className="text-left font-bold text-xs uppercase tracking-wider px-6 py-4">
                  RETURN #
                </th>
                <th className="text-left font-bold text-xs uppercase tracking-wider px-6 py-4">
                  INVOICE #
                </th>
                <th className="text-left font-bold text-xs uppercase tracking-wider px-6 py-4">
                  DATE
                </th>
                <th className="text-left font-bold text-xs uppercase tracking-wider px-6 py-4">
                  TOTAL AMOUNT (PKR)
                </th>
                <th className="text-center font-bold text-xs uppercase tracking-wider px-6 py-4">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 font-semibold text-xs">
                    Loading return records...
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 font-semibold text-xs">
                    No return records found.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((item) => {
                  const { datePart, timePart } = formatDate(item.created_at);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-extrabold text-slate-900">
                        {item.return_no || `RE-${item.id}`}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {item.invoice_no}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-semibold text-xs">
                        {datePart}&nbsp;&nbsp;<span className="text-slate-400">{timePart}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-900 font-black">
                        {Number(item.amount || item.total || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-slate-500 hover:text-slate-800 transition">
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReturnsRefundsPage;