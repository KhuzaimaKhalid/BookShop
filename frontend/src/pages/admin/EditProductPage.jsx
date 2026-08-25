import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronDown, FileUp } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const EditProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
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
    status: "Active",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
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

    const fetchProduct = async () => {
      try {
        const res = await api.get(`/product/${id}`);
        const product = res.data;
        setForm({
          category_id: product.category_id ?? "",
          name: product.name ?? "",
          purchase_price: product.purchase_price ?? "",
          selling_price: product.selling_price ?? "",
          stock_quantity: product.stock_quantity ?? "",
          min_stock_level: product.min_stock_level ?? "",
          status: product.status || "Active",
        });
        setExistingImage(product.image || null);
      } catch (error) {
        console.error("Error fetching product:", error);
        setSubmitError("Failed to load product.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
    fetchProduct();
  }, [id]);

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
    if (!form.category_id) next.category_id = "Category is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    setSubmitError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category_id", form.category_id);
      formData.append("name", form.name);
      formData.append("purchase_price", form.purchase_price || 0);
      formData.append("selling_price", form.selling_price);
      formData.append("stock_quantity", form.stock_quantity);
      formData.append("min_stock_level", form.min_stock_level);
      formData.append("status", form.status || "Active");
      if (imageFile) formData.append("image", imageFile);

      await api.put(`/product/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      navigate("/admin/products");
    } catch (error) {
      console.error("Error updating product:", error);
      setSubmitError(
        error?.response?.data?.message || "Failed to save changes."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-sm text-slate-500">Loading product...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
        Edit Product
      </h1>
      <p className="text-sm text-slate-500 mb-6">
        Edit the product details below
      </p>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
        <div className="flex flex-wrap gap-10">
          {/* Left: Image Upload */}
          <div className="w-full max-w-[300px] shrink-0">
            <h3 className="text-base font-bold text-slate-900 mb-3">
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
              className="w-full aspect-square border border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-[#CD051F] hover:bg-slate-50 transition overflow-hidden"
            >
              {imagePreview || existingImage ? (
                <img
                  src={imagePreview || existingImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center">
                    <FileUp size={26} className="text-slate-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-800">
                      Click to upload image
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      PNG, JPG upto 2MB
                    </p>
                  </div>
                </>
              )}
            </button>
            {(imagePreview || existingImage) && (
              <>
                <p className="text-sm font-bold text-[#CD051F] text-center mt-3">
                  Click to change image
                </p>
                <p className="text-xs text-slate-400 text-center">
                  PNG, JPG upto 2MB
                </p>
              </>
            )}
          </div>

          {/* Right: Form Fields */}
          <div className="flex-1 min-w-[320px] flex flex-col gap-5">
            {/* Category */}
            <div>
              <label className="block text-base font-bold text-slate-900 mb-2">
                Category
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryOpen((p) => !p)}
                  className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-4 py-3 text-sm text-left text-slate-700 hover:border-slate-400 transition"
                >
                  <span className={form.category_id ? "text-slate-800" : "text-slate-400"}>
                    {selectedCategoryName}
                  </span>
                  <ChevronDown
                    size={16}
                    className={categoryOpen ? "rotate-180 transition text-slate-400" : "transition text-slate-400"}
                  />
                </button>
                {categoryOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1 max-h-56 overflow-y-auto">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          handleChange("category_id", c.id);
                          setCategoryOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.category_id && (
                <p className="text-xs text-red-500 mt-1">{errors.category_id}</p>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-base font-bold text-slate-900 mb-2">
                Product Name<span className="text-[#CD051F]">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter product name"
                className={`w-full border rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                  errors.name
                    ? "border-red-400 focus:border-red-500"
                    : "border-slate-300 focus:border-[#CD051F]"
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Purchase / Selling Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-base font-bold text-slate-900 mb-2">
                  Purchase Price (PKR)
                </label>
                <input
                  type="number"
                  value={form.purchase_price}
                  onChange={(e) => handleChange("purchase_price", e.target.value)}
                  placeholder="Enter purchase price"
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#CD051F] transition"
                />
              </div>
              <div>
                <label className="block text-base font-bold text-slate-900 mb-2">
                  Selling Price (PKR)<span className="text-[#CD051F]">*</span>
                </label>
                <input
                  type="number"
                  value={form.selling_price}
                  onChange={(e) => handleChange("selling_price", e.target.value)}
                  placeholder="Enter selling price"
                  className={`w-full border rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                    errors.selling_price
                      ? "border-red-400 focus:border-red-500"
                      : "border-slate-300 focus:border-[#CD051F]"
                  }`}
                />
                {errors.selling_price && (
                  <p className="text-xs text-red-500 mt-1">{errors.selling_price}</p>
                )}
              </div>
            </div>

            {/* Stock Quantity / Min Stock Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-base font-bold text-slate-900 mb-2">
                  Stock Quantity<span className="text-[#CD051F]">*</span>
                </label>
                <input
                  type="number"
                  value={form.stock_quantity}
                  onChange={(e) => handleChange("stock_quantity", e.target.value)}
                  placeholder="Enter stock quantity"
                  className={`w-full border rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                    errors.stock_quantity
                      ? "border-red-400 focus:border-red-500"
                      : "border-slate-300 focus:border-[#CD051F]"
                  }`}
                />
                {errors.stock_quantity && (
                  <p className="text-xs text-red-500 mt-1">{errors.stock_quantity}</p>
                )}
              </div>
              <div>
                <label className="block text-base font-bold text-slate-900 mb-2">
                  Minimum Stock Level<span className="text-[#CD051F]">*</span>
                </label>
                <input
                  type="number"
                  value={form.min_stock_level}
                  onChange={(e) => handleChange("min_stock_level", e.target.value)}
                  placeholder="Enter min stock level"
                  className={`w-full border rounded-lg px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition ${
                    errors.min_stock_level
                      ? "border-red-400 focus:border-red-500"
                      : "border-slate-300 focus:border-[#CD051F]"
                  }`}
                />
                {errors.min_stock_level && (
                  <p className="text-xs text-red-500 mt-1">{errors.min_stock_level}</p>
                )}
              </div>
            </div>

            {submitError && (
              <p className="text-sm text-red-500 font-medium">{submitError}</p>
            )}

            {/* Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="w-full border border-slate-300 rounded-lg py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={submitting}
                className="w-full bg-[#CD051F] hover:bg-red-700 disabled:opacity-60 text-white rounded-lg py-3 text-sm font-bold transition shadow-sm"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default EditProductPage;