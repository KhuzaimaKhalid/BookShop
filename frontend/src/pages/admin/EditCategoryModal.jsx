import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import api from "../../services/api";

const EditCategoryModal = ({ category, pages = [], onClose, onUpdated }) => {
  const [name, setName] = useState(category?.name || "");
  const [pageId, setPageId] = useState(category?.page_id || "");
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(category?.image || null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setPageId(category.page_id || "");
      setImagePreview(category.image || null);
      setImageFile(null);
    }
  }, [category]);

  const selectedPageName =
    pages.find((p) => String(p.id) === String(pageId))?.name || "Select Page";

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
        setError("Only PNG and JPG images are allowed.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("Image size must be under 2MB.");
        return;
      }
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    if (!pageId) {
      setError("Please select a page.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("page_id", pageId);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await api.put(`/categories/${category.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (onUpdated) {
        onUpdated(
          response.data?.category ||
          response.data ||
          { ...category, name: name.trim(), image: imagePreview, page_id: pageId }
        );
      }
      onClose();
    } catch (err) {
      console.error("Error updating category:", err);
      setError(err.response?.data?.message || "Failed to update category.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[460px] p-8 flex flex-col items-center relative border border-gray-100">
        {error && (
          <div className="w-full mb-4 px-3 py-2 bg-red-50 text-[#D30027] text-xs rounded-lg border border-red-200 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          {/* Page Selector */}
          <div className="w-full mb-5 text-center">
            <label className="block font-extrabold text-gray-900 text-sm mb-2.5">
              Page<span className="text-[#D30027]">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setPageDropdownOpen((p) => !p)}
                className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-4 py-2.5 text-xs text-left text-gray-800 hover:border-gray-500 transition"
              >
                <span className={pageId ? "text-gray-800" : "text-gray-400"}>
                  {selectedPageName}
                </span>
                <ChevronDown
                  size={14}
                  className={pageDropdownOpen ? "rotate-180 transition text-gray-400" : "transition text-gray-400"}
                />
              </button>
              {pageDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-44 overflow-y-auto">
                  {pages.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPageId(p.id);
                        setPageDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Name Input */}
          <div className="w-full mb-6 text-center">
            <label className="block font-extrabold text-gray-900 text-sm mb-2.5">
              Category Name<span className="text-[#D30027]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-center text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-500 shadow-sm transition"
            />
          </div>

          {/* Category Image Box */}
          <div className="flex flex-col items-center w-full mb-6">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Category Image
            </label>

            <label className="w-full max-w-[280px] border-2 border-black rounded-xl p-3 flex flex-col items-center cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="w-full h-40 bg-[#181d24] rounded-lg flex items-center justify-center overflow-hidden mb-3">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Category preview"
                    className="max-h-full max-w-full object-contain p-2"
                  />
                ) : (
                  <svg
                    className="w-16 h-16 text-white stroke-current stroke-[1.5]"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </div>

              <span className="text-red-600 font-bold text-sm tracking-tight">
                Click to change image
              </span>
              <span className="text-[11px] text-gray-500 font-semibold mt-0.5">
                PNG, JPG up to 2MB
              </span>

              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-800 font-bold text-xs hover:bg-gray-50 transition text-center shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#D30027] hover:bg-red-700 text-white rounded-lg font-bold text-xs transition text-center shadow-sm disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryModal;