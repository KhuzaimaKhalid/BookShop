import { useState } from "react";
import { ChevronDown } from "lucide-react";
import api from "../../services/api";

const AddCategoryModal = ({ pages = [], defaultPageId, onClose, onAdded }) => {
  const [name, setName] = useState("");
  const [pageId, setPageId] = useState(defaultPageId || "");
  const [pageDropdownOpen, setPageDropdownOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

      const response = await api.post("/categories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (onAdded) {
        onAdded(response.data?.category || response.data);
      }
      onClose();
    } catch (err) {
      console.error("Error creating category:", err);
      setError(err.response?.data?.message || "Failed to create category.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[460px] p-8 flex flex-col items-center relative border border-gray-100">
        {error && (
          <div className="w-full mb-4 px-3 py-2 bg-red-50 text-[#CD051F] text-xs rounded-lg border border-red-200 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          {/* Page Selector */}
          <div className="w-full mb-5 text-center">
            <label className="block font-extrabold text-gray-900 text-sm mb-2.5">
              Page<span className="text-[#CD051F]">*</span>
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
              Category Name<span className="text-[#CD051F]">*</span>
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
              Category Image<span className="text-[#CD051F]">*</span>
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
                  <div className="w-12 h-14 bg-white rounded-lg flex flex-col items-center justify-center">
                    <svg
                      className="w-7 h-7 text-[#181d24]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15V3m0 0l-4 4m4-4l4 4"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <span className="text-black font-bold text-sm tracking-tight">
                Click to upload image
              </span>
              <span className="text-[11px] text-gray-500 font-semibold mt-0.5">
                PNG, JPG upto 2MB
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
              className="flex-1 py-2.5 bg-[#CD051F] hover:bg-red-700 text-white rounded-lg font-bold text-xs transition text-center shadow-sm disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;