import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AuthLayout from "../components/common/AuthLayout";
import LoginForm from "../components/auth/LoginForm";
import logo from "../assets/logo.png";

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <AuthLayout showCar={false} showLogo={false}>
      {/* Top Left Navigation Button */}
      <div className="absolute top-6 left-6 z-30">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-black/60 text-white font-semibold text-sm rounded-lg backdrop-blur-md border border-white/20 shadow-md transition cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>Back to POS</span>
        </button>
      </div>

      <div className="w-full h-full max-w-[1300px] mx-auto px-6 lg:px-12 flex items-start justify-between relative z-20 pt-20">

        {/* Left Side: Scaled Logo & Brand Graphic */}
        <div className="hidden md:flex flex-col items-start gap-10">
          {/* Logo Group */}
          <div className="flex items-start gap-4">
            <img
              src={logo}
              alt="ATR Logo"
              className="w-28 lg:w-36 xl:w-40 h-auto object-contain shrink-0"
            />
            <div className="flex flex-col justify-start items-start text-left leading-none">
              <span className="text-[#CD051F] font-black text-4xl lg:text-5xl uppercase tracking-tight mb-1">
                Learning
              </span>
              <span className="text-white font-extrabold text-3xl lg:text-4xl uppercase tracking-wider whitespace-nowrap">
                Corner
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Dark Form Card Container */}
        <div className="w-full md:w-[460px] lg:w-[480px] shrink-0">
          <LoginForm />
        </div>

      </div>
    </AuthLayout>
  );
};

export default LoginPage;