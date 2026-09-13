import { useEffect, useState, useMemo } from "react";
import { Search, Eye, X, Printer, RotateCcw } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const PAGE_SIZE = 8;

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

const SalesHistoryPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  const [totalSales, setTotalSales] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);

  // Modal State for viewing Return Details
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const res = await api.get("/returns");
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

  const handleView = async (id) => {
    try {
      setModalLoading(true);
      const res = await api.get(`/returns/${id}`);
      setSelectedReturn(res.data.return);
      setReturnItems(res.data.items || []);
    } catch (error) {
      console.error("Failed to load return details:", error);
    } finally {
      setModalLoading(false);
    }
  };

  // Search input handler
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    if (e.target.value) {
      setFromDate("");
      setToDate("");
    }
    setPage(1);
  };

  // From Date handler
  const handleFromDateChange = (e) => {
    setFromDate(e.target.value);
    if (e.target.value) {
      setSearch("");
    }
    setPage(1);
  };

  // To Date handler
  const handleToDateChange = (e) => {
    setToDate(e.target.value);
    if (e.target.value) {
      setSearch("");
    }
    setPage(1);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesSearch =
        !search ||
        sale.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
        sale.return_no?.toLowerCase().includes(search.toLowerCase());

      const saleDate = sale.created_at ? sale.created_at.split("T")[0] : "";
      const matchesFrom = !fromDate || saleDate >= fromDate;
      const matchesTo = !toDate || saleDate <= toDate;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [sales, search, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedSales = filteredSales.slice(startIdx, startIdx + PAGE_SIZE);

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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-slate-900 shrink-0">
              Return History
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-48">
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search invoice #"
                  className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#CD051F] transition bg-white"
                />
                <Search
                  size={15}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>

              <input
                type="date"
                value={fromDate}
                onChange={handleFromDateChange}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-[#CD051F] transition bg-white"
              />

              <input
                type="date"
                value={toDate}
                onChange={handleToDateChange}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:border-[#CD051F] transition bg-white"
              />

              {(search || fromDate || toDate) && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                  title="Reset Filters"
                >
                  <RotateCcw size={13} />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
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
                      Loading return history...
                    </td>
                  </tr>
                ) : paginatedSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-400 text-sm">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map((sale) => {
                    const { datePart, timePart } = formatDate(sale.created_at);
                    const amount = Number(sale.total_refund ?? sale.total ?? 0);

                    return (
                      <tr
                        key={sale.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition"
                      >
                        <td className="px-6 py-3.5 font-semibold text-slate-800">
                          {sale.invoice_no}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {datePart}&nbsp;&nbsp;{timePart}
                        </td>
                        <td className="px-6 py-3.5 text-slate-700 font-bold">
                          {amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5">
                          <button
                            onClick={() => handleView(sale.id)}
                            className="text-slate-800 hover:text-[#CD051F] transition cursor-pointer"
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
                ? "Showing 0 Records"
                : `Showing ${startIdx + 1} to ${Math.min(
                    startIdx + PAGE_SIZE,
                    filteredSales.length
                  )} of ${filteredSales.length} Records`}
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

        {/* Right Summary Cards */}
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
        </div>
      </div>

      {/* Return Details Modal */}
      {(selectedReturn || modalLoading) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative">
            {modalLoading ? (
              <div className="p-12 text-center text-slate-500 font-medium">
                Loading Details...
              </div>
            ) : (
              <>
                <div className="bg-[#CD051F] text-white p-5 relative">
                  <button
                    onClick={() => {
                      setSelectedReturn(null);
                      setReturnItems([]);
                    }}
                    className="absolute right-4 top-4 text-white/80 hover:text-white transition cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                  <p className="text-xs font-medium text-white/80">
                    Date: {formatDate(selectedReturn?.created_at).datePart} {formatDate(selectedReturn?.created_at).timePart}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <h2 className="text-xl font-bold tracking-tight">
                      {selectedReturn?.invoice_no}
                    </h2>
                    <span className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-md font-medium">
                      Item: {returnItems.length}
                    </span>
                  </div>
                </div>

                <div className="p-6 max-h-[50vh] overflow-y-auto divide-y divide-slate-100">
                  <div className="grid grid-cols-12 text-xs font-semibold text-slate-400 pb-2">
                    <span className="col-span-6">Item Name</span>
                    <span className="col-span-3 text-center">QTY</span>
                    <span className="col-span-3 text-right">Price</span>
                  </div>

                  {returnItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 items-center py-3 text-sm">
                      <span className="col-span-6 font-semibold text-slate-800">
                        {item.name}
                      </span>
                      <span className="col-span-3 text-center">
                        <span className="bg-slate-100 font-bold px-3 py-1 rounded-md text-xs text-slate-700">
                          {item.qty}
                        </span>
                      </span>
                      <span className="col-span-3 text-right font-semibold text-slate-800">
                        Rs.{Number(item.price).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-6 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-center text-base font-bold text-[#CD051F]">
                    <span>Total</span>
                    <span>
                      Rs.{Number(selectedReturn?.total_refund || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => window.print()}
                      className="w-full bg-[#CD051F] hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <Printer size={18} />
                      Print Invoice
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SalesHistoryPage;