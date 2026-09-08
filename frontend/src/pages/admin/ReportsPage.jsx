import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import api from "../../services/api";
import AdminLayout from "../../components/layout/AdminLayout";

const COLOR_PALETTE = [
  "#1A0966", "#F97316", "#E11D48", "#EAB308", "#0EA5E9", "#16A34A", "#9333EA"
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("This Week");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [salesTotal, setSalesTotal] = useState(0);
  const [pageSales, setPageSales] = useState([]);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [expensesList, setExpensesList] = useState([]);
  const [profitTotal, setProfitTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportsData();
  }, [timeRange, fromDate, toDate]);

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      let params = {};
      if (fromDate && toDate) {
        params = { from: fromDate, to: toDate };
      }

      const [salesRes, pageSalesRes, expenseRes, profitRes] = await Promise.all([
        api.get("/report/sales", { params }),
        api.get("/report/category-sales", { params }),
        api.get("/expenses"),
        api.get("/report/profit", { params })
      ]);

      setSalesTotal(salesRes.data.total_sales || 0);
      setPageSales(pageSalesRes.data || []);
      setExpenseTotal(expenseRes.data.total_expense || 0);
      setExpensesList(expenseRes.data.expenses || []);
      setProfitTotal(profitRes.data.total_profit || 0);

    } catch (error) {
      console.error("Error loading report data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format Page Sales Amount for Sales Pie Chart
  const formattedSalesData = pageSales.map((item) => ({
    name: item.name,
    value: Number(item.total_sales_amount) || 0,
  }));

  // Format Page Profit Amount for Profit Pie Chart
  const formattedProfitData = pageSales.map((item) => ({
    name: item.name,
    value: Number(item.total_profit_amount) || 0,
  }));

  // Format Expenses List for Expense Pie Chart
  const formattedExpenseData = expensesList.map((item) => ({
    name: item.name,
    value: Number(item.amount) || 0,
  }));

  return (
    <AdminLayout>
      <div className="p-2">
        {/* Header Filters */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Summary</h1>
          
          <div className="flex items-center gap-3">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium shadow-sm outline-none"
            >
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>

            <div className="flex items-center gap-2 bg-gray-200 p-1.5 rounded-md border border-gray-300 text-sm">
              <span className="font-medium text-gray-700 px-1">Custom</span>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border rounded px-2 py-1 text-xs outline-none" 
              />
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white border rounded px-2 py-1 text-xs outline-none" 
              />
            </div>
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Sales Summary Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Sales Summary</h2>
            <p className="text-2xl font-bold text-[#CD051F] mb-4">
              {loading ? "..." : `Rs. ${salesTotal.toLocaleString()}`}
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(val) => `Rs. ${val.toLocaleString()}`} />
                  <Pie
                    data={formattedSalesData.length > 0 ? formattedSalesData : [{ name: 'No Sales', value: 1 }]}
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                  >
                    {formattedSalesData.length > 0 ? (
                      formattedSalesData.map((entry, idx) => (
                        <Cell key={idx} fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]} />
                      ))
                    ) : (
                      <Cell fill="#CBD5E1" />
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-1 text-left text-sm font-semibold max-h-36 overflow-y-auto pr-1">
              {pageSales.length > 0 ? (
                pageSales.map((item, idx) => (
                  <div key={item.id || idx} className="flex justify-between" style={{ color: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}>
                    <span>{item.name}</span>
                    <span>Rs. {Number(item.total_sales_amount).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center font-normal">No Sales Data</p>
              )}
            </div>
          </div>

          {/* 2. Expense Summary Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Expense Summary</h2>
            <p className="text-2xl font-bold text-[#CD051F] mb-4">
              {loading ? "..." : `Rs. ${expenseTotal.toLocaleString()}`}
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(val) => `Rs. ${val.toLocaleString()}`} />
                  <Pie
                    data={formattedExpenseData.length > 0 ? formattedExpenseData : [{ name: 'No Expenses', value: 1 }]}
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                  >
                    {formattedExpenseData.length > 0 ? (
                      formattedExpenseData.map((entry, idx) => (
                        <Cell key={idx} fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]} />
                      ))
                    ) : (
                      <Cell fill="#CBD5E1" />
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-1 text-left text-sm font-semibold max-h-36 overflow-y-auto pr-1">
              {expensesList.length > 0 ? (
                expensesList.map((exp, idx) => (
                  <div key={exp.id || idx} className="flex justify-between" style={{ color: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}>
                    <span>{exp.name}</span>
                    <span>Rs. {Number(exp.amount).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center font-normal">No Expenses Found</p>
              )}
            </div>
          </div>

          {/* 3. Profit Summary Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Profit Summary</h2>
            <p className="text-2xl font-bold text-[#CD051F] mb-4">
              {loading ? "..." : `Rs. ${profitTotal.toLocaleString()}`}
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(val) => `Rs. ${val.toLocaleString()}`} />
                  <Pie
                    data={formattedProfitData.length > 0 ? formattedProfitData : [{ name: 'No Data', value: 1 }]}
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                  >
                    {formattedProfitData.length > 0 ? (
                      formattedProfitData.map((entry, idx) => (
                        <Cell key={idx} fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]} />
                      ))
                    ) : (
                      <Cell fill="#CBD5E1" />
                    )}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 space-y-1 text-left text-sm font-semibold max-h-36 overflow-y-auto pr-1">
              {pageSales.length > 0 ? (
                pageSales.map((item, idx) => (
                  <div key={item.id || idx} className="flex justify-between" style={{ color: COLOR_PALETTE[idx % COLOR_PALETTE.length] }}>
                    <span>{item.name}</span>
                    <span>Rs. {Number(item.total_profit_amount).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center font-normal">No Page Data</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}