import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // or wherever your useAuth hook lives

const RoleBasedRedirect = () => {
  const { user } = useAuth(); // Assuming 'user' contains { role: 'admin' | 'user' }

  // Fallback to localStorage if auth state hasn't loaded yet or is structured differently
  const storedUser = user || JSON.parse(localStorage.getItem("user") || "{}");
  const role = storedUser?.role;

  if (role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Regular user / cashier default home is POS
  return <Navigate to="/pos" replace />;
};

export default RoleBasedRedirect;