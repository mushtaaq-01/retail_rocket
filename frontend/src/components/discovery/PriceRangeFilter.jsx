import React from 'react';
import { IndianRupee } from 'lucide-react';

export default function PriceRangeFilter({ 
  minPrice, 
  maxPrice, 
  currentMax, 
  onMaxPriceChange, 
  theme 
}) {
  const isLight = theme === 'light';

  const quickRanges = [
    { label: 'All Prices', max: maxPrice },
    { label: 'Budget (< ₹5,000)', max: 5000 },
    { label: 'Mid-Range (< ₹15,000)', max: 15000 },
    { label: 'Upper-Mid (< ₹40,000)', max: 40000 },
    { label: 'Premium (< ₹1,00,000)', max: 100000 },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isLight ? 'text-slate-700' : 'text-slate-300'
        }`}>
          <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> Max Price
        </label>
        <span className="font-mono text-xs font-bold text-emerald-500">
          Up to ₹{Number(currentMax).toLocaleString('en-IN')}
        </span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={minPrice}
        max={maxPrice}
        step={500}
        value={currentMax}
        onChange={(e) => onMaxPriceChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
      />

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-1 pt-1">
        {quickRanges.map((range, idx) => (
          <button
            key={idx}
            onClick={() => onMaxPriceChange(range.max)}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
              currentMax === range.max
                ? 'bg-purple-600 text-white shadow-sm'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                : 'bg-[#0a1630] hover:bg-purple-950/30 text-slate-400'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
}
