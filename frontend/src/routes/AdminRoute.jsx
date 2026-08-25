import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = () => {
  const { user } = useAuth();
  const storedUser = user || JSON.parse(localStorage.getItem("user") || "{}");

  if (storedUser?.role !== "admin") {
    // Non-admin user trying to access admin route -> push to POS
    return <Navigate to="/pos" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;