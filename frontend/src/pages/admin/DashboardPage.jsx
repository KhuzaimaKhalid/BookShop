import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ShoppingCart, Package, PackageX } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";
import StatCard from "../../components/dashboard/StatCard";
import SalesOverviewCard from "../../components/dashboard/SalesOverviewCard";
import TopSellingProducts from "../../components/dashboard/TopSellingProducts";
import RecentSalesCard from "../../components/dashboard/RecentSalesCard";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({
    totalSales: 0,
    salesTrend: "",
    totalOrders: 0,
    ordersTrend: "",
    totalProducts: 0,
    lowStockItems: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        const response = await api.get("/report/dashboard");
        const data = response.data || {};

        setSummary({
          totalSales: data.total_sales || 0,
          salesTrend: data.salesTrend || "",
          totalOrders: data.total_orders || 0,
          ordersTrend: data.ordersTrend || "",
          totalProducts: data.total_products || 0,
          lowStockItems: data.low_stock_items || 0,
        });
      } catch (error) {
        console.error("Error loading dashboard metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardSummary();
}, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">
        Welcome Back, Admin!
      </h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <StatCard
          icon={TrendingUp}
          iconBg="#FEE2E2"
          iconColor="#DC2626"
          label="Total Sales"
          value={loading ? "..." : `Rs ${Number(summary.totalSales).toLocaleString()}`}
          trend={summary.salesTrend}
          trendColor="#16A34A"
        />
        <StatCard
          icon={ShoppingCart}
          iconBg="#FFEDD5"
          iconColor="#EA580C"
          label="Total Orders"
          value={loading ? "..." : summary.totalOrders}
          trend={summary.ordersTrend}
          trendColor="#DC2626"
        />
        <StatCard
          icon={Package}
          iconBg="#FEF3C7"
          iconColor="#D97706"
          label="Total Products"
          value={loading ? "..." : summary.totalProducts}
          link="View Products"
          onLinkClick={() => navigate("/admin/products")}
        />
        <StatCard
          icon={PackageX}
          iconBg="#FFEDD5"
          iconColor="#C2410C"
          label="Low Stock Items"
          value={loading ? "..." : summary.lowStockItems}
          link="View items"
          onLinkClick={() => navigate("/admin/reports/stock")}
        />
      </div>

      <div className="flex flex-wrap gap-6 items-stretch">
        <div className="flex-1 min-w-[420px] bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <SalesOverviewCard />
          <TopSellingProducts onViewReport={() => navigate("/admin/reports/products")} />
        </div>

        <RecentSalesCard onViewAll={() => navigate("/admin/sales/history")} />
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;