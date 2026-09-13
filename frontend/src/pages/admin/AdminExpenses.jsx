import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ArrowLeft, X, Layers } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const CHART_COLORS = [
  "#CD051F",
  "#00A651",
  "#FF8042",
  "#FFBB28",
  "#1A0066",
  "#164E4D",
  "#D946EF",
  "#0284C7",
  "#6B7280",
];

// --- "Today" = a real calendar day in Pakistan Standard Time (UTC+5), not a
// rolling window and not dependent on the machine's local timezone. ---
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

const getPktTodayBoundsUtcMs = (referenceDate = new Date()) => {
  const shiftedMs = referenceDate.getTime() + PKT_OFFSET_MS;
  const shifted = new Date(shiftedMs);
  const startOfDayPktAsUtc = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
    0,
    0,
    0,
    0
  );
  const startUtcMs = startOfDayPktAsUtc - PKT_OFFSET_MS;
  const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;
  return { startUtcMs, endUtcMs };
};

const parseServerDate = (dateRaw) => {
  if (!dateRaw) return null;
  if (/[Zz]|[+-]\d{2}:\d{2}$/.test(dateRaw)) return new Date(dateRaw);
  const iso = dateRaw.includes("T") ? dateRaw : dateRaw.replace(" ", "T");
  return new Date(`${iso}Z`);
};

// Category expenses accumulate into a single lifetime-total row on the
// backend, so "today's" portion can't be derived from `amount` alone. The
// POS Expense page logs every addition (id, delta, timestamp) to this same
// localStorage key — read it here to get the real per-category total for
// today's PKT calendar day.
const ADDITIONS_STORAGE_KEY = "pos_expense_additions_log";

