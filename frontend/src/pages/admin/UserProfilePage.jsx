import { useState, useEffect } from "react";
import { Edit3, Calendar, X } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

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
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const [nameForm, setNameForm] = useState({ full_name: "" });
  const [emailForm, setEmailForm] = useState({ email: "" });
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchProfileAndHistory = async () => {
    try {
      setLoading(true);
      const [resProfile, resHistory] = await Promise.all([
        api.get("/user/profile"),
        api.get("/user/change-history"),
      ]);

      if (resProfile.data?.user) setProfile(resProfile.data.user);
      if (resHistory.data?.history) setHistory(resHistory.data.history);
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

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
          PROFILE
        </h1>
        <p className="text-sm text-slate-500">
          View and manage your account information
        </p>
      </div>

      <div className="flex flex-wrap lg:flex-nowrap gap-6 items-start">
        {/* Account Information Card */}
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
                <span className="flex-1 text-sm font-medium text-slate-800">{profile.full_name || "N/A"}</span>
                <button onClick={() => openModal("name")} className="text-rose-500 hover:text-rose-600 p-1">
                  <Edit3 size={18} />
                </button>
              </div>

              <div className="flex items-center py-6 px-2">
                <span className="w-1/3 text-sm font-semibold text-slate-900">Email</span>
                <span className="w-10 text-sm font-bold text-slate-400 text-center">:</span>
                <span className="flex-1 text-sm font-medium text-slate-800">{profile.email}</span>
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

        {/* Changed History Card */}
        <div className="w-full lg:w-5/12 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 text-center tracking-tight mb-6">
            Changed History
          </h3>

          <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
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

      {/* Modals */}
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
    </AdminLayout>
  );
};

export default UserProfilePage;