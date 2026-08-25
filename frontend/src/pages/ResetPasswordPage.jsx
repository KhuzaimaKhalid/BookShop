import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import authService from "../services/authService";

// Import your actual assets from src/assets/
import garageBg from "../assets/login-bg.png";
import logo from "../assets/logo.png";
import book from "../assets/car.png";

const ResetPasswordPage = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // FIX: Changed 'confirmPassword' to 'confirm_password' to match backend expected field name
      await authService.resetPassword({ id, token, password, confirm_password: confirmPassword });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* FIXED INSET-0 forces true full screen over any parent margins */
    <div className="fixed inset-0 w-screen h-screen bg-[#05070B] flex items-center justify-center overflow-hidden z-50">
      
      {/* 1. Full Screen Garage Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={garageBg}
          alt="Garage Background"
          className="w-full h-full object-cover object-center brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/80" />
      </div>

      {/* 2. Main Content Container */}
      <div className="relative z-10 w-full max-w-[1280px] h-full flex items-center justify-between px-8 lg:px-16 pointer-events-none">
        
        {/* Left Side: Logo & Car */}
        <div className="relative h-full flex-1 flex flex-col justify-between py-12 pr-8 pointer-events-auto">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ATR Logo" className="w-10 h-auto object-contain" />
            <div className="flex flex-col text-left leading-none">
              <span className="text-[#E10600] font-black text-2xl uppercase tracking-wider">
                ATR
              </span>
              <span className="text-white font-extrabold text-lg uppercase tracking-widest">
                AUTOMOTIVE
              </span>
            </div>
          </div>

          <div className="absolute bottom-10 left-0 w-full max-w-[550px]">
            <img
              src={book}
              alt="ATR Car"
              className="w-full h-auto object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
            />
          </div>
        </div>

        {/* Right Side: Floating Dark Form Card */}
        <div className="w-full max-w-[440px] bg-[#070A10]/95 backdrop-blur-md rounded-[28px] border border-white/10 p-8 lg:p-10 shadow-2xl pointer-events-auto">
          
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-1.5 tracking-tight">
            Reset New <span className="text-[#E10600]">Password</span>
          </h1>
          <p className="text-xs text-gray-400 mb-8 font-normal">
            Enter your new password below.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-4 py-2.5 mb-5">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-xl px-4 py-2.5 mb-5">
              Password reset successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* New Password */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full rounded-xl bg-[#030509] text-white placeholder-gray-500 px-4 py-3 text-xs border border-white/15 focus:outline-none focus:border-[#E10600] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full rounded-xl bg-[#030509] text-white placeholder-gray-500 px-4 py-3 text-xs border border-white/15 focus:outline-none focus:border-[#E10600] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showConfirmPassword ? (
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    ) : (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Reset Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#E10600] hover:bg-red-700 text-white text-xs font-bold py-3.5 rounded-xl transition shadow-lg shadow-red-600/30 mt-2 disabled:opacity-50"
            >
              <span>{loading ? "Resetting..." : "Reset Password"}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>

            {/* Back to Login */}
            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-medium text-white hover:text-[#E10600] transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to login
              </Link>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};

export default ResetPasswordPage;