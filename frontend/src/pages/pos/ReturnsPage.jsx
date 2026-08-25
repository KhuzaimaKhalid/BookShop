import { useState, useEffect } from "react";
import { Receipt, RotateCcw, AlertCircle, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import POSHeader from "../../components/pos/POSHeader";
import CategorySidebar from "../../components/pos/CategorySidebar";

const ReturnsPage = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [invoiceNoInput, setInvoiceNoInput] = useState("");
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(Array.isArray(res.data?.categories) ? res.data.categories : []);
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // 1. Fetch Invoice Details from Backend
  const handleLoadInvoice = async (e) => {
    e?.preventDefault();
    if (!invoiceNoInput.trim()) return;

    setLoadingInvoice(true);
    setErrorMessage("");
    setSuccessMessage("");
    setInvoiceData(null);
    setReturnItems([]);

    try {
      const res = await api.get(`/return/invoice/${invoiceNoInput.trim()}`);
      setInvoiceData(res.data.invoice);
      
      // Initialize return quantities to 0 for each item
      const initializedItems = (res.data.items || []).map((item) => ({
        ...item,
        returnQty: 0,
      }));
      setReturnItems(initializedItems);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Invoice not found.");
    } finally {
      setLoadingInvoice(false);
    }
  };

  // 2. Adjust Return Quantities
  const handleQtyChange = (saleItemId, newQty, maxQty) => {
    const safeQty = Math.max(0, Math.min(Number(newQty) || 0, maxQty));
    setReturnItems((prev) =>
      prev.map((item) => (item.id === saleItemId ? { ...item, returnQty: safeQty } : item))
    );
  };

  // 3. Process Return Request
  const handleProcessReturn = async () => {
    const selectedItems = returnItems
      .filter((i) => i.returnQty > 0)
      .map((i) => ({
        sale_item_id: i.id,
        qty: i.returnQty,
      }));

    if (selectedItems.length === 0) {
      setErrorMessage("Please select at least one item quantity to return.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const payload = {
        sale_id: invoiceData.id,
        reason: reason || "Customer Return",
        items: selectedItems,
      };

      const res = await api.post("/return", payload);
      setSuccessMessage(
        `Return ${res.data.return_no} processed successfully! Total Refund: Rs. ${Number(
          res.data.total_refund
        ).toLocaleString()}`
      );

      // Reset state
      setInvoiceData(null);
      setReturnItems([]);
      setReason("");
      setInvoiceNoInput("");
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to process return.");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotalRefund = () =>
    returnItems.reduce((sum, item) => sum + item.returnQty * item.price, 0);

  return (
    <div className="min-h-screen w-full bg-[#F8F9FA] flex flex-col">
      <POSHeader searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <div className="flex flex-1">
        <CategorySidebar
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        <main className="flex-1 p-8 flex flex-col gap-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">RETURN</h1>

          {/* Search Box Card */}
          <form
            onSubmit={handleLoadInvoice}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4 max-w-2xl"
          >
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm shrink-0">
              <Receipt size={22} />
              <span>Enter Invoice Number</span>
            </div>

            <input
              type="text"
              value={invoiceNoInput}
              onChange={(e) => setInvoiceNoInput(e.target.value)}
              placeholder="e.g. INV-1785768734762"
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-[#CD051F]"
            />

            <button
              type="submit"
              disabled={loadingInvoice}
              className="bg-[#CD051F] hover:bg-red-700 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition shrink-0 disabled:opacity-50"
            >
              {loadingInvoice ? "Loading..." : "Load Invoice"}
            </button>
          </form>

          {/* Error & Success Messages */}
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 text-sm font-semibold max-w-2xl">
              <AlertCircle size={18} />
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2 text-sm font-semibold max-w-2xl">
              <CheckCircle2 size={18} />
              {successMessage}
            </div>
          )}

          {/* Invoice Items & Refund Form */}
          {invoiceData && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6 max-w-4xl">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Invoice: {invoiceData.invoice_no}</h3>
                  <p className="text-xs text-slate-400">
                    Original Subtotal: Rs. {Number(invoiceData.subtotal).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                  Verified Invoice
                </span>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase">
                      <th className="py-2">Item Name</th>
                      <th className="py-2 text-center">Purchased Qty</th>
                      <th className="py-2 text-right">Price</th>
                      <th className="py-2 text-center">Return Qty</th>
                      <th className="py-2 text-right">Refund Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50 text-sm font-semibold text-slate-800">
                        <td className="py-3">{item.name}</td>
                        <td className="py-3 text-center">{item.qty}</td>
                        <td className="py-3 text-right">Rs. {Number(item.price).toLocaleString()}</td>
                        <td className="py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={item.qty}
                            value={item.returnQty}
                            onChange={(e) => handleQtyChange(item.id, e.target.value, item.qty)}
                            className="w-16 border border-slate-300 rounded text-center py-1 font-bold focus:outline-none focus:ring-1 focus:ring-[#CD051F]"
                          />
                        </td>
                        <td className="py-3 text-right text-[#CD051F]">
                          Rs. {(item.returnQty * item.price).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Reason & Final Confirmation */}
              <div className="flex flex-col sm:flex-row justify-between items-end gap-4 pt-4 border-t border-slate-100">
                <div className="w-full sm:w-1/2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Return Reason
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., Defective product, Wrong item..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#CD051F]"
                  />
                </div>

                <div className="flex items-center gap-6 w-full sm:w-auto justify-end">
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase">Total Refund</p>
                    <p className="text-xl font-extrabold text-[#CD051F]">
                      Rs. {calculateTotalRefund().toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={handleProcessReturn}
                    disabled={submitting || calculateTotalRefund() === 0}
                    className="flex items-center gap-2 bg-[#CD051F] hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg transition disabled:opacity-50"
                  >
                    <RotateCcw size={16} />
                    {submitting ? "Processing..." : "Process Return"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ReturnsPage;