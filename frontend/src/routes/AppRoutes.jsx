import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import RoleBasedRedirect from "./RoleBasedRedirect"; // Re-added redirect handler
import { CartProvider } from "../context/CartContext";

import AdminPage from "../pages/admin/DashboardPage";
import ManageInventoryPage from "../pages/admin/ManageInventoryPage";
import AddProductPage from "../pages/admin/AddProductPage";
import EditProductPage from "../pages/admin/EditProductPage";
import SalesPage from "../pages/admin/SalesPage";
import SalesHistoryPage from "../pages/admin/SalesHistoryPage";
import ReturnsPage from "../pages/admin/ReturnsPage";
import ReportsPage from "../pages/admin/ReportsPage";
import SalesReportPage from "../pages/admin/SalesReportPage";
import ProductReportPage from "../pages/admin/ProductReportPage";
import ProfitReportPage from "../pages/admin/ProfitReportPage";
import StockReportPage from "../pages/admin/StockReportPage";
import UserProfilePage from "../pages/admin/UserProfilePage";
import POSPage from "../pages/pos/POSPage";
import SignupPage from "../pages/SignupPage";
import CoursePage from "../pages/pos/CoursePage";
import ExpensePage from "../pages/pos/ExpensePage";
import POSReturnsPage from "../pages/pos/ReturnsPage";
import AdminExpenses from "../pages/admin/AdminExpenses";
import ExpenseReportPage from "../pages/admin/ExpenseReportPage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Root Landing Page -> Serves POSPage */}
      <Route
        path="/"
        element={
          <CartProvider>
            <POSPage />
          </CartProvider>
        }
      />

      {/* Role Evaluation Handler for Post-Login Redirects */}
      <Route path="/dashboard" element={<RoleBasedRedirect />} />

      {/* POS & POS-related routes with Shared Cart Context */}
      <Route
        element={
          <CartProvider>
            <Outlet />
          </CartProvider>
        }
      >
        <Route path="/pos" element={<POSPage />} />
        <Route path="/pos/returns" element={<POSReturnsPage />} />
        <Route path="/courses" element={<CoursePage />} />
      </Route>

      {/* Standalone User Routes */}
      <Route path="/expenses" element={<ExpensePage />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminPage />} />
      <Route path="/admin/products" element={<ManageInventoryPage />} />
      <Route path="/admin/products/add" element={<AddProductPage />} />
      <Route path="/admin/products/edit/:id" element={<EditProductPage />} />
      <Route path="/admin/sales" element={<SalesPage />} />
      <Route path="/admin/sales/history" element={<SalesHistoryPage />} />
      <Route path="/admin/sales/returns" element={<ReturnsPage />} />
      <Route path="/admin/reports" element={<ReportsPage />} />
      <Route path="/admin/reports/sales" element={<SalesReportPage />} />
      <Route path="/admin/reports/products" element={<ProductReportPage />} />
      <Route path="/admin/reports/profit" element={<ProfitReportPage />} />
      <Route path="/admin/reports/stock" element={<StockReportPage />} />
      <Route path="/admin/expenses" element={<AdminExpenses />} />
      <Route path="/admin/reports/expense" element={<ExpenseReportPage />} />
      <Route path="/admin/user" element={<UserProfilePage />} />

      {/* Auth Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:id/:token" element={<ResetPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* Fallback to root POS landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;