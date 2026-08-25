import { useEffect, useState } from "react";
import { X, Printer, Package } from "lucide-react";
import api from "../../services/api";

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

const InvoiceModal = ({ saleId, onClose }) => {
  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/sales/${saleId}`);
        setSale(res.data?.sale || null);
        setItems(Array.isArray(res.data?.items) ? res.data.items : []);
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Failed to load invoice.");
      } finally {
        setLoading(false);
      }
    };

    if (saleId) fetchInvoice();
  }, [saleId]);

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] overflow-hidden max-h-[90vh] flex flex-col">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            Loading invoice...
          </div>
        ) : error || !sale ? (
          <div className="p-10 text-center">
            <p className="text-sm text-red-500 mb-4">{error || "Invoice not found."}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-[#CD051F] px-8 py-6 relative shrink-0">
              <button
                onClick={onClose}
                className="absolute top-5 right-6 text-white hover:text-white/80 transition"
              >
                <X size={20} />
              </button>

              <p className="text-white text-sm font-medium">
                Date: {formatDate(sale.created_at).datePart}
                <span className="ml-3">{formatDate(sale.created_at).timePart}</span>
              </p>

              <div className="flex items-center justify-between mt-2">
                <h2 className="text-white text-2xl font-extrabold">
                  {sale.invoice_no}
                </h2>
                <span className="bg-white text-slate-900 text-xs font-bold px-4 py-2 rounded-lg">
                  Item: {items.length}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="grid grid-cols-[1fr_100px_100px] gap-4 pb-3 border-b border-slate-200">
                <span className="text-sm font-bold text-slate-900">Item Name</span>
                <span className="text-sm font-bold text-slate-900 text-center">QTY</span>
                <span className="text-sm font-bold text-slate-900 text-right">Price</span>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  No items found for this sale.
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1fr_100px_100px] gap-4 items-center py-4 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={18} className="text-slate-400" />
                        )}
                      </div>
                      <span className="text-sm font-semibold text-slate-800">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <span className="bg-slate-100 text-slate-700 text-sm font-semibold px-4 py-1.5 rounded-md">
                        {item.qty}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-800 text-right">
                      Rs.{Number(item.price).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Totals */}
            <div className="px-8 py-6 border-t border-slate-200 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">Subtotal</span>
                <span className="text-sm font-semibold text-slate-800">
                  Rs.{Number(sale.subtotal).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-700">Labor Charges</span>
                <span className="text-sm font-semibold text-slate-800">
                  Rs. {Number(sale.labor_charges).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-extrabold text-[#CD051F]">Total</span>
                <span className="text-base font-extrabold text-[#CD051F]">
                  Rs.{Number(sale.total).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700">Paid Amount</span>
                <span className="text-sm font-bold text-slate-900">
                  Rs. {Number(sale.paid_amount).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-semibold text-slate-700">Change</span>
                <span className="text-sm font-bold text-green-600">
                  Rs. {Number(sale.change).toLocaleString()}
                </span>
              </div>

              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 bg-[#CD051F] hover:bg-red-700 text-white text-sm font-bold py-3.5 rounded-xl transition shadow-sm"
              >
                <Printer size={18} />
                Print Invoice
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InvoiceModal;