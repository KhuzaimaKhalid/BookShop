import { useEffect, useState, useMemo } from "react";
import { Search, Eye } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";
import ReturnModal from "../../components/sales/ReturnModal";

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
  return `${datePart}  ${timePart}`;
};

const ReturnsPage = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [viewReturnId, setViewReturnId] = useState(null);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        const res = await api.get("/return");
        setReturns(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Error fetching returns:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, []);

  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      const matchesSearch =
        r.invoice_no?.toLowerCase().includes(search.toLowerCase()) ||
        r.return_no?.toLowerCase().includes(search.toLowerCase());

      const returnDate = r.created_at ? r.created_at.split(" ")[0] : "";
      const matchesFrom = !fromDate || returnDate >= fromDate;
      const matchesTo = !toDate || returnDate <= toDate;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [returns, search, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredReturns.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedReturns = filteredReturns.slice(startIdx, startIdx + PAGE_SIZE);

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

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[260px] max-w-[320px]">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by invoice number"
            className="w-full border border-slate-200 rounded-lg pl-4 pr-9 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#CD051F] transition"
          />
          <Search
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        <input
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(1);
          }}
          className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#CD051F] transition"
        />

        <input
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(1);
          }}
          className="border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#CD051F] transition"
        />

        <div className="flex-1" />

        <div className="bg-[#FEE2E2] rounded-xl px-6 py-3 flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Total Returns
          </span>
          <span className="text-xl font-extrabold text-[#CD051F]">
            {loading ? "..." : filteredReturns.length}
          </span>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-6 py-4">
                Return #
              </th>
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
                <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                  Loading returns...
                </td>
              </tr>
            ) : paginatedReturns.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                  No returns found.
                </td>
              </tr>
            ) : (
              paginatedReturns.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition"
                >
                  <td className="px-6 py-3.5 font-semibold text-slate-800">
                    {r.return_no}
                  </td>
                  <td className="px-6 py-3.5 text-slate-700">
                    {r.invoice_no}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-6 py-3.5 text-slate-700 font-medium">
                    {Number(r.total_refund).toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5">
                    <button
                      onClick={() => setViewReturnId(r.id)}
                      className="text-slate-800 hover:text-[#CD051F] transition"
                      title="View return"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
        <p className="text-xs text-slate-500">
          {filteredReturns.length === 0
            ? "Showing 0 Returns"
            : `Showing ${startIdx + 1} to ${Math.min(
                startIdx + PAGE_SIZE,
                filteredReturns.length
              )} of ${filteredReturns.length} Returns`}
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

      {viewReturnId && (
        <ReturnModal
          returnId={viewReturnId}
          onClose={() => setViewReturnId(null)}
        />
      )}
    </AdminLayout>
  );
};

export default ReturnsPage;