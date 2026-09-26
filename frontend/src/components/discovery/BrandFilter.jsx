import React from 'react';
import { Tag } from 'lucide-react';

export default function BrandFilter({ brands, selectedBrand, onSelectBrand, theme }) {
  const isLight = theme === 'light';

  return (
    <div className="space-y-2">
      <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
        isLight ? 'text-slate-700' : 'text-slate-300'
      }`}>
        <Tag className="w-3.5 h-3.5 text-cyan-600" /> Brands
      </label>

      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
        <button
          onClick={() => onSelectBrand('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedBrand === 'all'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-600/30'
              : isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              : 'bg-[#0a1630] hover:bg-purple-950/40 text-slate-300 border border-purple-500/20'
          }`}
        >
          All Brands
        </button>

        {brands.map((brand) => {
          const isSelected = selectedBrand === brand;
          return (
            <button
              key={brand}
              onClick={() => onSelectBrand(brand)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-600/30'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  : 'bg-[#0a1630] hover:bg-purple-950/40 text-slate-300 border border-purple-500/20'
              }`}
            >
              {brand}
            </button>
          );
        })}
      </div>
    </div>
  );
}
