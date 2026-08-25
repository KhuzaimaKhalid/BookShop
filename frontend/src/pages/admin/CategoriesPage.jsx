import { useEffect, useState, useMemo } from "react";
import { Search, Plus, SquarePen, Trash2, Layers, X } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";
import EditCategoryModal from "./EditCategoryModal";
import AddCategoryModal from "./AddCategoryModal";

const PAGE_SIZE = 7;

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false); // Modal state

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, productsRes] = await Promise.all([
          api.get("/categories"),
          api.get("/product"),
        ]);

        setCategories(
          Array.isArray(categoriesRes.data?.categories)
            ? categoriesRes.data.categories
            : Array.isArray(categoriesRes.data)
            ? categoriesRes.data
            : []
        );
        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
      } catch (error) {
        console.error("Error fetching categories/products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getProductCount = (categoryId) =>
    products.filter((p) => p.category_id === categoryId).length;

  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [categories, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedCategories = filteredCategories.slice(startIdx, startIdx + PAGE_SIZE);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category. It may have products linked to it.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCategoryUpdated = (updatedCategory) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
    );
  };

  const handleCategoryAdded = (newCategory) => {
    setCategories((prev) => [newCategory, ...prev]);
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">
        Manage Products
      </h1>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-bold text-slate-900 shrink-0">
          Category List
        </h2>

        <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
          <div className="relative w-full max-w-[300px]">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Category by name"
              className="w-full border border-slate-200 rounded-lg pl-4 pr-9 py-2 text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:border-[#CD051F] transition"
            />
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 bg-[#CD051F] hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition shadow-sm shrink-0"
          >
            <Plus size={16} strokeWidth={3} />
            Add New Category
          </button>
        </div>
      </div>

      {/* Dark Table Card */}
      <div className="bg-[#151B26] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left font-semibold text-slate-300 text-xs uppercase tracking-wide px-6 py-4">
                Category Image
              </th>
              <th className="text-left font-semibold text-slate-300 text-xs uppercase tracking-wide px-6 py-4">
                Category Name
              </th>
              <th className="text-left font-semibold text-slate-300 text-xs uppercase tracking-wide px-6 py-4">
                Number of Products
              </th>
              <th className="text-left font-semibold text-slate-300 text-xs uppercase tracking-wide px-6 py-4">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-slate-400 text-sm">
                  Loading categories...
                </td>
              </tr>
            ) : paginatedCategories.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-slate-400 text-sm">
                  No categories found.
                </td>
              </tr>
            ) : (
              paginatedCategories.map((category) => (
                <tr
                  key={category.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 transition"
                >
                  <td className="px-6 py-3">
                    <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                      {category.image ? (
                        <img
                          src={category.image}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Layers size={20} className="text-white/70" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 font-semibold text-white">
                    {category.name}
                  </td>
                  <td className="px-6 py-3 text-slate-300">
                    {getProductCount(category.id)}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditTarget(category)}
                        className="w-8 h-8 flex items-center justify-center rounded-md border border-white/20 text-white hover:bg-white/10 transition"
                        title="Edit"
                      >
                        <SquarePen size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(category)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-[#CD051F] hover:bg-red-700 text-white transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
        <p className="text-xs text-slate-500">
          {filteredCategories.length === 0
            ? "Showing 0 category"
            : `Showing ${startIdx + 1} to ${Math.min(
                startIdx + PAGE_SIZE,
                filteredCategories.length
              )} of ${filteredCategories.length} categories`}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            Previous
          </button>

          {getPageNumbers().map((num) => (
            <button
              key={num}
              onClick={() => setPage(num)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                currentPage === num
                  ? "bg-[#CD051F] text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
          >
            Next
          </button>
        </div>
      </div>

      {/* Add Category Overlay Modal */}
      {isAddOpen && (
        <AddCategoryModal
          onClose={() => setIsAddOpen(false)}
          onAdded={handleCategoryAdded}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-[#CD051F]">
                Delete Category
              </h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-slate-500 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-8 text-center">
              <p className="text-base font-bold text-slate-900">
                Are you sure you want to delete "{deleteTarget.name}"?
              </p>
            </div>

            <div className="px-6 pb-6 grid grid-cols-2 gap-4">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="w-full bg-green-100 hover:bg-green-200 disabled:opacity-60 text-green-700 font-bold py-3 rounded-lg transition"
              >
                {deleting ? "Deleting..." : "Yes"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="w-full bg-red-50 hover:bg-red-100 text-[#CD051F] font-bold py-3 rounded-lg transition"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editTarget && (
        <EditCategoryModal
          category={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={handleCategoryUpdated}
        />
      )}
    </AdminLayout>
  );
};

export default CategoriesPage;