import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import api from "../../services/api";
import POSHeader from "../../components/pos/POSHeader";
import CategorySidebar from "../../components/pos/CategorySidebar";
import CustomerTabs from "../../components/pos/CustomerTabs";

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

  // Compute Total Sum for Recently Added
  const totalExpense = useMemo(() => {
    return dbExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  }, [dbExpenses]);

  // Tab Handler
  const handleAddCustomer = () => {
    setCustomers((prev) => [...prev, createEmptyCustomer(`Customer ${prev.length + 1}`)]);
    setActiveIndex(customers.length);
  };

  // Open Edit Amount Modal (Pencil Icon)
  const handleOpenEditAmount = (item) => {
    setSelectedExpense(item);
    setExpenseAmount(item.amount ? String(item.amount) : "");
    setActiveModal("edit");
  };

  // 1. Updating Price for Pre-Defined Admin Expenses -> is_other = 0
  const handleSaveAmountOnly = async (e) => {
    e?.preventDefault();
    if (!selectedExpense || !expenseAmount) return;

    setSubmitting(true);
    try {
      await api.put(`/expenses/${selectedExpense.id}`, {
        name: selectedExpense.name,
        amount: Number(expenseAmount),
        is_other: 0, // EXPLICITLY SET 0 FOR STANDARD ADMIN EXPENSES
      });

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

  // 2. Creating New Custom Expense -> is_other = 1
  const handleAddOtherExpense = async (e) => {
    e?.preventDefault();
    if (!newExpenseName.trim() || !expenseAmount) return;

    setSubmitting(true);
    try {
      await api.post("/expenses", {
        name: newExpenseName.trim(),
        description: newExpenseDescription.trim(),
        amount: Number(expenseAmount),
        is_other: 1, // EXPLICITLY SET 1 ONLY FOR OTHER CUSTOM EXPENSES
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {dbExpenses
                    .filter((item) => !item.is_other)
                    .map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleOpenEditAmount(item)}
                        className="bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center p-3 shadow-sm hover:border-[#CD051F] transition text-center"
                        title={`Enter price for ${item.name}`}
                      >
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.name}
                        </span>
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
                  className="bg-[#CD051F] hover:bg-red-700 text-white font-bold text-xs px-5 py-3 rounded-lg transition shadow-sm flex items-center gap-2"
                >
                  <Plus size={16} strokeWidth={3} />
                  Add Other Expense
                </button>
              </div>
            </div>

            {/* Right Panel: Recently Added */}
            <div className="w-full xl:w-[380px] shrink-0 max-h-[calc(100vh-140px)] bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
              <div className="bg-[#CD051F] text-white py-3.5 px-4 text-center">
                <h3 className="text-base font-extrabold tracking-wide">
                  Recently Added
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      Loading recent expenses...
                    </p>
                  ) : dbExpenses.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No expenses recorded yet.
                    </p>
                  ) : (
                    dbExpenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">
                            {exp.name}
                          </span>
                          {exp.created_at && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(exp.created_at).toLocaleTimeString([], {
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
                  <span className="text-xs font-bold text-slate-600">Total</span>
                  <span className="text-base font-black text-slate-900">
                    Rs. {totalExpense.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Pencil Button Modal -> is_other = 0 */}
      {activeModal === "edit" && selectedExpense && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAmountOnly}
            className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="bg-[#CD051F] px-5 py-3.5 flex items-center justify-between text-white">
              <h3 className="text-sm font-bold">Enter Amount: {selectedExpense.name}</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-white hover:opacity-75"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Price / Amount (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  autoFocus
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Enter amount..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-[#CD051F]"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#CD051F] hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Price"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Other Expense Modal -> is_other = 1 */}
      {activeModal === "add" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddOtherExpense}
            className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="bg-[#CD051F] px-5 py-3.5 flex items-center justify-between text-white">
              <h3 className="text-sm font-bold">Add Other Expense</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-white hover:opacity-75"
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
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#CD051F] hover:bg-red-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"
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