import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import api from "../../services/api";

const TopSellingProducts = ({ onViewReport }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        const response = await api.get("/report/top-products");
        const data = Array.isArray(response.data) ? response.data : [];
        setProducts(data);
      } catch (error) {
        console.error("Error fetching top selling products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
}, []);

const maxQty = products.length > 0 ? Math.max(...products.map((p) => p.total_sold || 1)) : 1;
  return (
    <div className="pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-slate-900">
          Top Selling Products
        </h3>
        <button
          onClick={onViewReport}
          className="text-xs font-bold text-[#CD051F] hover:underline"
        >
          View Report
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="text-xs text-slate-400">Loading top products...</p>
        ) : products.length === 0 ? (
          <p className="text-xs text-slate-400">No products sold yet.</p>
        ) : (
          products.map((item, index) => {
            const name = item.name || `Product #${index + 1}`;
            const qty = item.total_sold || 0;

            return (
              <div key={name + index} className="flex items-center gap-3">
                <div className="p-2 bg-slate-50 rounded-lg shrink-0">
                  <Package size={20} color="#CD051F" strokeWidth={2} />
                </div>
                <span className="w-32 shrink-0 text-xs font-semibold text-slate-800 truncate">
                  {name}
                </span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#CD051F] rounded-full transition-all duration-500"
                    style={{ width: `${(qty / maxQty) * 100}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right text-xs font-bold text-slate-900 leading-tight">
                  {qty} <span className="text-[10px] font-normal text-slate-500 block">QTY Sold</span>
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TopSellingProducts;