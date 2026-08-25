import { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../../services/authService";

const ForgotPasswordForm = ({ onEmailSent }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.forgotPassword(email);
      if (data.status === "success") {
        setIsSubmitted(true);
        if (onEmailSent) onEmailSent();
      } else {
        setError(data.message || "Something went wrong");
      }
    } catch (err) {
      setIsSubmitted(true);
      if (onEmailSent) onEmailSent();
    } finally {
      setLoading(false);
    }
  };

  // IF SUBMITTED: Render ONLY the Check Your Email card
  if (isSubmitted) {
    return (
      <div className="w-full bg-[#070C12] border border-white/80 rounded-[25px] p-8 lg:p-10 shadow-2xl text-white">
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-center mb-6 text-white font-['Work_Sans']">
          Check Your <span className="text-[#CD051F]">Email</span>
        </h2>

        <div className="space-y-4 text-xs lg:text-sm text-slate-200 leading-relaxed text-center max-w-[360px] mx-auto mb-8 font-['Work_Sans']">
          <p>
            We have sent a password reset link to{" "}
            <span className="font-bold text-white">{email || "your email address"}</span>.
          </p>
          <p>
            Please check your inbox and follow the instruction to reset your password.
          </p>
        </div>

        <Link
          to="/login"
          className="w-full flex items-center justify-center py-3.5 px-4 border border-white rounded-xl text-white font-semibold text-xs lg:text-sm hover:bg-white/10 transition text-center font-['Work_Sans']"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  // DEFAULT: Render ONLY the Form card
  return (
    <div className="w-full bg-[#070C12]/90 backdrop-blur-md rounded-[24px] p-8 lg:p-10 border border-white/10 shadow-2xl text-white">
      <div className="mb-6 text-center flex flex-col items-center justify-center">
        <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-center text-white">
          Forgot <span className="text-[#CD051F]">Password</span>
        </h2>
        <p className="text-xs lg:text-sm text-slate-300 mt-2.5 leading-relaxed text-center max-w-[340px]">
          Enter your registered email address and we will send you a reset link.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-4 py-2.5 mb-5 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="flex items-center gap-2 text-xs lg:text-sm font-semibold text-white mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full rounded-xl bg-white text-slate-900 placeholder-slate-400 px-4 py-3 text-xs lg:text-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-[#CD051F] font-medium"
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#CD051F] hover:bg-red-700 text-white text-xs lg:text-sm font-bold py-3.5 rounded-xl transition shadow-lg shadow-red-600/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send Reset Link"}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>

        <div className="pt-2 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs lg:text-sm font-semibold text-white hover:text-red-500 transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;