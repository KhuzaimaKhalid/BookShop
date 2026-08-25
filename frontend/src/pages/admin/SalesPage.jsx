import { useEffect, useState } from "react";
import { TrendingUp, ShoppingCart } from "lucide-react";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const toDateStr = (date) => date.toISOString().split("T")[0];

const getRanges = () => {
  const today = new Date();
  const todayStr = toDateStr(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toDateStr(yesterday);

  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    today: { from: todayStr, to: todayStr },
    yesterday: { from: yesterdayStr, to: yesterdayStr },
    week: { from: toDateStr(startOfWeek), to: todayStr },
    month: { from: toDateStr(startOfMonth), to: todayStr },
  };
};

const PERIOD_CONFIG = [
  {
    key: "today",
    label: "Today",
    labelColor: "text-[#CD051F]",
    iconBg: "bg-[#FEE2E2]",
    iconColor: "#DC2626",
  },
  {
    key: "yesterday",
    label: "Yesterday",
    labelColor: "text-[#EA580C]",
    iconBg: "bg-[#FFEDD5]",
    iconColor: "#EA580C",
  },
  {
    key: "week",
    label: "This Week",
    labelColor: "text-[#166534]",
    iconBg: "bg-[#DCFCE7]",
    iconColor: "#16A34A",
  },
  {
    key: "month",
    label: "This Month",
    labelColor: "text-[#3730A3]",
    iconBg: "bg-[#E0E7FF]",
    iconColor: "#4338CA",
  },
];

const SalesPage = () => {
  const [data, setData] = useState({
    today: null,
    yesterday: null,
    week: null,
    month: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllPeriods = async () => {
      try {
        setLoading(true);
        const ranges = getRanges();

        const [todayRes, yesterdayRes, weekRes, monthRes] = await Promise.all([
          api.get("/report/sales", { params: ranges.today }),
          api.get("/report/sales", { params: ranges.yesterday }),
          api.get("/report/sales", { params: ranges.week }),
          api.get("/report/sales", { params: ranges.month }),
        ]);

        setData({
          today: todayRes.data,
          yesterday: yesterdayRes.data,
          week: weekRes.data,
          month: monthRes.data,
        });
      } catch (error) {
        console.error("Error fetching sales overview:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPeriods();
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">
        Sales Overview
      </h1>

      <div className="flex flex-col gap-6">
        {PERIOD_CONFIG.map(({ key, label, labelColor, iconBg, iconColor }) => {
          const periodData = data[key];
          const totalSales = periodData?.total_sales || 0;
          const totalInvoices = periodData?.total_orders || 0;

          return (
            <div
              key={key}
              className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm flex flex-wrap items-center gap-6"
            >
              <h2 className={`text-3xl font-extrabold ${labelColor} w-full sm:w-[180px] shrink-0`}>
                {label}
              </h2>

              <div className="flex-1 min-w-[240px] border border-slate-200 rounded-xl px-6 py-4 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                  <TrendingUp size={28} color={iconColor} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Sales
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {loading ? "..." : `Rs ${Number(totalSales).toLocaleString()}`}
                  </p>
                </div>
              </div>

              <div className="flex-1 min-w-[240px] border border-slate-200 rounded-xl px-6 py-4 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                  <ShoppingCart size={28} color={iconColor} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Invoices
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900">
                    {loading ? "..." : totalInvoices}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default SalesPage;