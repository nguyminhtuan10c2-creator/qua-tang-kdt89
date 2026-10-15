import React from 'react';
import { BUDGET_TIERS } from '../data/products';
import { Filter, Wallet } from 'lucide-react';

interface BudgetFilterProps {
  selectedBudget: string;
  onSelectBudget: (budgetId: string) => void;
  activeCount: number;
}

export const BudgetFilter: React.FC<BudgetFilterProps> = ({
  selectedBudget,
  onSelectBudget,
  activeCount,
}) => {
  return (
    <div id="budget" className="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-neutral-900 tracking-tight">
              Chọn quà theo mức ngân sách
            </h3>
            <p className="text-xs text-neutral-500">
              Tìm nhanh món quà 20/10 phù hợp với túi tiền của anh
            </p>
          </div>
        </div>

        <div className="text-xs text-neutral-500 self-start sm:self-auto font-medium">
          Hiển thị: <span className="font-semibold text-rose-600">{activeCount} sản phẩm</span>
        </div>
      </div>

      {/* Interactive Segmented Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1">
        {BUDGET_TIERS.map((tier) => {
          const isActive = selectedBudget === tier.id;
          return (
            <button
              key={tier.id}
              onClick={() => onSelectBudget(tier.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 active:scale-[0.98] ${
                isActive
                  ? 'bg-neutral-900 text-white shadow-sm ring-1 ring-neutral-900'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              {tier.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
