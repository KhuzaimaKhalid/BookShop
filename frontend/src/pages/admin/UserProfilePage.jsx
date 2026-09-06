import { useState, useEffect } from "react";
import { Edit3, Calendar, X, Upload, Trash2, ShieldCheck } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";
import trustNexusLogo from "../../assets/logo.png";

const formatToLocalTime = (utcString) => {
  if (!utcString) return "Never";
  const formattedIso = utcString.includes("T")
    ? utcString
    : utcString.replace(" ", "T") + "Z";
  const date = new Date(formattedIso);
  if (isNaN(date.getTime())) return utcString;

  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const UserProfilePage = () => {
  const [profile, setProfile] = useState({ full_name: "", email: "", updated_at: "" });
  const [businessName, setBusinessName] = useState("Learning Corner");
  const [businessId, setBusinessId] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const [nameForm, setNameForm] = useState({ full_name: "" });
  const [emailForm, setEmailForm] = useState({ email: "" });
  const [businessNameForm, setBusinessNameForm] = useState({ name: "" });
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Invoice Settings Form State
  const [invoiceForm, setInvoiceForm] = useState({
    name: "Learning Corner",
    tagline: "Stationery & Learning Solutions",
    contact: "031597468123",
    invoice_prefix: "INV",
    start_number: "03135",
    logo: "",
    logoFile: null,
    footer_note: "Thank you for choosing us!",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchProfileAndHistory = async () => {
    try {
      setLoading(true);
      const [resProfile, resHistory, resBusiness] = await Promise.all([
        api.get("/user/profile"),
        api.get("/user/change-history"),
        api.get("/business/name"),
      ]);

      if (resProfile?.data?.user) {
        setProfile(resProfile.data.user);
      }

      if (resHistory?.data?.history) {
        setHistory(resHistory.data.history);
      }

      if (resBusiness?.data?.business) {
        const b = resBusiness.data.business;
        setBusinessName(b.name || "Learning Corner");
        setBusinessId(b.business_id || b.id);

        setInvoiceForm((prev) => ({
          ...prev,
          name: b.name || "Learning Corner",
          tagline: b.tagline || "Stationery & Learning Solutions",
          contact: b.contact || "031597468123",
          invoice_prefix: b.invoice_prefix || "INV",
          start_number: b.start_number || "03135",
          logo: b.logo || "",
          footer_note: b.footer_note || "Thank you for choosing us!",
        }));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndHistory();
  }, []);

  const openModal = (type) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (type === "name") setNameForm({ full_name: profile.full_name || "" });
    if (type === "email") setEmailForm({ email: profile.email || "" });
    if (type === "business") setBusinessNameForm({ name: businessName });
    if (type === "password")
      setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
    setActiveModal(type);
  };

  const handleUpdateProfile = async (e, field) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload =
        field === "name"
          ? { full_name: nameForm.full_name, email: profile.email }
          : { full_name: profile.full_name, email: emailForm.email };

      const res = await api.put("/user/profile", payload);
      if (res.data?.status === "success") {
        setSuccessMsg("Profile updated successfully!");
        fetchProfileAndHistory();
        setTimeout(() => setActiveModal(null), 1000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update profile.");
    }
  };

  const handleUpdateBusinessName = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!businessId) {
      setErrorMsg("Business ID not loaded yet. Please try again in a moment.");
      return;
    }

    try {
      await api.put("/business/settings", {
        name: businessNameForm.name,
        business_id: businessId,
      });
      setBusinessName(businessNameForm.name);
      setSuccessMsg("Business name updated successfully!");
      fetchProfileAndHistory();
      setTimeout(() => setActiveModal(null), 1000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update business name.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setErrorMsg("New password and confirm password do not match");
      return;
    }

    try {
      const res = await api.put("/user/change-password", passwordForm);
      if (res.data?.status === "success") {
        setSuccessMsg("Password changed successfully!");
        fetchProfileAndHistory();
        setTimeout(() => setActiveModal(null), 1000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Password change failed.");
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg("File size must be under 2MB.");
        return;
      }
      setInvoiceForm((prev) => ({
        ...prev,
        logoFile: file,
        logo: URL.createObjectURL(file),
      }));
    }
  };

  const handleSaveInvoiceSettings = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!businessId) {
      setErrorMsg("Business ID missing. Please refresh.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("business_id", businessId);
      formData.append("name", invoiceForm.name);
      formData.append("tagline", invoiceForm.tagline);
      formData.append("contact", invoiceForm.contact);
      formData.append("invoice_prefix", invoiceForm.invoice_prefix);
      formData.append("start_number", invoiceForm.start_number);
      formData.append("footer_note", invoiceForm.footer_note);

      if (invoiceForm.logoFile) {
        formData.append("logo", invoiceForm.logoFile);
      }

      await api.put("/business/settings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccessMsg("Invoice settings updated successfully!");
      fetchProfileAndHistory();
      setTimeout(() => setActiveModal(null), 1000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to update invoice settings.");
    }
  };

  return (
    <AdminLayout>
      <div className="profile-page-wrapper w-full">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
              PROFILE
            </h1>
            <p className="text-sm text-slate-500">
              View and manage your account information
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openModal("business")}
              className="bg-[#CD051F] hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-sm transition leading-tight text-center"
            >
              Edit Business<br className="hidden sm:inline" /> Name
            </button>
            <button
              onClick={() => openModal("invoice")}
              className="bg-[#CD051F] hover:bg-red-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg shadow-sm transition leading-tight text-center"
            >
              Edit<br className="hidden sm:inline" /> Invoice
            </button>
          </div>
        </div>

        {/* Profile Info & History */}
        <div className="flex flex-wrap lg:flex-nowrap gap-6 items-start">
          <div className="w-full lg:w-7/12 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-extrabold text-slate-900 text-center uppercase tracking-wide py-4 border-b border-slate-100">
              ACCOUNT INFORMATION
            </h3>

            {loading ? (
              <p className="text-center py-6 text-sm text-slate-500">Loading profile...</p>
            ) : (
              <div className="divide-y divide-slate-100">
                <div className="flex items-center py-6 px-2">
                  <span className="w-1/3 text-sm font-semibold text-slate-900">Username</span>
                  <span className="w-10 text-sm font-bold text-slate-400 text-center">:</span>
                  <span className="flex-1 text-sm font-medium text-slate-800">{profile.full_name || "Admin"}</span>
                  <button onClick={() => openModal("name")} className="text-rose-500 hover:text-rose-600 p-1">
                    <Edit3 size={18} />
                  </button>
                </div>

                <div className="flex items-center py-6 px-2">
                  <span className="w-1/3 text-sm font-semibold text-slate-900">Email</span>
                  <span className="w-10 text-sm font-bold text-slate-400 text-center">:</span>
                  <span className="flex-1 text-sm font-medium text-slate-800">{profile.email || "admin@atr.com"}</span>
                  <button onClick={() => openModal("email")} className="text-rose-500 hover:text-rose-600 p-1">
                    <Edit3 size={18} />
                  </button>
                </div>

                <div className="flex items-center py-6 px-2">
                  <span className="w-1/3 text-sm font-semibold text-slate-900">Password</span>
                  <span className="w-10 text-sm font-bold text-slate-400 text-center">:</span>
                  <span className="flex-1 text-sm font-medium text-slate-800 tracking-widest">••••••••</span>
                  <button onClick={() => openModal("password")} className="text-rose-500 hover:text-rose-600 p-1">
                    <Edit3 size={18} />
                  </button>
                </div>

                <div className="flex items-center py-6 px-2">
                  <span className="w-1/3 text-sm font-semibold text-slate-900">Last Login</span>
                  <span className="w-10 text-sm font-bold text-slate-400 text-center">:</span>
                  <span className="flex-1 text-sm font-medium text-slate-800">{formatToLocalTime(profile.updated_at)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-5/12 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 text-center tracking-tight mb-6">
              Changed History
            </h3>

            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-xs text-center text-slate-400 py-4">No recent changes logged.</p>
              ) : (
                history.map((item) => {
                  const isUsername = item.change_type === "Username Changed";
                  const isEmail = item.change_type === "Email Changed";

                  const cardStyle = isUsername
                    ? "border-rose-300 bg-rose-50/40 text-rose-600"
                    : isEmail
                      ? "border-indigo-300 bg-indigo-50/40 text-indigo-600"
                      : "border-emerald-300 bg-emerald-50/40 text-emerald-600";

                  return (
                    <div key={item.id} className={`border rounded-xl p-4 transition-all ${cardStyle}`}>
                      <h4 className="text-sm font-bold mb-2">{item.change_type}</h4>

                      {item.old_value && (
                        <div className="text-xs text-slate-700 space-y-1 mb-2">
                          <p><span className="font-semibold text-slate-500">From:</span> {item.old_value}</p>
                          <p><span className="font-semibold text-slate-500">To:</span> {item.new_value}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                        <Calendar size={14} />
                        <span>{formatToLocalTime(item.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* EDIT INVOICE MODAL */}
        {activeModal === "invoice" && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden relative my-6">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Edit Invoice</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 transition">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Controls */}
                <form onSubmit={handleSaveInvoiceSettings} className="lg:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-900 mb-1 block">
                        Business Name<span className="text-[#CD051F]">*</span>
                      </label>
                      <input
                        type="text"
                        value={invoiceForm.name}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, name: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#CD051F]"
                        required
                      />
                    </div>

                    <div className="row-span-3 flex flex-col">
                      <label className="text-xs font-bold text-slate-900 mb-1 block">
                        Business Logo (optional)
                      </label>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center flex-1 bg-slate-50 min-h-[120px]">
                        {invoiceForm.logo ? (
                          <img src={invoiceForm.logo} alt="Logo Preview" className="max-h-16 object-contain mb-2" />
                        ) : (
                          <p className="text-[11px] text-slate-400 font-medium text-center">PNG, JPG up to 2MB</p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <label className="flex-1 bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition">
                          <Upload size={13} />
                          Upload
                          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        </label>
                        <button
                          type="button"
                          onClick={() => setInvoiceForm({ ...invoiceForm, logo: "", logoFile: null })}
                          className="bg-rose-50 border border-rose-200 text-[#CD051F] hover:bg-rose-100 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-900 mb-1 block">
                        Business tagline (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={invoiceForm.tagline}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, tagline: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#CD051F] resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-900 mb-1 block">
                        Contact (Optional)
                      </label>
                      <input
                        type="text"
                        value={invoiceForm.contact}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, contact: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#CD051F]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-900 mb-1 block">Invoice Prefix</label>
                      <input
                        type="text"
                        value={invoiceForm.invoice_prefix}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_prefix: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#CD051F]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-900 mb-1 block">Start Number</label>
                      <input
                        type="text"
                        value={invoiceForm.start_number}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, start_number: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#CD051F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-900 mb-1 block">
                      Footer (Note Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={invoiceForm.footer_note}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, footer_note: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#CD051F] resize-none"
                    />
                  </div>

                  {errorMsg && <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>}
                  {successMsg && <p className="text-xs text-emerald-600 font-semibold">{successMsg}</p>}

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="px-5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#CD051F] text-white rounded-xl text-xs font-bold hover:bg-red-700 transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>

                {/* Thermal Live Preview */}
                <div className="lg:col-span-5 bg-slate-100 p-4 rounded-xl flex justify-center items-center">
                  <div className="w-[260px] bg-white border border-slate-300 shadow-sm p-4 pt-4 pb-6 font-mono text-[11px] text-slate-900 leading-tight">
                    <div className="text-center pb-2 border-b border-dashed border-slate-400">
                      {invoiceForm.logo && (
                        <img src={invoiceForm.logo} alt="Logo" className="h-8 max-w-full mx-auto mb-1 grayscale object-contain" />
                      )}
                      <p className="font-bold uppercase tracking-wider text-xs">{invoiceForm.name || "BUSINESS NAME"}</p>
                      <p className="text-[10px] text-slate-600">{invoiceForm.tagline}</p>
                      <p className="text-[10px] text-slate-600">TEL: {invoiceForm.contact}</p>
                    </div>

                    <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
                      <div className="flex justify-between">
                        <span>INVOICE:</span>
                        <span className="font-bold">{invoiceForm.invoice_prefix}-{invoiceForm.start_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DATE:</span>
                        <span>05-SEP-2026</span>
                      </div>
                    </div>

                    <div className="py-2 border-b border-dashed border-slate-400">
                      <div className="grid grid-cols-12 font-bold mb-1 border-b border-slate-300 pb-1">
                        <span className="col-span-6">ITEM</span>
                        <span className="col-span-2 text-center">QTY</span>
                        <span className="col-span-4 text-right">PRICE</span>
                      </div>
                      <div className="grid grid-cols-12 py-0.5">
                        <span className="col-span-6 truncate">Sample Item</span>
                        <span className="col-span-2 text-center">1</span>
                        <span className="col-span-4 text-right">1,000</span>
                      </div>
                    </div>

                    <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
                      <div className="flex justify-between font-bold text-xs pt-0.5">
                        <span>TOTAL:</span>
                        <span>Rs. 1,000</span>
                      </div>
                    </div>

                    {/* Receipt Footer with Trust Nexus Logo, 2 lines, and Extra Bottom Paper Cut Space */}
                    <div className="pt-3 pb-4 text-center text-[10px] space-y-1">
                      <p className="font-semibold uppercase mb-2">{invoiceForm.footer_note}</p>

                      {/* Trust Nexus Small Logo */}
                      <div className="flex justify-center my-1">
                        <img
                          src={trustNexusLogo}
                          alt="Trust Nexus Logo"
                          className="h-4 max-w-[80px] object-contain grayscale opacity-80"
                        />
                      </div>

                      {/* 2 Footer Lines */}
                      <p className="font-bold text-[10px] tracking-wide uppercase">Powered By Trust Nexus</p>
                      <p className="text-[10px] font-medium text-slate-700">0303-8184136</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Business Name Modal */}
        {activeModal === "business" && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden relative">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Edit Business Name</h3>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateBusinessName} className="p-6 space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-900 mb-2 block">
                    Business Name<span className="text-[#CD051F]">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessNameForm.name}
                    onChange={(e) => setBusinessNameForm({ name: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#CD051F]"
                    required
                  />
                </div>

                {errorMsg && <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>}
                {successMsg && <p className="text-xs text-emerald-600 font-semibold">{successMsg}</p>}

                <div className="flex items-center justify-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-6 py-2 border border-slate-300 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#CD051F] text-white rounded-md text-xs font-bold hover:bg-red-700 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Name Modal */}
        {activeModal === "name" && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
              <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-500">
                <X size={20} />
              </button>
              <h3 className="text-xl font-extrabold text-[#CD051F] text-center mb-6">Update Username</h3>
              <form onSubmit={(e) => handleUpdateProfile(e, "name")} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-900 mb-1 block">Full Name</label>
                  <input
                    type="text"
                    value={nameForm.full_name}
                    onChange={(e) => setNameForm({ full_name: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                {errorMsg && <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>}
                {successMsg && <p className="text-xs text-emerald-600 font-semibold">{successMsg}</p>}
                <button type="submit" className="w-full py-3 bg-[#CD051F] text-white rounded-xl text-sm font-bold">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Edit Email Modal */}
        {activeModal === "email" && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
              <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-500">
                <X size={20} />
              </button>
              <h3 className="text-xl font-extrabold text-[#CD051F] text-center mb-6">Update Email</h3>
              <form onSubmit={(e) => handleUpdateProfile(e, "email")} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-900 mb-1 block">New Email</label>
                  <input
                    type="email"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({ email: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                {errorMsg && <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>}
                {successMsg && <p className="text-xs text-emerald-600 font-semibold">{successMsg}</p>}
                <button type="submit" className="w-full py-3 bg-[#CD051F] text-white rounded-xl text-sm font-bold">
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {activeModal === "password" && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
              <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-slate-500">
                <X size={20} />
              </button>
              <h3 className="text-xl font-extrabold text-[#CD051F] text-center mb-6">Change Password</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-900 mb-1 block">Old Password</label>
                  <input
                    type="password"
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-900 mb-1 block">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-900 mb-1 block">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                {errorMsg && <p className="text-xs text-rose-600 font-semibold">{errorMsg}</p>}
                {successMsg && <p className="text-xs text-emerald-600 font-semibold">{successMsg}</p>}
                <button type="submit" className="w-full py-3 bg-[#CD051F] text-white rounded-xl text-sm font-bold">
                  Change Password
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserProfilePage;