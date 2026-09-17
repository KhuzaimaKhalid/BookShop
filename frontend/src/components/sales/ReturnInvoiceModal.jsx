import { useEffect, useState } from "react";
import { X, Printer } from "lucide-react";
import api from "../../services/api";
import trustNexusLogo from "../../assets/logo.png";

const formatDate = (isoStr) => {
  const d = new Date(isoStr);
  return d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
};

// Read-only receipt for a processed return. The original sale/invoice is
// never modified by a return — this is a separate document that references
// the original invoice number, so both records stay intact and auditable.
const ReturnInvoiceModal = ({ returnId, onClose }) => {
  const [returnData, setReturnData] = useState(null);
  const [items, setItems] = useState([]);
  const [business, setBusiness] = useState({
    name: "LEARNING CORNER",
    tagline: "Stationery & Learning Solutions",
    contact: "031597468123",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReturn = async () => {
      try {
        setLoading(true);
        const [returnRes, businessRes] = await Promise.all([
          api.get(`/return/${returnId}`),
          api.get("/business/name").catch(() => null),
        ]);

        setReturnData(returnRes.data?.return || null);
        setItems(Array.isArray(returnRes.data?.items) ? returnRes.data.items : []);

        if (businessRes?.data?.business) {
          const b = businessRes.data.business;
          setBusiness({
            name: (b.name || "LEARNING CORNER").toUpperCase(),
            tagline: b.tagline || "",
            contact: b.contact || "",
          });
        }
      } catch (err) {
        console.error("Error fetching return receipt:", err);
        setError("Failed to load return receipt.");
      } finally {
        setLoading(false);
      }
    };

    if (returnId) fetchReturn();
  }, [returnId]);

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[380px] overflow-hidden max-h-[90vh] flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition z-10"
        >
          <X size={20} />
        </button>

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            Loading return receipt...
          </div>
        ) : error || !returnData ? (
          <div className="p-10 text-center">
            <p className="text-sm text-red-500 mb-4">{error || "Return not found."}</p>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto bg-slate-100 p-4 flex justify-center">
              <div className="w-[280px] bg-white border border-slate-300 shadow-sm p-4 pt-6 pb-6 font-mono text-[11px] text-slate-900 leading-tight">
                {/* Business Header */}
                <div className="text-center pb-2 border-b border-dashed border-slate-400">
                  <p className="font-bold uppercase tracking-wider text-xs">
                    {business.name}
                  </p>
                  {business.tagline && (
                    <p className="text-[10px] text-slate-600">{business.tagline}</p>
                  )}
                  {business.contact && (
                    <p className="text-[10px] text-slate-600">TEL: {business.contact}</p>
                  )}
                </div>

                {/* Return banner */}
                <div className="text-center py-1.5 border-b border-dashed border-slate-400">
                  <p className="font-extrabold text-xs tracking-widest text-[#CD051F]">
                    RETURN RECEIPT
                  </p>
                </div>

                {/* Return Meta */}
                <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>RETURN NO:</span>
                    <span className="font-bold">{returnData.return_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ORIGINAL INVOICE:</span>
                    <span className="font-bold">{returnData.invoice_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>{formatDate(returnData.created_at)}</span>
                  </div>
                  {returnData.reason && (
                    <div className="flex justify-between gap-2">
                      <span className="shrink-0">REASON:</span>
                      <span className="text-right truncate">{returnData.reason}</span>
                    </div>
                  )}
                </div>

                {/* Returned Items Table */}
                <div className="py-2 border-b border-dashed border-slate-400">
                  <div className="grid grid-cols-12 font-bold mb-1 border-b border-slate-300 pb-1 text-[10px]">
                    <span className="col-span-6">ITEM</span>
                    <span className="col-span-2 text-center">QTY</span>
                    <span className="col-span-4 text-right">TOTAL</span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-3">
                      No items on this return.
                    </p>
                  ) : (
                    items.map((item, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 py-0.5 text-[10px]"
                      >
                        <span className="col-span-6 truncate">{item.name || "Item"}</span>
                        <span className="col-span-2 text-center">{item.qty}</span>
                        <span className="col-span-4 text-right">
                          {Number(item.total).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Refund Total */}
                <div className="py-2 border-b border-dashed border-slate-400">
                  <div className="flex justify-between font-bold text-xs">
                    <span>TOTAL REFUND:</span>
                    <span>Rs. {Number(returnData.total_refund).toLocaleString()}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 pb-2 text-center text-[10px] space-y-1">
                  <p className="font-semibold uppercase mb-2">
                    This receipt does not alter the original invoice
                  </p>

                  <div className="flex justify-center my-1">
                    <img
                      src={trustNexusLogo}
                      alt="Trust Nexus Logo"
                      className="h-4 max-w-[80px] object-contain grayscale opacity-80 mx-auto"
                    />
                  </div>

                  <p className="font-bold text-[10px] tracking-wide uppercase">
                    Powered By Trust Nexus
                  </p>
                  <p className="text-[10px] font-medium text-slate-700">0303-8184136</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 border-t border-slate-200 shrink-0 bg-white">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 bg-[#CD051F] hover:bg-red-700 text-white text-sm font-bold py-3 rounded-xl transition shadow-sm"
              >
                <Printer size={18} />
                Print Return Receipt
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReturnInvoiceModal;