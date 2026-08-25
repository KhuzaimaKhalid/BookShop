import AuthLayout from "../components/common/AuthLayout";
import LoginForm from "../components/auth/LoginForm";
import logo from "../assets/logo.png";

const LoginPage = () => {
  return (
    <AuthLayout showCar={false} showLogo={false}>
      {/* Changed items-center to items-start below */}
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