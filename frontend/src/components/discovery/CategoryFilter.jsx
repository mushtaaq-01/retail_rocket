import React from 'react';
import { Layers } from 'lucide-react';

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory, theme }) {
  const isLight = theme === 'light';

  return (
    <div className="space-y-2">
      <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
        isLight ? 'text-slate-700' : 'text-slate-300'
      }`}>
        <Layers className="w-3.5 h-3.5 text-purple-600" /> Categories
      </label>

      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-600/30'
              : isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              : 'bg-[#0a1630] hover:bg-purple-950/40 text-slate-300 border border-purple-500/20'
          }`}
        >
          All Categories
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-600/30'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  : 'bg-[#0a1630] hover:bg-purple-950/40 text-slate-300 border border-purple-500/20'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
