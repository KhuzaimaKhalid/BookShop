import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import authService from "../../services/authService";

const ResetPasswordForm = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Please fill in both fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.resetPassword(
        id,
        token,
        password,
        confirmPassword
      );
      if (data.status === "success") {
        setSuccess("Password reset successfully. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.message || "Unable to reset password");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "This reset link is invalid or has expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-md px-4 py-2">
          {success}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          New Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          autoComplete="new-password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Confirm New Password
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          autoComplete="new-password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white text-sm font-medium py-2.5 rounded-md hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Resetting..." : "Reset password"}
      </button>

      <p className="text-center text-sm text-slate-500">
        <Link to="/login" className="text-slate-900 font-medium hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
};

export default ResetPasswordForm;