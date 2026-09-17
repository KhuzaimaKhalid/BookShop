import { useState, useEffect } from "react";
import { X, RotateCcw, CheckSquare, Square } from "lucide-react";
import api from "../../services/api";

const ReturnModal = ({ invoiceData, onClose, onSuccess }) => {
  const [items, setItems] = useState([]);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (invoiceData && invoiceData.items) {
      setItems(
        invoiceData.items.map((item) => ({
          ...item,
          returnQty: 0,
        }))
      );
    }
  }, [invoiceData]);

  // Check if every item has returnQty equal to purchasedQty
  const isAllSelected =
    items.length > 0 &&
    items.every(
      (item) => Number(item.returnQty) === Number(item.purchasedQty)
    );

  // Check if some items are selected
  const isSomeSelected =
    items.some((item) => Number(item.returnQty) > 0) && !isAllSelected;

  // Toggle all return quantities between purchasedQty and 0
  const handleSelectAllToggle = (checkedState) => {
    const targetState =
      typeof checkedState === "boolean" ? checkedState : !isAllSelected;
    setItems((prevItems) =>
      prevItems.map((item) => ({
        ...item,
        returnQty: targetState ? item.purchasedQty : 0,
      }))
    );
  };

  const handleQtyChange = (index, value) => {
    const qty = Math.max(
      0,
      Math.min(Number(value) || 0, items[index].purchasedQty)
    );
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], returnQty: qty };
      return updated;
    });
  };

  const totalRefund = items.reduce((sum, item) => {
    return sum + (Number(item.returnQty) || 0) * (Number(item.price) || 0);
  }, 0);

  const handleSubmit = async () => {
    // sale_items.id (returned as `id` by GET /return/invoice/:invoiceNo) —
    // this is what the backend matches against, not product_id.
    const returnItems = items
      .filter((item) => item.returnQty > 0)
      .map((item) => ({
        sale_item_id: item.id,
        qty: item.returnQty,
      }));

    if (returnItems.length === 0) {
      alert("Please select at least one item to return.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/return", {
        sale_id: invoiceData.id,
        reason,
        items: returnItems,
      });

      // Original invoice is left untouched — hand the new return_id back
      // up so the parent can open a separate Return Receipt for it.
      if (onSuccess) onSuccess(res.data.return_id);
      onClose();
    } catch (error) {
      console.error("Error processing return:", error);
      alert(error.response?.data?.message || "Failed to process return. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Invoice: {invoiceData?.invoice_no}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Original Subtotal: Rs. {Number(invoiceData?.subtotal || 0).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full">
              Verified Invoice
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 overflow-y-auto flex-1">
          {/* Action Toolbar for Select All */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => handleSelectAllToggle(!isAllSelected)}
              className="flex items-center gap-2 text-xs font-bold text-[#CD051F] hover:text-[#b0041a] transition bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-lg"
            >
              {isAllSelected ? (
                <CheckSquare size={16} />
              ) : (
                <Square size={16} />
              )}
              {isAllSelected ? "Deselect All Items" : "Select All Items"}
            </button>
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-3">
                <th className="pb-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => el && (el.indeterminate = isSomeSelected)}
                    onChange={(e) => handleSelectAllToggle(e.target.checked)}
                    className="w-4 h-4 accent-[#CD051F] rounded cursor-pointer"
                    title="Select / Deselect All Items"
                  />
                </th>
                <th className="pb-3">Item Name</th>
                <th className="pb-3 text-center">Purchased Qty</th>
                <th className="pb-3 text-right">Price</th>
                <th className="pb-3 text-center">Return Qty</th>
                <th className="pb-3 text-right">Refund Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item, index) => {
                const itemRefund = (item.returnQty || 0) * (item.price || 0);
                const isItemFullyReturned =
                  Number(item.returnQty) === Number(item.purchasedQty);

                return (
                  <tr key={item.id || index} className="hover:bg-slate-50/50">
                    <td className="py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isItemFullyReturned}
                        onChange={(e) => {
                          handleQtyChange(
                            index,
                            e.target.checked ? item.purchasedQty : 0
                          );
                        }}
                        className="w-4 h-4 accent-[#CD051F] rounded cursor-pointer"
                      />
                    </td>
                    <td className="py-4 font-semibold text-slate-800">
                      {item.name}
                    </td>
                    <td className="py-4 text-center font-medium text-slate-700">
                      {item.purchasedQty}
                    </td>
                    <td className="py-4 text-right text-slate-700">
                      Rs. {item.price}
                    </td>
                    <td className="py-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max={item.purchasedQty}
                        value={item.returnQty}
                        onChange={(e) => handleQtyChange(index, e.target.value)}
                        className="w-16 text-center border border-slate-200 rounded-lg py-1 text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#CD051F]"
                      />
                    </td>
                    <td className="py-4 text-right font-bold text-[#CD051F]">
                      Rs. {itemRefund.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer controls */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-end justify-between gap-4">
            <div className="flex-1 min-w-[280px]">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Return Reason
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Defective product, Wrong item..."
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#CD051F]"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="block text-xs font-bold text-slate-400 uppercase">
                  Total Refund
                </span>
                <span className="text-2xl font-black text-[#CD051F]">
                  Rs. {totalRefund.toLocaleString()}
                </span>
              </div>

              <button
                type="button"
                disabled={submitting || totalRefund === 0}
                onClick={handleSubmit}
                className="bg-[#CD051F] hover:bg-[#b0041a] text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <RotateCcw size={18} />
                {submitting ? "Processing..." : "Process Return"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnModal;