import { useEffect, useState } from "react";
import { X, Printer, Package } from "lucide-react";
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

const InvoiceModal = ({ saleId, onClose }) => {
  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [business, setBusiness] = useState({
    name: "LEARNING CORNER",
    tagline: "Stationery & Learning Solutions",
    contact: "031597468123",
    invoice_prefix: "INV",
    footer_note: "Thank you for choosing us!",
    logo: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const [saleRes, businessRes] = await Promise.all([
          api.get(`/sales/${saleId}`),
          api.get("/business/name").catch(() => null),
        ]);

        setSale(saleRes.data?.sale || null);
        setItems(Array.isArray(saleRes.data?.items) ? saleRes.data.items : []);

        if (businessRes?.data?.business) {
          const b = businessRes.data.business;
          setBusiness({
            name: (b.name || "LEARNING CORNER").toUpperCase(),
            tagline: b.tagline || "",
            contact: b.contact || "",
            invoice_prefix: b.invoice_prefix || "INV",
            footer_note: b.footer_note || "Thank you for choosing us!",
            logo: b.logo || "",
          });
        }
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[380px] overflow-hidden max-h-[90vh] flex flex-col relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition z-10"
        >
          <X size={20} />
        </button>

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
            {/* Thermal Receipt Body */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-4 flex justify-center">
              <div className="w-[280px] bg-white border border-slate-300 shadow-sm p-4 pt-6 pb-6 font-mono text-[11px] text-slate-900 leading-tight">
                {/* Business Header */}
                <div className="text-center pb-2 border-b border-dashed border-slate-400">
                  {business.logo && (
                    <img
                      src={business.logo}
                      alt="Logo"
                      className="h-8 max-w-full mx-auto mb-1 grayscale object-contain"
                    />
                  )}
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

                {/* Invoice Meta */}
                <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>INVOICE:</span>
                    <span className="font-bold">{sale.invoice_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>DATE:</span>
                    <span>{formatDate(sale.created_at)}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="py-2 border-b border-dashed border-slate-400">
                  <div className="grid grid-cols-12 font-bold mb-1 border-b border-slate-300 pb-1 text-[10px]">
                    <span className="col-span-6">ITEM</span>
                    <span className="col-span-2 text-center">QTY</span>
                    <span className="col-span-4 text-right">PRICE</span>
                  </div>

                  {items.length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-3">
                      No items found for this sale.
                    </p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 py-0.5 text-[10px]"
                      >
                        <span className="col-span-6 truncate">{item.name || "Item"}</span>
                        <span className="col-span-2 text-center">{item.qty}</span>
                        <span className="col-span-4 text-right">
                          {Number(item.price).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span>Rs. {Number(sale.subtotal).toLocaleString()}</span>
                  </div>
                  {Number(sale.labor_charges) > 0 && (
                    <div className="flex justify-between">
                      <span>LABOR CHARGES:</span>
                      <span>Rs. {Number(sale.labor_charges).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-300 mt-1">
                    <span>TOTAL:</span>
                    <span>Rs. {Number(sale.total).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PAID:</span>
                    <span>Rs. {Number(sale.paid_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CHANGE:</span>
                    <span>Rs. {Number(sale.change).toLocaleString()}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 pb-2 text-center text-[10px] space-y-1">
                  {business.footer_note && (
                    <p className="font-semibold uppercase mb-2">{business.footer_note}</p>
                  )}

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

            {/* Print Button */}
            <div className="px-4 py-3 border-t border-slate-200 shrink-0 bg-white">
              <button
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 bg-[#CD051F] hover:bg-red-700 text-white text-sm font-bold py-3 rounded-xl transition shadow-sm"
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