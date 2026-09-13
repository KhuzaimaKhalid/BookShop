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

const ReturnsPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  // Modal State
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, []);

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

  const handleViewDetails = async (id) => {
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

  // Typing an invoice/return number clears any active date filter
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    if (value) {
      setFromDate("");
      setToDate("");
    }
    setPage(1);
  };

  // Picking a "from" date clears any active search filter
  const handleFromDateChange = (e) => {
    const value = e.target.value;
    setFromDate(value);
    if (value) {
      setSearch("");
    }
    setPage(1);
  };

  // Picking a "to" date clears any active search filter
  const handleToDateChange = (e) => {
    const value = e.target.value;
    setToDate(value);
    if (value) {
      setSearch("");
    }
    setPage(1);
  };

  // Clears every filter and restores the full list
  const handleResetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const hasActiveFilters = Boolean(search || fromDate || toDate);

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

  const totalPages = Math.max(1, Math.ceil(filteredReturns.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedReturns = filteredReturns.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Main Title */}
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
          Returns
        </h1>

        {/* Outer White Card Container matching Figma */}
        <div className="bg-white border border-slate-300 rounded-2xl p-6 shadow-sm">
          {/* Top Control Bar: Inputs & Total Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              {/* Search Bar */}
              <div className="relative w-full max-w-sm">
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by invoice number"
                  className="w-full border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:border-[#CD051F] bg-white transition"
                />
                <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>

              {/* Date Filters */}
              <input
                type="date"
                value={fromDate}
                onChange={handleFromDateChange}
                className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 focus:outline-none focus:border-[#CD051F] bg-white transition"
              />

              <input
                type="date"
                value={toDate}
                onChange={handleToDateChange}
                className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 focus:outline-none focus:border-[#CD051F] bg-white transition"
              />
            </div>

            {/* Total Returns Badge */}
            <div className="bg-[#FCE8EA] border border-[#F8C4C8] rounded-2xl px-6 py-2.5 flex items-center gap-3">
              <span className="text-xs font-bold text-[#CD051F] uppercase tracking-wider">TOTAL RETURNS</span>
              <span className="text-xl font-black text-[#CD051F]">{filteredReturns.length}</span>
            </div>
          </div>

          {/* Reset Button - sits below the filter row, only shown once a filter is active */}
          <div className="mb-6 h-7">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                title="Reset Filters"
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F5F7] border-b border-slate-200 text-slate-800">
                  <th className="font-bold text-xs px-6 py-4">Return #</th>
                  <th className="font-bold text-xs px-6 py-4">Invoice #</th>
                  <th className="font-bold text-xs px-6 py-4">Date</th>
                  <th className="font-bold text-xs px-6 py-4">Total Amount (PKR)</th>
                  <th className="font-bold text-xs px-6 py-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-medium text-xs">
                      Loading return records...
                    </td>
                  </tr>
                ) : paginatedReturns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-medium text-xs">
                      No return records found.
                    </td>
                  </tr>
                ) : (
                  paginatedReturns.map((item) => {
                    const { datePart, timePart } = formatDate(item.created_at);
                    const totalCalculated = Number(item.total_refund ?? item.amount ?? 0);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {item.return_no || `RE-${String(item.id).padStart(5, "0")}`}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {item.invoice_no}
                        </td>
                        <td className="px-6 py-4 text-slate-700 font-semibold text-xs whitespace-nowrap">
                          {datePart}&nbsp;&nbsp;&nbsp;&nbsp;{timePart}
                        </td>
                        <td className="px-6 py-4 text-slate-900 font-extrabold">
                          {totalCalculated.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleViewDetails(item.id)}
                            className="text-slate-800 hover:text-[#CD051F] transition p-1 cursor-pointer"
                            title="View Details"
                          >
                            <Eye size={20} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs font-semibold text-slate-700">
              {filteredReturns.length === 0
                ? "Showing 0 Products"
                : `Showing ${startIdx + 1} to ${Math.min(startIdx + PAGE_SIZE, filteredReturns.length)} of ${filteredReturns.length} Products`}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => setPage(num)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
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
                className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Return Details Modal */}
      {(selectedReturn || modalLoading) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative animate-in fade-in zoom-in duration-150">
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

export default ReturnsPage;