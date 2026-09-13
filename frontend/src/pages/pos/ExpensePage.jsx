import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X, Pencil } from "lucide-react";
import api from "../../services/api";
import POSHeader from "../../components/pos/POSHeader";
import CategorySidebar from "../../components/pos/CategorySidebar";
import CustomerTabs from "../../components/pos/CustomerTabs";

// --- Rolling 24h "amount added" tracker (frontend-only, no backend changes) ---
// The backend stores one row per expense category and just keeps adding to
// its `amount` field forever (resetting `created_at` on every update). That
// means `amount` is a lifetime running total, not "how much was added today".
// To show a true "last 24 hours" figure without touching the backend, we log
// every addition (category id, delta amount, timestamp) locally and derive
// the rolling total from that log instead of from the cumulative `amount`.
const ADDITIONS_STORAGE_KEY = "pos_expense_additions_log";
const ROLLING_WINDOW_MS = 24 * 60 * 60 * 1000;

const loadAdditionsLog = () => {
  try {
    const raw = localStorage.getItem(ADDITIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveAdditionsLog = (log) => {
  try {
    localStorage.setItem(ADDITIONS_STORAGE_KEY, JSON.stringify(log));
  } catch (err) {
    console.error("Failed to persist expense additions log:", err);
  }
};

// Keep a bit more than the rolling window so entries don't disappear right
// before they'd naturally age out on the next render.
const pruneOldAdditions = (log, maxAgeMs = ROLLING_WINDOW_MS * 2) => {
  const cutoff = Date.now() - maxAgeMs;
  return log.filter((entry) => entry.timestamp >= cutoff);
};

const createEmptyCustomer = (name) => ({
  id: `${Date.now()}-${Math.random()}`,
  name,
  items: [],
  laborCharges: "",
  paidAmount: "",
  invoiceNo: null,
  saleId: null,
});

const ExpensePage = () => {
  const navigate = useNavigate();

  // Navigation & Category States
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  // Customer Tabs State
  const [customers, setCustomers] = useState([createEmptyCustomer("Customer 1")]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);

  // Database Expenses State
  const [dbExpenses, setDbExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'edit' | 'add' | null
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Form Inputs
  const [expenseAmount, setExpenseAmount] = useState("");
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseDescription, setNewExpenseDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);

  // Locally-tracked "amount added" log, used to derive a rolling last-24h
  // figure per category instead of relying on the backend's cumulative total.
  const [additions, setAdditions] = useState(() => pruneOldAdditions(loadAdditionsLog()));

  const recordAddition = (expenseId, amount) => {
    setAdditions((prev) => {
      const next = pruneOldAdditions([
        ...prev,
        { expenseId: String(expenseId), amount: Number(amount) || 0, timestamp: Date.now() },
      ]);
      saveAdditionsLog(next);
      return next;
    });
  };

  // Fetch Data from Backend API
  const fetchExpensesAndCategories = async () => {
    try {
      setLoading(true);
      const [categoriesRes, expensesRes, pagesRes] = await Promise.all([
        api.get("/categories").catch(() => ({ data: { categories: [] } })),
        api.get("/expenses").catch(() => ({ data: { expenses: [] } })),
        api.get("/pages").catch(() => ({ data: [] })),
      ]);

      const fetchedPages = Array.isArray(pagesRes.data?.pages)
        ? pagesRes.data.pages
        : Array.isArray(pagesRes.data)
          ? pagesRes.data
          : [];
      setPages(fetchedPages);
      if (fetchedPages.length > 0 && !selectedPageId) {
        setSelectedPageId(fetchedPages[0].id ?? fetchedPages[0]._id ?? fetchedPages[0].page_id);
      }

      const fetchedCategories = Array.isArray(categoriesRes.data?.categories)
        ? categoriesRes.data.categories
        : Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : [];
      const activeCategories = fetchedCategories.filter(
        (cat) => Number(cat.is_delete) !== 1 && cat.status?.toLowerCase() !== "inactive"
      );
      setCategories(activeCategories);

      const fetchedExpenses = Array.isArray(expensesRes.data?.expenses)
        ? expensesRes.data.expenses
        : Array.isArray(expensesRes.data)
          ? expensesRes.data
          : [];

      setDbExpenses(fetchedExpenses);
    } catch (err) {
      console.error("Error fetching expense data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!selectedPageId) return categories;
    return categories.filter((cat) => {
      const catPageId = cat.page_id ?? cat.pageId ?? cat.page;
      return String(catPageId) === String(selectedPageId);
    });
  }, [categories, selectedPageId]);

  const parseServerDate = (dateRaw) => {
    if (!dateRaw) return null;
    if (/[Zz]|[+-]\d{2}:\d{2}$/.test(dateRaw)) return new Date(dateRaw);
    const iso = dateRaw.includes("T") ? dateRaw : dateRaw.replace(" ", "T");
    return new Date(`${iso}Z`);
  };

  const RECENT_EXPENSES_LIMIT = 15;

  const expenseNameById = useMemo(() => {
    const map = {};
    dbExpenses.forEach((exp) => {
      map[String(exp.id)] = exp.name;
    });
    return map;
  }, [dbExpenses]);

  // Per-category amount added within the last rolling 24 hours, derived from
  // the local additions log (NOT the backend's cumulative `amount`).
  const last24hAddedByExpenseId = useMemo(() => {
    const cutoff = Date.now() - ROLLING_WINDOW_MS;
    const map = {};
    additions.forEach((entry) => {
      if (entry.timestamp >= cutoff) {
        map[entry.expenseId] = (map[entry.expenseId] || 0) + entry.amount;
      }
    });
    return map;
  }, [additions]);

  // Combined "recently added" feed for the last 24 hours:
  //  - "Other" (one-off) expenses: each DB row IS a single transaction, so
  //    its `amount` is already correct as-is.
  //  - Category expenses: use the locally-tracked delta per addition instead
  //    of the row's lifetime running total.
  const last24hEntries = useMemo(() => {
    const cutoff = Date.now() - ROLLING_WINDOW_MS;

    const otherEntries = dbExpenses
      .filter((exp) => {
        if (!exp.is_other) return false;
        const amountValid = (Number(exp.amount) || 0) > 0;
        const t = parseServerDate(exp.created_at)?.getTime();
        return amountValid && t && t >= cutoff;
      })
      .map((exp) => ({
        key: `db-${exp.id}`,
        name: exp.name,
        amount: Number(exp.amount) || 0,
        timestamp: parseServerDate(exp.created_at)?.getTime() || 0,
      }));

    const categoryEntries = additions
      .filter((entry) => entry.timestamp >= cutoff && entry.amount > 0)
      .map((entry) => ({
        key: `add-${entry.expenseId}-${entry.timestamp}`,
        name: expenseNameById[entry.expenseId] || "Expense",
        amount: entry.amount,
        timestamp: entry.timestamp,
      }));

    return [...otherEntries, ...categoryEntries].sort((a, b) => b.timestamp - a.timestamp);
  }, [dbExpenses, additions, expenseNameById]);

  const todayExpenses = useMemo(
    () => last24hEntries.slice(0, RECENT_EXPENSES_LIMIT),
    [last24hEntries]
  );

  const totalExpense = useMemo(() => {
    return last24hEntries.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [last24hEntries]);

  const handleAddCustomer = () => {
    setCustomers((prev) => [...prev, createEmptyCustomer(`Customer ${prev.length + 1}`)]);
    setActiveIndex(customers.length);
  };

  const handleOpenEditAmount = (item) => {
    setSelectedExpense(item);
    setExpenseAmount("");
    setActiveModal("edit");
  };

  const handleSaveAmountOnly = async (e) => {
    e?.preventDefault();
    if (!selectedExpense || !expenseAmount) return;

    setSubmitting(true);
    try {
      const currentAmount = Number(selectedExpense.amount) || 0;
      const addedAmount = Number(expenseAmount) || 0;
      const updatedTotalAmount = currentAmount + addedAmount;

      await api.put(`/expenses/${selectedExpense.id}`, {
        name: selectedExpense.name,
        amount: updatedTotalAmount,
        is_other: 0,
      });

      recordAddition(selectedExpense.id, addedAmount);
      await fetchExpensesAndCategories();
      setActiveModal(null);
      setSelectedExpense(null);
      setExpenseAmount("");
    } catch (err) {
      console.error("Failed to update expense amount:", err);
      alert("Error updating amount.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddOtherExpense = async (e) => {
    e?.preventDefault();
    if (!newExpenseName.trim() || !expenseAmount) return;

    setSubmitting(true);
    try {
      await api.post("/expenses", {
        name: newExpenseName.trim(),
        description: newExpenseDescription.trim(),
        amount: Number(expenseAmount),
        is_other: 1,
      });

      await fetchExpensesAndCategories();
      setActiveModal(null);
      setNewExpenseName("");
      setNewExpenseDescription("");
      setExpenseAmount("");
    } catch (err) {
      console.error("Failed to add new expense:", err);
      alert("Error adding expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#F8F9FA] flex flex-col overflow-hidden">
      <POSHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onMenuClick={() => setMobileCategoryOpen(true)}
        showDashboardLink={true}
      />

      <div className="flex flex-1 relative overflow-hidden">
        <CategorySidebar
          categories={filteredCategories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(catId) => {
            setSelectedCategoryId(catId);
            navigate("/pos", { state: { categoryId: catId } });
          }}
          mobileOpen={mobileCategoryOpen}
          onClose={() => setMobileCategoryOpen(false)}
        />

        <main className="flex-1 p-3 sm:p-4 flex flex-col gap-3 overflow-hidden">
          <CustomerTabs
            customers={customers}
            activeIndex={activeIndex}
            onSelectTab={setActiveIndex}
            onAddCustomer={handleAddCustomer}
            scrollStart={scrollStart}
            onScrollPrev={() => setScrollStart((s) => Math.max(0, s - 1))}
            onScrollNext={() =>
              setScrollStart((s) => Math.min(customers.length - 3, s + 1))
            }
          />

          <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0 items-stretch overflow-hidden">
            {/* Left Grid Section */}
            <div className="flex-1 min-w-0 max-h-[calc(100vh-140px)] overflow-y-auto pr-2 flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/pos")}
                  className="p-1 hover:bg-slate-200 rounded-full transition"
                >
                  <ArrowLeft size={18} className="text-slate-900" />
                </button>
                <h2 className="text-sm font-bold text-slate-800">Expense</h2>
              </div>

              {loading ? (
                <p className="text-xs text-slate-400">Loading expenses...</p>
              ) : dbExpenses.filter((item) => !item.is_other).length === 0 ? (
                <p className="text-xs text-slate-400">No expenses found.</p>
              ) : (
                /* Improved Grid & Button Layout:
                   1. Increased column min-width (minmax 130px / 140px)
                   2. Optimized text size & padding so full names display clearly
                */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {dbExpenses
                    .filter((item) => !item.is_other)
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleOpenEditAmount(item)}
                        className="bg-white border border-slate-200 hover:border-[#CD051F] rounded-xl flex items-center justify-between p-2 pl-3 shadow-sm transition group cursor-pointer overflow-hidden min-h-[44px]"
                        title={item.name}
                      >
                        <span className="text-[11px] sm:text-xs font-bold text-slate-800 leading-tight text-left pr-1 capitalize break-words line-clamp-2">
                          {item.name}
                        </span>
                        <div className="w-7 h-7 shrink-0 rounded-lg bg-black text-white flex items-center justify-center group-hover:bg-[#CD051F] transition">
                          <Pencil size={12} />
                        </div>
                      </button>
                    ))}
                </div>
              )}

              {/* Add Other Expense Button */}
              <div>
                <button
                  onClick={() => {
                    setNewExpenseName("");
                    setNewExpenseDescription("");
                    setExpenseAmount("");
                    setActiveModal("add");
                  }}
                  className="bg-[#CD051F] hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-lg transition shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} strokeWidth={3} />
                  Add Other Expense
                </button>
              </div>
            </div>

            {/* Right Panel: Slightly constrained width (320px) to maximize left section space */}
            <div className="w-full xl:w-[320px] shrink-0 max-h-[calc(100vh-140px)] bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
              <div className="bg-[#CD051F] text-white py-3.5 px-4 text-center">
                <h3 className="text-sm font-extrabold tracking-wide uppercase">
                  Recently Added
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      Loading recent expenses...
                    </p>
                  ) : todayExpenses.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No expenses recorded yet.
                    </p>
                  ) : (
                    todayExpenses.map((exp) => (
                      <div
                        key={exp.key}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 capitalize">
                            {exp.name}
                          </span>
                          {exp.timestamp > 0 && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(exp.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-black text-[#CD051F]">
                          Rs. {Number(exp.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Recent Total</span>
                  <span className="text-base font-black text-slate-900">
                    Rs. {totalExpense.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Amount Modal */}
      {activeModal === "edit" && selectedExpense && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAmountOnly}
            className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
          >
            <div className="bg-[#CD051F] px-5 py-3.5 flex items-center justify-between text-white">
              <h3 className="text-sm font-bold">Add Amount to: {selectedExpense.name}</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-white hover:opacity-75 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs font-semibold text-slate-500 space-y-0.5">
                <div>
                  Current Amount (Last 24h):{" "}
                  <span className="font-bold text-slate-800">
                    Rs. {Number(last24hAddedByExpenseId[String(selectedExpense.id)] || 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Lifetime total: Rs. {Number(selectedExpense.amount || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Amount to Add (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  autoFocus
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Enter amount to add..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-[#CD051F]"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#CD051F] hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Saving..." : "Add Amount"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Other Expense Modal */}
      {activeModal === "add" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddOtherExpense}
            className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
          >
            <div className="bg-[#CD051F] px-5 py-3.5 flex items-center justify-between text-white">
              <h3 className="text-sm font-bold">Add Other Expense</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-white hover:opacity-75 cursor-pointer"
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
                  value={newExpenseName}
                  onChange={(e) =>
                    setNewExpenseName(e.target.value.replace(/[0-9]/g, ""))
                  }
                  placeholder="e.g. Generator Fuel"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#CD051F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newExpenseDescription}
                  onChange={(e) => setNewExpenseDescription(e.target.value)}
                  placeholder="Enter details or notes..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#CD051F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Price / Amount (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Enter price..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-[#CD051F]"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#CD051F] hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Adding..." : "Add Expense"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ExpensePage;