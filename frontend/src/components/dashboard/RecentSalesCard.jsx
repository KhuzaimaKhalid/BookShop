import React, { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import api from "../../services/api";

const RecentSalesCard = ({ onViewAll }) => {
  const [recentSales, setRecentSales] = useState([]);
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentSales = async () => {
      try {
        const response = await api.get("/sales");
        const salesData = Array.isArray(response.data) ? response.data : [];

        setTotalSalesCount(salesData.length);
        setRecentSales(salesData.slice(0, 5));
      } catch (error) {
        console.error("Error fetching recent sales:", error);
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
              {loading ? "Loading..." : `You made ${totalSalesCount} total sales.`}
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
            <p className="text-xs text-slate-400">No recent sales found.</p>
          ) : (
            recentSales.map((sale) => {
              const invoiceNo = sale.invoice_no || "N/A";
              const dateStr = sale.created_at
                ? new Date(sale.created_at).toLocaleDateString()
                : "";
              const amount = sale.total || 0;
            
              return (
                <div
                  key={sale.id}
                  className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-semibold flex items-center justify-center text-xs">
                      {invoiceNo.slice(-2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 leading-none">
                        {invoiceNo}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{dateStr}</p>
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