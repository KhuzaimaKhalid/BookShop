import { useNavigate } from "react-router-dom";
import { TrendingUp, BarChart3, PieChart, LineChart } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";

const REPORT_CARDS = [
  {
    key: "sales",
    label: "Sales Report",
    path: "/admin/reports/sales",
    icon: TrendingUp,
    iconBg: "bg-[#FEE2E2]",
    iconColor: "#DC2626",
    buttonBg: "bg-[#FEE2E2] hover:bg-[#FCA5A5]",
    buttonText: "text-[#DC2626]",
  },
  {
    key: "products",
    label: "Product Report",
    path: "/admin/reports/products",
    icon: BarChart3,
    iconBg: "bg-[#DBEAFE]",
    iconColor: "#2563EB",
    buttonBg: "bg-[#DBEAFE] hover:bg-[#93C5FD]",
    buttonText: "text-[#2563EB]",
  },
  {
    key: "stock",
    label: "Stock Report",
    path: "/admin/reports/stock",
    icon: PieChart,
    iconBg: "bg-[#DCFCE7]",
    iconColor: "#16A34A",
    buttonBg: "bg-[#DCFCE7] hover:bg-[#86EFAC]",
    buttonText: "text-[#16A34A]",
  },
  {
    key: "profit",
    label: "Profit Report",
    path: "/admin/reports/profit",
    icon: LineChart,
    iconBg: "bg-[#EDE9FE]",
    iconColor: "#7C3AED",
    buttonBg: "bg-[#EDE9FE] hover:bg-[#C4B5FD]",
    buttonText: "text-[#7C3AED]",
  },
];

const ReportsPage = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
        REPORTS OVERVIEW
      </h1>
      <p className="text-sm text-slate-500 mb-8">
        Select a report to view details and analytics
      </p>

      <div className="flex flex-wrap gap-6">
        {REPORT_CARDS.map(
          ({ key, label, path, icon: Icon, iconBg, iconColor, buttonBg, buttonText }) => (
            <div
              key={key}
              className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-col items-center text-center w-full max-w-[270px]"
            >
              <div
                className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-6 ${iconBg}`}
              >
                <Icon size={44} color={iconColor} strokeWidth={2} />
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 mb-6">
                {label}
              </h3>

              <button
                onClick={() => navigate(path)}
                className={`w-full py-3 rounded-lg text-sm font-bold transition ${buttonBg} ${buttonText}`}
              >
                View Report
              </button>
            </div>
          )
        )}
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;