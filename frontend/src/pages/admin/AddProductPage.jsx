import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, FileUp } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const AddProductPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [form, setForm] = useState({
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(
          Array.isArray(res.data?.categories) ? res.data.categories : []
        );
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const selectedCategoryName =
    categories.find((c) => String(c.id) === String(form.category_id))?.name ||
    "Select Category";

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
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
      if (form.category_id) formData.append("category_id", form.category_id);
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

  return (
    <AdminLayout>
      {/* Locked height container - No vertical scrollbar */}
      <div className="flex flex-col h-full overflow-hidden">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight shrink-0">
          Add New Products
        </h1>
        <p className="text-xs text-slate-500 mb-4 shrink-0">
          Fill in the product details below
        </p>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 flex-1 min-h-0 overflow-hidden flex flex-col justify-center">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch h-full">
            {/* Left: Image Upload */}
            <div className="w-full lg:max-w-[220px] shrink-0 flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Product Image
              </h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleImageClick}
                className="w-full flex-1 max-h-[220px] lg:max-h-none border border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#CD051F] hover:bg-slate-50 transition overflow-hidden p-4"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
                      <FileUp size={20} className="text-slate-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-800">
                        Click to upload image
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG upto 2MB
                      </p>
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* Right: Form Fields */}
            <div className="flex-1 min-w-[280px] flex flex-col justify-between gap-3">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Category
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCategoryOpen((p) => !p)}
                    className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 text-xs text-left text-slate-700 hover:border-slate-400 transition"
                  >
                    <span className={form.category_id ? "text-slate-800 font-medium" : "text-slate-400"}>
                      {selectedCategoryName}
                    </span>
                    <ChevronDown
                      size={14}
                      className={categoryOpen ? "rotate-180 transition text-slate-400" : "transition text-slate-400"}
                    />
                  </button>
                  {categoryOpen && (
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 max-h-40 overflow-y-auto">
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            handleChange("category_id", c.id);
                            setCategoryOpen(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  Product Name<span className="text-[#CD051F]">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter product name"
                  className={`w-full border rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                    errors.name
                      ? "border-red-400 focus:border-red-500"
                      : "border-slate-300 focus:border-[#CD051F]"
                  }`}
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>
                )}
              </div>

              {/* Purchase / Selling Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Purchase Price (PKR)
                  </label>
                  <input
                    type="number"
                    value={form.purchase_price}
                    onChange={(e) => handleChange("purchase_price", e.target.value)}
                    placeholder="Enter purchase price"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#CD051F] transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Selling Price (PKR)<span className="text-[#CD051F]">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.selling_price}
                    onChange={(e) => handleChange("selling_price", e.target.value)}
                    placeholder="Enter selling price"
                    className={`w-full border rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                      errors.selling_price
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-300 focus:border-[#CD051F]"
                    }`}
                  />
                  {errors.selling_price && (
                    <p className="text-[10px] text-red-500 mt-0.5">{errors.selling_price}</p>
                  )}
                </div>
              </div>

              {/* Stock Quantity / Min Stock Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Stock Quantity<span className="text-[#CD051F]">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.stock_quantity}
                    onChange={(e) => handleChange("stock_quantity", e.target.value)}
                    placeholder="Enter stock quantity"
                    className={`w-full border rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                      errors.stock_quantity
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-300 focus:border-[#CD051F]"
                    }`}
                  />
                  {errors.stock_quantity && (
                    <p className="text-[10px] text-red-500 mt-0.5">{errors.stock_quantity}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Minimum Stock Level<span className="text-[#CD051F]">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.min_stock_level}
                    onChange={(e) => handleChange("min_stock_level", e.target.value)}
                    placeholder="Enter min stock level"
                    className={`w-full border rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                      errors.min_stock_level
                        ? "border-red-400 focus:border-red-500"
                        : "border-slate-300 focus:border-[#CD051F]"
                    }`}
                  />
                  {errors.min_stock_level && (
                    <p className="text-[10px] text-red-500 mt-0.5">{errors.min_stock_level}</p>
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
                  disabled={submitting}
                  className="w-full bg-[#CD051F] hover:bg-red-700 disabled:opacity-60 text-white rounded-lg py-2 text-xs font-bold transition shadow-sm"
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