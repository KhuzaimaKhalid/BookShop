import { Plus, ArrowLeft, ArrowRight } from "lucide-react";

const VISIBLE_COUNT = 3;

const CustomerTabs = ({
  customers,
  activeIndex,
  onSelectTab,
  onAddCustomer,
  scrollStart,
  onScrollPrev,
  onScrollNext,
}) => {
  const visibleCustomers = customers.slice(scrollStart, scrollStart + VISIBLE_COUNT);
  const canScrollPrev = scrollStart > 0;
  const canScrollNext = scrollStart + VISIBLE_COUNT < customers.length;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {visibleCustomers.map((customer, idx) => {
        const realIndex = scrollStart + idx;
        const isActive = realIndex === activeIndex;
        return (
          <button
            key={customer.id}
            onClick={() => onSelectTab(realIndex)}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition ${
              isActive
                ? "bg-[#CD051F] text-white shadow-sm"
                : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"
            }`}
          >
            {customer.name}
          </button>
        );
      })}

      <button
        onClick={onAddCustomer}
        className="flex items-center gap-2 bg-[#151B26] hover:bg-[#20293b] text-white text-sm font-bold px-5 py-2.5 rounded-lg transition"
      >
        ADD
        <Plus size={16} strokeWidth={3} />
      </button>

      <button
        onClick={onScrollPrev}
        disabled={!canScrollPrev}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#151B26] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#20293b] transition"
      >
        <ArrowLeft size={16} />
      </button>
      <button
        onClick={onScrollNext}
        disabled={!canScrollNext}
        className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#CD051F] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-700 transition"
      >
        <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default CustomerTabs;