import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../services/authService";

const SignupForm = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // Step 1: Form, Step 2: Code Verification
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmitSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!fullName || !email || !password) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.register(fullName, email, password);
      if (data?.status === "success") {
        setStep(2); // Proceed to verification step
      } else {
        setError(data?.message || "Registration failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification email failed to send. Check your email address.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");

    if (!otp) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.verifyEmail(email, otp);
      if (data?.status === "success") {
        navigate("/login");
      } else {
        setError(data?.message || "Verification failed");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[460px] max-w-full bg-slate-50/95 backdrop-blur-md rounded-[32px] p-10 md:p-12 shadow-2xl border border-white/20 flex flex-col justify-center min-h-[580px]">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900">
          {step === 1 ? <>Create <span className="text-red-600">Account</span></> : <>Verify <span className="text-red-600">Email</span></>}
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          {step === 1 
            ? "Sign up to get started with ATR Automotive." 
            : `Enter the 6-digit verification code sent to ${email}`}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 text-xs text-red-600 bg-red-100 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleSubmitSignup} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-800 mb-1.5 block">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-800 mb-1.5 block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@gmail.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-800 mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm focus:ring-2 focus:ring-red-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white text-sm font-semibold py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-60"
          >
            {loading ? "Sending Code..." : "Send Verification Code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-800 mb-1.5 block">6-Digit Code</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full text-center tracking-widest font-bold text-2xl rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-red-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white text-sm font-semibold py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify & Complete Registration"}
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full text-xs text-slate-500 hover:text-slate-800 mt-2 text-center block"
          >
            ← Change email address
          </button>
        </form>
      )}

      <div className="text-center pt-4">
        <p className="text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-red-600 hover:text-red-700">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;