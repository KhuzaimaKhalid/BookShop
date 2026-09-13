import React, { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import api from "../../services/api";

const RecentSalesCard = ({ onViewAll }) => {
  const [recentSales, setRecentSales] = useState([]);
  const [recentSalesCount, setRecentSalesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Helper to accurately parse SQLite timestamps to milliseconds
  const parseSaleTimestamp = (rawDate) => {
    if (!rawDate) return NaN;
    
    // If it's already a timestamp number or string of digits
    if (typeof rawDate === "number" || /^\d+$/.test(rawDate)) {
      return Number(rawDate);
    }

    const str = String(rawDate).trim();

    // Standard ISO string with timezone info
    if (str.includes("Z") || str.includes("+")) {
      return new Date(str).getTime();
    }

    // Convert SQLite standard format 'YYYY-MM-DD HH:MM:SS' into UTC ISO standard
    const formatted = str.replace(" ", "T") + "Z";
    const parsed = new Date(formatted).getTime();

    if (!isNaN(parsed)) return parsed;

    return new Date(str).getTime();
  };

  useEffect(() => {
    const fetchRecentSales = async () => {
      try {
        setLoading(true);
        const response = await api.get("/sales");
        const salesData = Array.isArray(response.data) ? response.data : [];

        const now = Date.now();
        const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

        // Strictly filter sales created within the last 24 hours
        const last24HoursSales = salesData.filter((sale) => {
          const rawDate = sale.created_at || sale.date;
          const saleTime = parseSaleTimestamp(rawDate);

          if (isNaN(saleTime)) return false;

          const diff = now - saleTime;
          return diff >= 0 && diff <= TWENTY_FOUR_HOURS_MS;
        });

        // Sort by newest first
        last24HoursSales.sort((a, b) => {
          const timeA = parseSaleTimestamp(a.created_at || a.date);
          const timeB = parseSaleTimestamp(b.created_at || b.date);
          return timeB - timeA;
        });

        setRecentSalesCount(last24HoursSales.length);
        setRecentSales(last24HoursSales.slice(0, 5));
      } catch (error) {
        console.error("Error fetching recent sales:", error);
        setRecentSales([]);
        setRecentSalesCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSales();
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between h-full min-w-[320px]">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Sales</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading
                ? "Loading..."
                : `You made ${recentSalesCount} sales in the last 24 hours.`}
            </p>
          </div>
          <button
            onClick={onViewAll}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {loading ? (
            <p className="text-xs text-slate-400">Fetching sales...</p>
          ) : recentSales.length === 0 ? (
            <p className="text-xs text-slate-400">No sales made in the last 24 hours.</p>
          ) : (
            recentSales.map((sale) => {
              const invoiceNo = sale.invoice_no || `INV-${sale.id}` || "N/A";
              const rawDate = sale.created_at || sale.date;
              const saleTime = parseSaleTimestamp(rawDate);
              const timeStr = !isNaN(saleTime)
                ? new Date(saleTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";
              const amount = sale.total || sale.total_price || sale.paid_amount || 0;

              return (
                <div
                  key={sale.id || invoiceNo}
                  className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-xs">
                      {String(invoiceNo).slice(-2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-none">
                        {invoiceNo}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{timeStr}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    +Rs {Number(amount).toLocaleString()}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default RecentSalesCard;