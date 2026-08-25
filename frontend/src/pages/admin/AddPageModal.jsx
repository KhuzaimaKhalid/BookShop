import { useState } from "react";
import api from "../../services/api";

const AddPageModal = ({ onClose, onAdded }) => {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Page name is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await api.post("/pages", { name: name.trim() });
      if (onAdded) {
        onAdded(response.data?.page);
      }
      onClose();
    } catch (err) {
      console.error("Error creating page:", err);
      setError(err.response?.data?.message || "Failed to create page.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] p-8 flex flex-col items-center relative border border-gray-100">
        {error && (
          <div className="w-full mb-4 px-3 py-2 bg-red-50 text-[#CD051F] text-xs rounded-lg border border-red-200 text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
          <div className="w-full mb-6 text-center">
            <label className="block font-extrabold text-gray-900 text-sm mb-2.5">
              Page Name<span className="text-[#CD051F]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter page name"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-center text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-500 shadow-sm transition"
            />
          </div>

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

export default AddPageModal;