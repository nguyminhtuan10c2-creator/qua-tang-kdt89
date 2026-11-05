import React, { useState, useEffect } from 'react';
import { Filter, Wallet, RotateCcw, Sliders, ChevronDown, ChevronUp, Check, Sparkles } from 'lucide-react';
import { BUDGET_TIERS, MAX_CATALOG_PRICE } from '../data/products';

export interface BudgetFilterProps {
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  activeCount: number;
  // Optional backwards compatibility
  selectedBudget?: string;
  onSelectBudget?: (budgetId: string) => void;
}

export function formatPriceVND(amount: number): string {
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    return Number.isInteger(millions) ? `${millions} triệu` : `${millions.toFixed(1)} triệu`;
  }
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export function formatExactVND(amount: number): string {
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export const PRESET_PRICE_RANGES = [
  { id: 'all', label: 'Tất cả mức giá', min: 0, max: MAX_CATALOG_PRICE },
  { id: '<1m', label: 'Dưới 1 triệu', min: 0, max: 1000000 },
  { id: '1m-2m', label: '1 – 2 triệu', min: 1000000, max: 2000000 },
  { id: '2m-4m', label: '2 – 4 triệu', min: 2000000, max: 4000000 },
  { id: '4m-7m', label: '4 – 7 triệu', min: 4000000, max: 7000000 },
  { id: '>7m', label: 'Trên 7 triệu', min: 7000000, max: MAX_CATALOG_PRICE },
];

export const BudgetFilter: React.FC<BudgetFilterProps> = ({
  priceRange,
  onPriceRangeChange,
  activeCount,
  selectedBudget,
  onSelectBudget,
}) => {
  const [minVal, maxVal] = priceRange;
  const isCustomRange = minVal > 0 || maxVal < MAX_CATALOG_PRICE;

  // Local state for exact numeric inputs
  const [inputMin, setInputMin] = useState<string>(minVal.toString());
  const [inputMax, setInputMax] = useState<string>(maxVal.toString());
  const [showAdvancedInputs, setShowAdvancedInputs] = useState<boolean>(false);

  useEffect(() => {
    setInputMin(minVal.toString());
    setInputMax(maxVal.toString());
  }, [minVal, maxVal]);

  const handleMinSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), maxVal - 200000);
    onPriceRangeChange([value, maxVal]);
    if (onSelectBudget) onSelectBudget('custom');
  };

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), minVal + 200000);
    onPriceRangeChange([minVal, value]);
    if (onSelectBudget) onSelectBudget('custom');
  };

  const handleApplyPreset = (min: number, max: number, presetId: string) => {
    onPriceRangeChange([min, max]);
    if (onSelectBudget) onSelectBudget(presetId);
  };

  const handleReset = () => {
    onPriceRangeChange([0, MAX_CATALOG_PRICE]);
    if (onSelectBudget) onSelectBudget('all');
  };

  const handleApplyInput = () => {
    let parsedMin = parseInt(inputMin.replace(/[^\d]/g, ''), 10) || 0;
    let parsedMax = parseInt(inputMax.replace(/[^\d]/g, ''), 10) || MAX_CATALOG_PRICE;

    if (parsedMin < 0) parsedMin = 0;
    if (parsedMax > MAX_CATALOG_PRICE) parsedMax = MAX_CATALOG_PRICE;
    if (parsedMin >= parsedMax) {
      parsedMin = Math.max(0, parsedMax - 200000);
    }

    onPriceRangeChange([parsedMin, parsedMax]);
    if (onSelectBudget) onSelectBudget('custom');
  };

  // Calculate percentages for track fill
  const minPercent = Math.min(100, Math.max(0, (minVal / MAX_CATALOG_PRICE) * 100));
  const maxPercent = Math.min(100, Math.max(0, (maxVal / MAX_CATALOG_PRICE) * 100));

  return (
    <div id="budget" className="bg-white rounded-3xl border border-neutral-200/90 p-4 sm:p-6 shadow-sm space-y-4">
      {/* 1. Header Bar: Title, Count & Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200/60 shadow-2xs">
            <Sliders className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-neutral-900 tracking-tight flex items-center gap-2">
              <span>Lọc theo khoảng giá ngân sách</span>
              {isCustomRange && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase">
                  Đang lọc
                </span>
              )}
            </h3>
            <p className="text-xs text-neutral-500">
              Kéo thanh trượt để chọn khoảng giá chính xác theo nhu cầu mua sắm
            </p>
          </div>
        </div>

        {/* Right Info & Reset */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-xs text-neutral-600 font-medium bg-neutral-100 px-3 py-1.5 rounded-xl border border-neutral-200">
            Hiển thị: <strong className="text-rose-600 font-bold">{activeCount} sản phẩm</strong>
          </div>

          {isCustomRange && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-100 px-2.5 py-1.5 rounded-xl border border-neutral-200 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Đặt lại mức giá về toàn bộ kho"
            >
              <RotateCcw className="w-3 h-3 text-neutral-500" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Range Slider */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
        {/* Selected Price Range Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-neutral-500 uppercase">Giá từ:</span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-rose-200 text-rose-700 font-black text-xs sm:text-sm font-mono shadow-2xs">
              {formatExactVND(minVal)}
            </span>
          </div>

          <div className="text-xs font-bold text-neutral-400">→</div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-neutral-500 uppercase">Đến:</span>
            <span className="px-2.5 py-1 rounded-xl bg-white border border-rose-200 text-rose-700 font-black text-xs sm:text-sm font-mono shadow-2xs">
              {maxVal >= MAX_CATALOG_PRICE ? `${formatExactVND(MAX_CATALOG_PRICE)}+` : formatExactVND(maxVal)}
            </span>
          </div>
        </div>

        {/* Dual Thumb Slider Track Container */}
        <div className="relative pt-3 pb-2 px-1">
          {/* Base Background Track */}
          <div className="relative w-full h-2.5 bg-neutral-200 rounded-full">
            {/* Active Highlighted Range Bar */}
            <div
              className="absolute h-2.5 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full shadow-inner"
              style={{
                left: `${minPercent}%`,
                width: `${Math.max(0, maxPercent - minPercent)}%`,
              }}
            />
          </div>

          {/* Min Slider Thumb */}
          <input
            type="range"
            min={0}
            max={MAX_CATALOG_PRICE}
            step={100000}
            value={minVal}
            onChange={handleMinSliderChange}
            aria-label="Giá tối thiểu"
            className="absolute top-2 left-0 w-full h-3 appearance-none bg-transparent pointer-events-none cursor-pointer z-20 
              [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 
              [&::-webkit-slider-thumb]:border-rose-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-110 
              [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-6 
              [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white 
              [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-rose-600 [&::-moz-range-thumb]:shadow-md"
          />

          {/* Max Slider Thumb */}
          <input
            type="range"
            min={0}
            max={MAX_CATALOG_PRICE}
            step={100000}
            value={maxVal}
            onChange={handleMaxSliderChange}
            aria-label="Giá tối đa"
            className="absolute top-2 left-0 w-full h-3 appearance-none bg-transparent pointer-events-none cursor-pointer z-30 
              [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 
              [&::-webkit-slider-thumb]:border-amber-600 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-110 
              [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-6 
              [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white 
              [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-amber-600 [&::-moz-range-thumb]:shadow-md"
          />
        </div>

        {/* Scale Markings */}
        <div className="flex justify-between items-center text-[10px] text-neutral-400 font-semibold px-1 select-none">
          <span>0đ</span>
          <span>2 triệu</span>
          <span>4 triệu</span>
          <span>6 triệu</span>
          <span>8 triệu</span>
          <span>10 triệu</span>
          <span>12tr+</span>
        </div>
      </div>

      {/* 3. Quick Preset Range Buttons */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide flex items-center justify-between">
          <span>Hoặc chọn nhanh theo nấc ngân sách:</span>
          <button
            type="button"
            onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
            className="text-neutral-500 hover:text-neutral-800 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>{showAdvancedInputs ? 'Ẩn ô nhập tay' : 'Nhập số tiền tay'}</span>
            {showAdvancedInputs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {PRESET_PRICE_RANGES.map((preset) => {
            const isActive = minVal === preset.min && maxVal === preset.max;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset.min, preset.max, preset.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-1 active:scale-95 ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-xs ring-1 ring-neutral-900'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                {isActive && <Check className="w-3 h-3 text-rose-400" />}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Collapsible Advanced Direct Numeric Inputs */}
      {showAdvancedInputs && (
        <div className="pt-3 border-t border-neutral-150 flex flex-wrap items-center gap-3 bg-neutral-50/80 p-3 rounded-2xl animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-neutral-600">Từ:</label>
            <div className="relative">
              <input
                type="number"
                step="50000"
                min="0"
                max={MAX_CATALOG_PRICE}
                value={inputMin}
                onChange={(e) => setInputMin(e.target.value)}
                className="w-28 sm:w-32 px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="0"
              />
              <span className="absolute right-2 top-1.5 text-[11px] text-neutral-400">đ</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-neutral-600">Đến:</label>
            <div className="relative">
              <input
                type="number"
                step="50000"
                min="0"
                max={MAX_CATALOG_PRICE}
                value={inputMax}
                onChange={(e) => setInputMax(e.target.value)}
                className="w-28 sm:w-32 px-2.5 py-1.5 text-xs rounded-xl border border-neutral-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder={MAX_CATALOG_PRICE.toString()}
              />
              <span className="absolute right-2 top-1.5 text-[11px] text-neutral-400">đ</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyInput}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-2xs transition-colors"
          >
            Áp dụng giá
          </button>
        </div>
      )}
    </div>
  );
};