const loadAdditionsLog = () => {
  try {
    const raw = localStorage.getItem(ADDITIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const getTodayAddedByExpenseId = () => {
  const { startUtcMs, endUtcMs } = getPktTodayBoundsUtcMs();
  const map = {};
  loadAdditionsLog().forEach((entry) => {
    if (entry.timestamp >= startUtcMs && entry.timestamp < endUtcMs) {
      map[entry.expenseId] = (map[entry.expenseId] || 0) + (Number(entry.amount) || 0);
    }
  });
  return map;
};

const AdminExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit/Delete Modal State
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editIsOther, setEditIsOther] = useState(false);

  // Add Expense Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIsOther, setNewIsOther] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Other Expenses Modal State
  const [isOtherModalOpen, setIsOtherModalOpen] = useState(false);

  // Recomputed from localStorage; refreshed on fetch and whenever this tab
  // regains focus so additions made on the POS page elsewhere show up.
  const [todayAddedByExpenseId, setTodayAddedByExpenseId] = useState(() =>
    getTodayAddedByExpenseId()
  );

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/expenses");
      const fetched = res.data?.expenses || (Array.isArray(res.data) ? res.data : []);
      setExpenses(fetched);
      setTodayAddedByExpenseId(getTodayAddedByExpenseId());
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    const onFocus = () => setTodayAddedByExpenseId(getTodayAddedByExpenseId());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleOpenPencilModal = (exp) => {
    setSelectedExpense(exp);
    setEditName(exp.name || "");
    setEditAmount(exp.amount || 0);
    setEditIsOther(Boolean(exp.is_other));
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    if (!window.confirm(`Are you sure you want to delete "${selectedExpense.name}"?`)) return;

    setSubmitting(true);
    try {
      await api.delete(`/expenses/${selectedExpense.id}`);
      await fetchExpenses();
      setSelectedExpense(null);
    } catch (err) {
      console.error("Failed to delete expense:", err);
      alert("Error deleting expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateExpense = async (e) => {
    e.preventDefault();
    if (!selectedExpense) return;

    setSubmitting(true);
    try {
      await api.put(`/expenses/${selectedExpense.id}`, {
        name: editName,
        amount: Number(editAmount),
        is_other: editIsOther ? 1 : 0,
      });
      await fetchExpenses();
      setSelectedExpense(null);
    } catch (err) {
      console.error("Failed to update expense:", err);
      alert("Error updating expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSubmitting(true);
    try {
      await api.post("/expenses", {
        name: newName.trim(),
        amount: 0,
        is_other: newIsOther ? 1 : 0,
      });
      await fetchExpenses();
      setIsAddModalOpen(false);
      setNewName("");
      setNewIsOther(false);
    } catch (err) {
      console.error("Failed to create expense:", err);
      alert("Error creating expense.");
    } finally {
      setSubmitting(false);
    }
  };

  // Separate normal expenses and 'is_other' expenses
  const regularExpenses = expenses.filter((exp) => !exp.is_other);
  const otherExpenses = expenses.filter((exp) => Boolean(exp.is_other));

  // "Other" expenses are one-off rows (each amount IS a single transaction),
  // so today's portion is just those created within today's PKT day.
  const { startUtcMs: pktStartMs, endUtcMs: pktEndMs } = getPktTodayBoundsUtcMs();
  const todayOtherExpenses = otherExpenses.filter((exp) => {
    const t = parseServerDate(exp.created_at)?.getTime();
    return t && t >= pktStartMs && t < pktEndMs;
  });
  const otherTodayTotal = todayOtherExpenses.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );

  // Category expenses accumulate into one lifetime-total row, so today's
  // portion comes from the locally-tracked additions log instead.
  const regularTodayTotal = regularExpenses.reduce(
    (sum, exp) => sum + (todayAddedByExpenseId[String(exp.id)] || 0),
    0
  );

  const totalExpenseAmount = regularTodayTotal + otherTodayTotal;

  // Group all 'is_other' expenses into one 'Other' entry for right summary & chart
  const displayList = [
    ...regularExpenses.map((exp) => ({
      name: exp.name,
      amount: todayAddedByExpenseId[String(exp.id)] || 0,
    })),
    ...(otherTodayTotal > 0 || todayOtherExpenses.length > 0
      ? [{ name: "Other", amount: otherTodayTotal }]
      : []),
  ];

  const chartData = displayList
    .filter((item) => item.amount > 0)
    .map((item) => ({
      name: item.name,
      value: item.amount,
    }));

  return (
    <AdminLayout>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Content Area */}
        <div className="flex-1 flex flex-col justify-between gap-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.back()}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition text-slate-800"
              >
                <ArrowLeft size={20} />
              </button>
              <span className="text-base font-bold text-slate-800">Expense</span>
            </div>

            {loading ? (
              <div className="text-xs text-slate-400 font-bold p-4">Loading expenses...</div>
            ) : regularExpenses.length === 0 && otherExpenses.length === 0 ? (
              <div className="text-xs text-slate-400 font-bold p-4">
                No expenses found. Click "+ ADD Expense" to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Render Main/Regular Expenses */}
                {regularExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow transition h-14"
                  >
                    <span className="px-4 text-sm font-bold text-slate-800 truncate">
                      {exp.name}
                    </span>
                    <button
                      onClick={() => handleOpenPencilModal(exp)}
                      className="w-12 h-full bg-black text-white flex items-center justify-center hover:bg-slate-800 transition shrink-0"
                      title="Edit or Delete Expense"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                ))}

                {/* Expanded 'Other Expenses' Button in Main Grid */}
                {otherExpenses.length > 0 && (
                  <div
                    className="col-span-1 sm:col-span-2 flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm hover:bg-slate-800 transition h-14 px-4 cursor-pointer"
                    onClick={() => setIsOtherModalOpen(true)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <Layers size={18} className="text-red-500 shrink-0" />
                      <span className="text-sm font-bold text-white whitespace-nowrap">
                        Other Expenses
                      </span>
                    </div>
                    <span className="bg-red-600 text-white font-black text-xs px-3 py-1 rounded-full shrink-0">
                      {otherExpenses.length}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="bg-[#CD051F] hover:bg-red-700 text-white font-bold text-sm px-6 py-3.5 rounded-xl flex items-center gap-2 transition shadow-md"
              >
                <Plus size={18} strokeWidth={3} />
                ADD Expense
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Summary & Donut Chart */}
        <div className="w-full lg:w-64 xl:w-72 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shrink-0 shadow-sm">
          <div className="bg-[#CD051F] text-white py-2.5 px-4 text-center font-bold text-sm shadow-sm">
            Today's Total Expense
          </div>

          <div className="p-4 flex-1 flex flex-col items-center justify-between gap-4">
            <div className="relative w-full h-36 flex items-center justify-center">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={36}
                      outerRadius={58}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-24 h-24 rounded-full border-8 border-slate-100 flex items-center justify-center" />
              )}
              <div className="absolute text-center">
                <span className="text-lg font-black text-slate-900">
                  {totalExpenseAmount}
                </span>
              </div>
            </div>

            <div className="w-full space-y-2">
              {displayList.map((item, idx) => (
                <div
                  key={item.name + idx}
                  className="flex items-center justify-between text-[11px] font-bold text-slate-800"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{
                        backgroundColor:
                          CHART_COLORS[idx % CHART_COLORS.length],
                      }}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="shrink-0 text-slate-900">
                    Rs. {item.amount || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Other Expenses List Modal */}
        {isOtherModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[80vh]">
              <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <Layers size={18} className="text-red-500" />
                  <h3 className="text-sm font-bold">Other Expenses ({otherExpenses.length})</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOtherModalOpen(false)}
                  className="text-white hover:opacity-80"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                {otherExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-sm"
                  >
                    <div>
                      <span className="block text-xs font-bold text-slate-800">{exp.name}</span>
                      <span className="text-xs font-semibold text-slate-500">Rs. {exp.amount || 0}</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsOtherModalOpen(false);
                        handleOpenPencilModal(exp);
                      }}
                      className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center hover:bg-slate-800 transition"
                      title="Edit or Delete Expense"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setIsOtherModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {selectedExpense && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleUpdateExpense}
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="bg-[#CD051F] px-5 py-3.5 flex items-center justify-between text-white">
                <h3 className="text-sm font-bold">Manage {selectedExpense.name}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedExpense(null)}
                  className="text-white hover:opacity-80"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Expense Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#CD051F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Amount (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#CD051F]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsOther"
                    checked={editIsOther}
                    onChange={(e) => setEditIsOther(e.target.checked)}
                    className="w-4 h-4 accent-[#CD051F]"
                  />
                  <label htmlFor="editIsOther" className="text-xs font-bold text-slate-700">
                    Group under "Other" in chart
                  </label>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDeleteExpense}
                  disabled={submitting}
                  className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Trash2 size={14} />
                  Delete
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedExpense(null)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#CD051F] hover:bg-red-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Add Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <form
              onSubmit={handleAddExpense}
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="bg-[#CD051F] px-5 py-3.5 flex items-center justify-between text-white">
                <h3 className="text-sm font-bold">Add New Expense</h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-white hover:opacity-80"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Expense Category Name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Generator Fuel"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#CD051F]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newIsOther"
                    checked={newIsOther}
                    onChange={(e) => setNewIsOther(e.target.checked)}
                    className="w-4 h-4 accent-[#CD051F]"
                  />
                  <label htmlFor="newIsOther" className="text-xs font-bold text-slate-700">
                    Group under "Other" in chart
                  </label>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#CD051F] hover:bg-red-700 text-white rounded-lg text-xs font-bold transition"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminExpenses;