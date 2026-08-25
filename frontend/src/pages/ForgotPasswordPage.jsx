import { useState } from "react";
import AuthLayout from "../components/common/AuthLayout";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import logo from "../assets/logo.png";
import lockImg from "../assets/lock-illustration.png";
import messageCheckImg from "../assets/messageCheck.png";

const ForgotPasswordPage = () => {
  const [emailSent, setEmailSent] = useState(false);

  return (
    <AuthLayout showCar={false} showLogo={false}>
      <div className="w-full h-full max-w-[1300px] mx-auto px-6 lg:px-12 flex items-center justify-between relative z-20">
        
        {/* Left Side Graphic */}
        <div className="hidden md:flex flex-col items-start gap-8">
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="ATR Logo"
              className="w-28 lg:w-36 xl:w-40 h-auto object-contain shrink-0"
            />
            
            <div className="flex flex-col justify-center text-left leading-none">
              <span className="text-[#CD051F] font-black text-4xl lg:text-5xl uppercase tracking-tight mb-1">
                ATR
              </span>
              <span className="text-white font-extrabold text-3xl lg:text-4xl uppercase tracking-wider whitespace-nowrap">
                AUTOMOTIVE
              </span>
            </div>
          </div>

          <div className="pl-1">
            <img
              src={emailSent ? messageCheckImg : lockImg}
              alt="Graphic"
              className="w-[300px] lg:w-[380px] h-auto object-contain pointer-events-none drop-shadow-2xl transition-all duration-300"
            />
          </div>
        </div>

        {/* Right Side: Renders ForgotPasswordForm OR CheckEmail inline */}
        <div className="w-full md:w-[460px] lg:w-[480px] shrink-0">
          <ForgotPasswordForm onEmailSent={() => setEmailSent(true)} />
        </div>

      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;