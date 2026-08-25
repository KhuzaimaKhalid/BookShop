import { useEffect, useState } from "react";
import { X, Package } from "lucide-react";
import api from "../../services/api";

const ReturnModal = ({ returnId, onClose }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReturn = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/return/${returnId}`);
        setItems(Array.isArray(res.data?.items) ? res.data.items : []);
      } catch (err) {
        console.error("Error fetching return:", err);
        setError("Failed to load return details.");
      } finally {
        setLoading(false);
      }
    };

    if (returnId) fetchReturn();
  }, [returnId]);

  const total = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[600px] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-[#CD051F] px-8 py-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-6 text-white hover:text-white/80 transition"
          >
            <X size={20} />
          </button>
          <h2 className="text-white text-xl font-extrabold">
            Return Details
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {loading ? (
            <p className="text-center text-slate-400 text-sm py-8">
              Loading items...
            </p>
          ) : error ? (
            <p className="text-center text-red-500 text-sm py-8">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-8">
              No items found for this return.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_80px_100px_100px] gap-4 pb-3 border-b border-slate-200">
                <span className="text-sm font-bold text-slate-900">Item Name</span>
                <span className="text-sm font-bold text-slate-900 text-center">QTY</span>
                <span className="text-sm font-bold text-slate-900 text-right">Price</span>
                <span className="text-sm font-bold text-slate-900 text-right">Total</span>
              </div>

              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_80px_100px_100px] gap-4 items-center py-4 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Package size={16} className="text-slate-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm text-slate-700 text-center">
                    {item.qty}
                  </span>
                  <span className="text-sm text-slate-700 text-right">
                    Rs.{Number(item.price).toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 text-right">
                    Rs.{Number(item.total).toLocaleString()}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="px-8 py-6 border-t border-slate-200 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-base font-extrabold text-[#CD051F]">
              Total Refund
            </span>
            <span className="text-base font-extrabold text-[#CD051F]">
              Rs.{Number(total).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;