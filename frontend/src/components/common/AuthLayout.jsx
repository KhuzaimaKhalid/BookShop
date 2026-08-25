import loginBg from "../../assets/login-bg.png";
import car from "../../assets/car.png";
import logo from "../../assets/logo.png";

const AuthLayout = ({ children, showCar = true, showLogo = true }) => {
  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-cover bg-center bg-no-repeat flex items-center select-none"
      style={{
        backgroundImage: `url(${loginBg})`,
      }}
    >
      {/* Top Left Header Logo - Only shows when showLogo is true */}
      {showLogo && (
        <div className="absolute top-8 left-8 md:top-10 md:left-12 z-30 flex items-center gap-3">
          <img
            src={logo}
            alt="ATR Automotive Logo"
            className="h-10 md:h-12 w-auto object-contain"
          />
          <div className="text-white font-bold leading-tight uppercase tracking-wider text-sm md:text-base">
            <span className="text-red-600 block">Learning</span>
            <span>Corner</span>
          </div>
        </div>
      )}

      {/* Car Image - Only shows when showCar is true */}
      {showCar && (
        <img
          src={car}
          alt="ATR Automotive Car"
          className="absolute -left-12 md:-left-20 bottom-4 md:bottom-8 w-[68%] max-w-[900px] min-w-[500px] object-contain pointer-events-none z-10 -scale-x-100"
        />
      )}

      {/* Main Content Area */}
      <div className="w-full h-full relative z-20 flex items-center justify-between">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;