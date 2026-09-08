import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, FileUp, X } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const AddProductPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Raw list states
  const [pages, setPages] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);

  // Search input query states
  const [pageSearch, setPageSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  // Dropdown open states
  const [pageOpen, setPageOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [form, setForm] = useState({
    page_id: "",
    category_id: "",
    name: "",
    purchase_price: "",
    selling_price: "",
    stock_quantity: "",
    min_stock_level: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Fetch all pages and all categories on initial mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pagesRes, categoriesRes] = await Promise.all([
          api.get("/pages"),
          api.get("/categories"),
        ]);

        const pageData = Array.isArray(pagesRes.data)
          ? pagesRes.data
          : pagesRes.data?.pages || [];
          
        const categoryData = Array.isArray(categoriesRes.data)
          ? categoriesRes.data
          : categoriesRes.data?.categories || [];

        setPages(pageData);
        setAllCategories(categoryData);
      } catch (error) {
        console.error("Error fetching pages or categories:", error);
      }
    };
    fetchData();
  }, []);

  // Filter categories strictly when selected page_id changes
  useEffect(() => {
    if (!form.page_id) {
      setAvailableCategories([]);
      return;
    }

    // Explicitly filter categories by matching page_id or page.id property
    const filtered = allCategories.filter((cat) => {
      const categoryPageId = cat.page_id || cat.page?.id;
      return String(categoryPageId) === String(form.page_id);
    });

    setAvailableCategories(filtered);
  }, [form.page_id, allCategories]);

  // Dynamic search filtering for dropdown lists
  const filteredPages = pages.filter((p) =>
    (p.name || "").toLowerCase().includes(pageSearch.toLowerCase())
  );

  const filteredCategories = availableCategories.filter((c) =>
    (c.name || "").toLowerCase().includes(categorySearch.toLowerCase())
  );

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // Handle page selection
  const handleSelectPage = (page) => {
    setForm((prev) => ({
      ...prev,
      page_id: page.id,
      category_id: "", // Reset category selection
    }));
    setPageSearch(page.name);
    setCategorySearch(""); // Reset category search input
    setPageOpen(false);
    setErrors((prev) => ({ ...prev, page_id: "", category_id: "" }));
  };

  // Clear page selection
  const handleClearPage = () => {
    setForm((prev) => ({ ...prev, page_id: "", category_id: "" }));
    setPageSearch("");
    setCategorySearch("");
    setPageOpen(false);
  };

  // Handle category selection
  const handleSelectCategory = (cat) => {
    setForm((prev) => ({ ...prev, category_id: cat.id }));
    setCategorySearch(cat.name);
    setCategoryOpen(false);
    setErrors((prev) => ({ ...prev, category_id: "" }));
  };

  // Clear category selection
  const handleClearCategory = () => {
    setForm((prev) => ({ ...prev, category_id: "" }));
    setCategorySearch("");
    setCategoryOpen(false);
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      alert("Only PNG and JPG images are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const next = {};
    if (!form.page_id) next.page_id = "Page selection is required";
    if (!form.category_id) next.category_id = "Category selection is required";
    if (!form.name.trim()) next.name = "Product name is required";
    if (!form.selling_price) next.selling_price = "Selling price is required";
    if (!form.stock_quantity && form.stock_quantity !== "0")
      next.stock_quantity = "Stock quantity is required";
    if (!form.min_stock_level && form.min_stock_level !== "0")
      next.min_stock_level = "Minimum stock level is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    setSubmitError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("page_id", form.page_id);
      formData.append("category_id", form.category_id);
      formData.append("name", form.name);
      formData.append("purchase_price", form.purchase_price || 0);
      formData.append("selling_price", form.selling_price);
      formData.append("stock_quantity", form.stock_quantity);
      formData.append("min_stock_level", form.min_stock_level);
      if (imageFile) formData.append("image", imageFile);

      await api.post("/product", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/admin/products");
    } catch (error) {
      console.error("Error creating product:", error);
      setSubmitError(
        error?.response?.data?.message || "Failed to save product."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isFormLocked = !form.category_id;

  return (
    <AdminLayout>
      <div className="flex flex-col h-full overflow-hidden">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight shrink-0">
          Add New Product
        </h1>
        <p className="text-xs text-slate-500 mb-3 shrink-0">
          Select Page and Category first to enable product fields
        </p>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex-1 min-h-0 overflow-hidden flex flex-col justify-center">
          <div className="flex flex-col lg:flex-row gap-5 items-stretch h-full">
            
            {/* Left: Product Image Upload */}
            <div className={`w-full lg:max-w-[200px] shrink-0 flex flex-col transition ${isFormLocked ? "opacity-50 pointer-events-none" : ""}`}>
              <h3 className="text-xs font-bold text-slate-900 mb-1.5">
                Product Image
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleImageChange}
                disabled={isFormLocked}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleImageClick}
                disabled={isFormLocked}
                className="w-full flex-1 border border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#CD051F] hover:bg-slate-50 transition overflow-hidden p-3"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                      <FileUp size={18} className="text-slate-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-slate-800">
                        Click to upload image
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        PNG, JPG upto 2MB
                      </p>
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* Right: Form Controls */}
            <div className="flex-1 min-w-[260px] flex flex-col justify-between gap-2.5">
              
              {/* Row 1: Searchable Page & Category Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Searchable Page Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Page<span className="text-[#CD051F]">*</span>
                  </label>
                  <div className="relative">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={pageSearch}
                        onChange={(e) => {
                          setPageSearch(e.target.value);
                          setPageOpen(true);
                          if (form.page_id) {
                            setForm((prev) => ({ ...prev, page_id: "", category_id: "" }));
                            setCategorySearch("");
                          }
                        }}
                        onFocus={() => setPageOpen(true)}
                        placeholder="Type or select page..."
                        className={`w-full border rounded-lg pl-3 pr-14 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#CD051F] transition ${
                          errors.page_id ? "border-red-400" : "border-slate-300"
                        }`}
                      />
                      <div className="absolute right-2 flex items-center gap-1 text-slate-400">
                        {pageSearch && (
                          <button
                            type="button"
                            onClick={handleClearPage}
                            className="hover:text-slate-600 p-0.5"
                          >
                            <X size={13} />
                          </button>
                        )}
                        <ChevronDown
                          size={14}
                          className={`cursor-pointer transition ${pageOpen ? "rotate-180" : ""}`}
                          onClick={() => setPageOpen((p) => !p)}
                        />
                      </div>
                    </div>

                    {pageOpen && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 max-h-36 overflow-y-auto">
                        {filteredPages.length > 0 ? (
                          filteredPages.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectPage(p)}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                            >
                              <span>{p.name}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-1.5 text-xs text-slate-400">
                            No matching pages
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.page_id && (
                    <p className="text-[9px] text-red-500 mt-0.5">{errors.page_id}</p>
                  )}
                </div>

                {/* Searchable Category Field (Disabled until Page selected) */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Category<span className="text-[#CD051F]">*</span>
                  </label>
                  <div className="relative">
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        disabled={!form.page_id}
                        value={categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          setCategoryOpen(true);
                          if (form.category_id) {
                            setForm((prev) => ({ ...prev, category_id: "" }));
                          }
                        }}
                        onFocus={() => form.page_id && setCategoryOpen(true)}
                        placeholder={
                          !form.page_id
                            ? "Select a Page first"
                            : "Type or select category..."
                        }
                        className={`w-full border rounded-lg pl-3 pr-14 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                          !form.page_id
                            ? "bg-slate-100 cursor-not-allowed border-slate-200 text-slate-400"
                            : errors.category_id
                            ? "border-red-400 focus:border-red-500"
                            : "border-slate-300 focus:border-[#CD051F]"
                        }`}
                      />
                      <div className="absolute right-2 flex items-center gap-1 text-slate-400">
                        {categorySearch && form.page_id && (
                          <button
                            type="button"
                            onClick={handleClearCategory}
                            className="hover:text-slate-600 p-0.5"
                          >
                            <X size={13} />
                          </button>
                        )}
                        <ChevronDown
                          size={14}
                          className={`cursor-pointer transition ${categoryOpen ? "rotate-180" : ""}`}
                          onClick={() => form.page_id && setCategoryOpen((p) => !p)}
                        />
                      </div>
                    </div>

                    {categoryOpen && form.page_id && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 py-1 max-h-36 overflow-y-auto">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectCategory(c)}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              {c.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-1.5 text-xs text-slate-400">
                            No categories found on this page
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {errors.category_id && (
                    <p className="text-[9px] text-red-500 mt-0.5">{errors.category_id}</p>
                  )}
                </div>

              </div>

              {/* Product Name (Disabled until Category is selected) */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Product Name<span className="text-[#CD051F]">*</span>
                </label>
                <input
                  type="text"
                  disabled={isFormLocked}
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder={isFormLocked ? "Select a Category first" : "Enter product name"}
                  className={`w-full border rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                    isFormLocked
                      ? "bg-slate-100 cursor-not-allowed border-slate-200"
                      : errors.name
                      ? "border-red-400 focus:border-red-500"
                      : "border-slate-300 focus:border-[#CD051F]"
                  }`}
                />
                {errors.name && (
                  <p className="text-[9px] text-red-500 mt-0.5">{errors.name}</p>
                )}
              </div>

              {/* Purchase Price & Selling Price (Disabled until Category is selected) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Purchase Price (PKR)
                  </label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={form.purchase_price}
                    onChange={(e) => handleChange("purchase_price", e.target.value)}
                    placeholder={isFormLocked ? "Locked" : "Enter purchase price"}
                    className={`w-full border rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                      isFormLocked
                        ? "bg-slate-100 cursor-not-allowed border-slate-200"
                        : "border-slate-300 focus:border-[#CD051F]"
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Selling Price (PKR)<span className="text-[#CD051F]">*</span>
                  </label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={form.selling_price}
                    onChange={(e) => handleChange("selling_price", e.target.value)}
                    placeholder={isFormLocked ? "Locked" : "Enter selling price"}
                    className={`w-full border rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                      isFormLocked
                        ? "bg-slate-100 cursor-not-allowed border-slate-200"
                        : errors.selling_price
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-300 focus:border-[#CD051F]"
                    }`}
                  />
                  {errors.selling_price && (
                    <p className="text-[9px] text-red-500 mt-0.5">{errors.selling_price}</p>
                  )}
                </div>
              </div>

              {/* Stock Quantity & Minimum Stock Level (Disabled until Category is selected) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Stock Quantity<span className="text-[#CD051F]">*</span>
                  </label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={form.stock_quantity}
                    onChange={(e) => handleChange("stock_quantity", e.target.value)}
                    placeholder={isFormLocked ? "Locked" : "Enter stock quantity"}
                    className={`w-full border rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                      isFormLocked
                        ? "bg-slate-100 cursor-not-allowed border-slate-200"
                        : errors.stock_quantity
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-300 focus:border-[#CD051F]"
                    }`}
                  />
                  {errors.stock_quantity && (
                    <p className="text-[9px] text-red-500 mt-0.5">{errors.stock_quantity}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Minimum Stock Level<span className="text-[#CD051F]">*</span>
                  </label>
                  <input
                    type="number"
                    disabled={isFormLocked}
                    value={form.min_stock_level}
                    onChange={(e) => handleChange("min_stock_level", e.target.value)}
                    placeholder={isFormLocked ? "Locked" : "Enter min stock level"}
                    className={`w-full border rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                      isFormLocked
                        ? "bg-slate-100 cursor-not-allowed border-slate-200"
                        : errors.min_stock_level
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-300 focus:border-[#CD051F]"
                    }`}
                  />
                  {errors.min_stock_level && (
                    <p className="text-[9px] text-red-500 mt-0.5">{errors.min_stock_level}</p>
                  )}
                </div>
              </div>

              {submitError && (
                <p className="text-xs text-red-500 font-medium">{submitError}</p>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => navigate("/admin/products")}
                  className="w-full border border-slate-300 rounded-lg py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={submitting || isFormLocked}
                  className="w-full bg-[#CD051F] hover:bg-red-700 disabled:opacity-50 text-white rounded-lg py-2 text-xs font-bold transition shadow-sm"
                >
                  {submitting ? "Saving..." : "Save Product"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddProductPage;