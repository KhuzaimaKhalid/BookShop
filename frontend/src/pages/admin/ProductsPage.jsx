import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Plus,
  SquarePen,
  Trash2,
  Package,
  X,
} from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const PAGE_SIZE = 7;

const getStockStatus = (product) => {
  if (product.stock_quantity === 0) return "Out of Stock";
  if (product.stock_quantity <= product.min_stock_level) return "Low Stock";
  return "Active";
};

const statusStyles = {
  Active: "bg-[#DCFCE7] text-[#16A34A]",
  "Low Stock": "bg-[#FEE2E2] text-[#DC2626]",
  "Out of Stock": "bg-[#E2E8F0] text-[#475569]",
};

const ProductsPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          api.get("/product"),
          api.get("/categories"),
        ]);

        setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
        setCategories(
          Array.isArray(categoriesRes.data?.categories)
            ? categoriesRes.data.categories
            : []
        );
      } catch (error) {
        console.error("Error fetching products/categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCategoryName = (categoryId) => {
    const match = categories.find((c) => c.id === categoryId);
    return match ? match.name : "Uncategorized";
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "All Categories" ||
        getCategoryName(p.category_id) === categoryFilter;
      const matchesStatus =
        statusFilter === "All Status" || getStockStatus(p) === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, categories, search, categoryFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(startIdx, startIdx + PAGE_SIZE);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = (id, name) => {
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/product/${deleteTarget.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (id) => {
    // TODO: build /admin/products/edit/:id page
    navigate(`/admin/products/edit/${id}`);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 3;
    for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) pages.push(i);
    return pages;
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">
        Manage Products
      </h1>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 shrink-0">
            Product List
          </h2>

          <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
            {/* Search */}
            <div className="relative w-full max-w-[280px]">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search product by name"
                className="w-full border border-slate-200 rounded-lg pl-4 pr-9 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#CD051F] transition"
              />
              <Search
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setCategoryOpen((p) => !p);
                  setStatusOpen(false);
                }}
                className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                {categoryFilter}
                <ChevronDown size={14} className={categoryOpen ? "rotate-180 transition" : "transition"} />
              </button>
              {categoryOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
                  <button
                    onClick={() => {
                      setCategoryFilter("All Categories");
                      setCategoryOpen(false);
                      setPage(1);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    All Categories
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCategoryFilter(c.name);
                        setCategoryOpen(false);
                        setPage(1);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="relative">
              <button
                onClick={() => {
                  setStatusOpen((p) => !p);
                  setCategoryOpen(false);
                }}
                className="flex items-center gap-2 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                {statusFilter}
                <ChevronDown size={14} className={statusOpen ? "rotate-180 transition" : "transition"} />
              </button>
              {statusOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
                  {["All Status", "Active", "Low Stock", "Out of Stock"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setStatusFilter(opt);
                        setStatusOpen(false);
                        setPage(1);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add Product */}
            <button
              onClick={() => navigate("/admin/products/add")}
              className="flex items-center gap-2 bg-[#CD051F] hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition shadow-sm shrink-0"
            >
              <Plus size={16} strokeWidth={3} />
              Add New Product
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-6 py-4">
                  Product Image
                </th>
                <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-6 py-4">
                  Product Name
                </th>
                <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-6 py-4">
                  Category
                </th>
                <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-6 py-4">
                  Price (PKR)
                </th>
                <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-6 py-4">
                  Stock
                </th>
                <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-6 py-4">
                  Status
                </th>
                <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-6 py-4">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                    Loading products...
                  </td>
                </tr>
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-sm">
                    No products found.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => {
                  const status = getStockStatus(product);
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition"
                    >
                      <td className="px-6 py-3">
                        <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={20} className="text-slate-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-800">
                        {product.name}
                      </td>
                      <td className="px-6 py-3 text-slate-600">
                        {getCategoryName(product.category_id)}
                      </td>
                      <td className="px-6 py-3 text-slate-700 font-medium">
                        {Number(product.selling_price).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-slate-700">
                        {String(product.stock_quantity).padStart(2, "0")}
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status]}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(product.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
                            title="Edit"
                          >
                            <SquarePen size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="w-8 h-8 flex items-center justify-center rounded-md bg-[#CD051F] hover:bg-red-700 text-white transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            {filteredProducts.length === 0
              ? "Showing 0 Products"
              : `Showing ${startIdx + 1} to ${Math.min(
                  startIdx + PAGE_SIZE,
                  filteredProducts.length
                )} of ${filteredProducts.length} Products`}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
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
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {num}
              </button>
            ))}

            {totalPages > 3 && <span className="text-slate-400 px-1">...</span>}

            {totalPages > 3 && (
              <button
                onClick={() => setPage(totalPages)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                  currentPage === totalPages
                    ? "bg-[#CD051F] text-white"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {totalPages}
              </button>
            )}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-xl font-extrabold text-[#CD051F]">
                Delete Product
              </h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-slate-600 hover:text-slate-900 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-10 text-center">
              <p className="text-lg font-bold text-slate-900">
                Are you sure you want to delete this product?
              </p>
            </div>

            <div className="px-6 pb-6 grid grid-cols-2 gap-5">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="w-full bg-[#DCFCE7] hover:bg-green-200 disabled:opacity-60 text-[#16A34A] font-bold py-3 rounded-lg transition"
              >
                {deleting ? "Deleting..." : "Yes"}
              </button>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="w-full bg-[#FEE2E2] hover:bg-red-200 text-[#CD051F] font-bold py-3 rounded-lg transition"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ProductsPage;