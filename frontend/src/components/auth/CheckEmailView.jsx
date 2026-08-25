import { Link } from "react-router-dom";

const CheckEmailView = ({ email }) => {
  return (
    <div className="w-full bg-[#070C12] border border-white/80 rounded-[25px] p-8 lg:p-12 shadow-2xl text-white">
      
      {/* Title with highlighted red word */}
      <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-center mb-6">
        Check Your <span className="text-[#CD051F]">Email</span>
      </h2>

      {/* Paragraph text matching Figma */}
      <div className="space-y-4 text-xs lg:text-sm text-slate-300 leading-relaxed text-center max-w-[360px] mx-auto mb-8 font-light">
        <p>
          We have sent a password reset link to{" "}
          <span className="font-semibold text-white">{email || "your email address"}</span>.
        </p>
        <p>
          Please check your inbox and follow the instruction to reset your password.
        </p>
      </div>

      {/* Outline Button */}
      <Link
        to="/login"
        className="w-full flex items-center justify-center py-3.5 px-4 border border-white rounded-xl text-white font-medium text-xs lg:text-sm hover:bg-white/10 transition text-center"
      >
        Back to Login
      </Link>
    </div>
  );
};

export default CheckEmailView;