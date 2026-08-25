import { useEffect, useState, useMemo } from "react";
import { Search, Calendar, Eye } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";
import wheelImg from "../../assets/wheel.png";
import InvoiceModal from "../../components/sales/InvoiceModal";

const PAGE_SIZE = 8;

const formatDate = (isoStr) => {
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

const SalesHistoryPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const [totalSales, setTotalSales] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [viewSaleId, setViewSaleId] = useState(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const res = await api.get("/sales");
        const data = Array.isArray(res.data) ? res.data : [];
        setSales(data);
      } catch (error) {
        console.error("Error fetching sales history:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTodaySummary = async () => {
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const res = await api.get("/report/sales", {
          params: { from: todayStr, to: todayStr },
        });
        setTotalSales(res.data?.total_sales || 0);
        setTotalInvoices(res.data?.total_orders || 0);
      } catch (error) {
        console.error("Error fetching today's summary:", error);
      }
    };

    fetchSales();
    fetchTodaySummary();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesSearch = sale.invoice_no
        ?.toLowerCase()
        .includes(search.toLowerCase());

      const saleDate = sale.created_at ? sale.created_at.split(" ")[0] : "";
      const matchesFrom = !fromDate || saleDate >= fromDate;
      const matchesTo = !toDate || saleDate <= toDate;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [sales, search, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedSales = filteredSales.slice(startIdx, startIdx + PAGE_SIZE);

  const handleView = (id) => {
    setViewSaleId(id);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 3;
    for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) pages.push(i);
    return pages;
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">
        Sales
      </h1>

      <div className="flex flex-wrap gap-6 items-start">
        {/* Left: Table Section */}
        <div className="flex-1 min-w-[600px]">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-slate-900 shrink-0">
              Sales History
            </h2>

            <div className="relative w-full max-w-[260px]">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by invoice number"
                className="w-full border border-slate-200 rounded-lg pl-4 pr-9 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#CD051F] transition"
              />
              <Search
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                className="border border-slate-200 rounded-lg pl-4 pr-9 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#CD051F] transition"
              />
            </div>

            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                className="border border-slate-200 rounded-lg pl-4 pr-9 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#CD051F] transition"
              />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-6 py-4">
                    Invoice #
                  </th>
                  <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-6 py-4">
                    Date
                  </th>
                  <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-6 py-4">
                    Total Amount (PKR)
                  </th>
                  <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-6 py-4">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-400 text-sm">
                      Loading sales...
                    </td>
                  </tr>
                ) : paginatedSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-400 text-sm">
                      No sales found.
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map((sale) => {
                    const { datePart, timePart } = formatDate(sale.created_at);
                    return (
                      <tr
                        key={sale.id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition"
                      >
                        <td className="px-6 py-3.5 font-semibold text-slate-800">
                          {sale.invoice_no}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {datePart}&nbsp;&nbsp;{timePart}
                        </td>
                        <td className="px-6 py-3.5 text-slate-700 font-medium">
                          {Number(sale.total).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5">
                          <button
                            onClick={() => handleView(sale.id)}
                            className="text-slate-800 hover:text-[#CD051F] transition"
                            title="View invoice"
                          >
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

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
            <p className="text-xs text-slate-500">
              {filteredSales.length === 0
                ? "Showing 0 Sales"
                : `Showing ${startIdx + 1} to ${Math.min(
                    startIdx + PAGE_SIZE,
                    filteredSales.length
                  )} of ${filteredSales.length} Sales`}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                Previous
              </button>

              {getPageNumbers().map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                    currentPage === num
                      ? "bg-[#CD051F] text-white"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {num}
                </button>
              ))}

              {totalPages > 3 && <span className="text-slate-400 px-1">...</span>}

              {totalPages > 3 && (
                <button
                  onClick={() => setPage(totalPages)}
                  className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                    currentPage === totalPages
                      ? "bg-[#CD051F] text-white"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {totalPages}
                </button>
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Right: Summary Cards */}
        <div className="w-full max-w-[280px] flex flex-col gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-xl bg-[#FEE2E2] flex items-center justify-center mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M23 6l-9.5 9.5-5-5L1 18" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 6h6v6" />
              </svg>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Sales
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              Rs {Number(totalSales).toLocaleString()}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-xl bg-[#FFEDD5] flex items-center justify-center mb-3">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Invoices
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {totalInvoices}
            </p>
          </div>

          <img
            src={wheelImg}
            alt="Decorative wheel"
            className="w-full max-w-[220px] mx-auto object-contain pointer-events-none select-none mt-2"
          />
        </div>
      </div>
      {viewSaleId && (
  <InvoiceModal
    saleId={viewSaleId}
    onClose={() => setViewSaleId(null)}
  />
)}
    </AdminLayout>
  );
};

export default SalesHistoryPage;