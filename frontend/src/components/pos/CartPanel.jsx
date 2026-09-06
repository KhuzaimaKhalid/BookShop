import { Minus, Plus, X, Save, Printer, RotateCcw } from "lucide-react";

const CartPanel = ({
  cart,
  onIncrement,
  onDecrement,
  onRemoveItem,
  onPaidChange,
  onSaveBill,
  onPrint,
  onClear,
  onReturn,
  saving,
}) => {
  const subtotal = cart.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const total = subtotal;
  const paid = Number(cart.paidAmount) || 0;
  const change = Math.max(0, paid - total);

  // Helper for clean currency formatting
  const formatMoney = (val) =>
    Number(val).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <>
      {/* 1. VISIBLE POS CART UI (Hidden during print) */}
      {/* 1. VISIBLE POS CART UI (Hidden during print) */}
      <aside className="no-print w-full xl:w-[380px] h-full max-h-full shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">

        {/* Header (Stays Fixed at Top) */}
        <div className="bg-[#CD051F] px-5 py-4 flex items-center justify-between shrink-0">
          <span className="text-white font-extrabold text-base">
            {cart.invoiceNo || "New Sale"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onReturn}
              className="bg-white text-[#CD051F] text-xs font-bold px-3 py-1.5 rounded-md hover:bg-slate-100 transition"
            >
              RETURN
            </button>
            <button
              onClick={onClear}
              className="bg-black/20 text-white text-xs font-bold px-3 py-1.5 rounded-md hover:bg-black/30 transition flex items-center gap-1"
            >
              <RotateCcw size={12} />
              Clear
            </button>
          </div>
        </div>

        {/* Items List (Scrollable Container) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-[1fr_90px_70px_20px] gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase sticky top-0 bg-white z-10">
            <span>Item Name</span>
            <span className="text-center">QTY</span>
            <span className="text-right">Price</span>
            <span></span>
          </div>

          {cart.items.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">Cart is empty.</p>
          ) : (
            cart.items.map((item) => (
              <div
                key={item.product_id}
                className="grid grid-cols-[1fr_90px_70px_20px] gap-2 items-center py-3 border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-slate-800 truncate">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => onDecrement(item.product_id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-red-50 text-[#CD051F] hover:bg-red-100 transition"
                  >
                    <Minus size={12} strokeWidth={3} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold bg-slate-100 rounded-md py-0.5">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onIncrement(item.product_id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition"
                  >
                    <Plus size={12} strokeWidth={3} />
                  </button>
                </div>

                <span className="text-sm font-semibold text-slate-800 text-right">
                  Rs.{formatMoney(item.price)}
                </span>

                <button
                  onClick={() => onRemoveItem(item.product_id)}
                  className="text-slate-400 hover:text-[#CD051F] transition"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totals & Action Buttons (Stays Fixed at Bottom) */}
        <div className="px-5 py-4 border-t border-slate-200 shrink-0 bg-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">Subtotal</span>
            <span className="text-sm font-bold text-slate-900">
              Rs. {formatMoney(subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between mb-3 pt-3 border-t border-slate-200">
            <span className="text-base font-extrabold text-[#CD051F]">Total</span>
            <span className="text-base font-extrabold text-[#CD051F]">
              Rs. {formatMoney(total)}
            </span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">Paid Amount</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Enter Rs.</span>
              <input
                type="number"
                min="0"
                value={cart.paidAmount}
                onChange={(e) => onPaidChange(e.target.value)}
                className="w-20 text-right text-sm font-semibold bg-slate-100 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#CD051F]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mb-5">
            <span className="text-sm font-semibold text-slate-700">Change</span>
            <span className={`text-sm font-bold ${paid < total ? "text-red-600" : "text-green-600"}`}>
              Rs. {formatMoney(change)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onSaveBill}
              disabled={saving || cart.items.length === 0}
              className="flex items-center justify-center gap-2 border border-slate-300 rounded-lg py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Bill"}
            </button>
            <button
              onClick={onPrint}
              disabled={saving || cart.items.length === 0}
              className="flex items-center justify-center gap-2 bg-[#CD051F] hover:bg-red-700 text-white rounded-lg py-3 text-sm font-bold transition disabled:opacity-50"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>
      </aside>

      {/* 2. PRINT-ONLY THERMAL RECEIPT (Only visible during window.print()) */}
      <div className="hidden print:block printable-receipt">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">ATR AUTOMOTIVE</h2>
          <p className="text-xs">Thermal Receipt</p>
          <p className="text-xs font-mono">Invoice #: {cart.invoiceNo || "N/A"}</p>
          <p className="text-xs">{new Date().toLocaleString()}</p>
        </div>

        <div className="border-b border-t border-black py-2 my-2 text-xs">
          <div className="flex justify-between font-bold mb-1">
            <span>Item</span>
            <span>Qty x Price</span>
            <span>Total</span>
          </div>
          {cart.items.map((item) => (
            <div key={item.product_id} className="flex justify-between my-1">
              <span className="truncate max-w-[120px]">{item.name}</span>
              <span>{item.qty} x {formatMoney(item.price)}</span>
              <span>{formatMoney(item.qty * item.price)}</span>
            </div>
          ))}
        </div>

        <div className="text-xs space-y-1 my-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>Rs. {formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
            <span>Total:</span>
            <span>Rs. {formatMoney(total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Paid:</span>
            <span>Rs. {formatMoney(paid)}</span>
          </div>
          <div className="flex justify-between">
            <span>Change:</span>
            <span>Rs. {formatMoney(change)}</span>
          </div>
        </div>

        <div className="text-center text-xs border-t border-dashed border-black pt-4 mt-4">
          Thank you for your business!
        </div>
      </div>
    </>
  );
};

export default CartPanel;