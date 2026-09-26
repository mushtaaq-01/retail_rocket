import React from 'react';
import { Search, Filter, RotateCcw, SlidersHorizontal } from 'lucide-react';
import CategoryFilter from './CategoryFilter';
import BrandFilter from './BrandFilter';
import PriceRangeFilter from './PriceRangeFilter';

export default function ProductFilters({
  searchQuery,
  onSearchChange,
  categories,
  selectedCategory,
  onSelectCategory,
  brands,
  selectedBrand,
  onSelectBrand,
  minPrice,
  maxPrice,
  currentMaxPrice,
  onMaxPriceChange,
  onResetFilters,
  totalResults,
  theme
}) {
  const isLight = theme === 'light';

  return (
    <div className={`border rounded-2xl p-5 space-y-6 shadow-md transition-colors ${
      isLight 
        ? 'bg-white border-slate-200 shadow-slate-200/50' 
        : 'bg-[#0a1630]/90 backdrop-blur-xl border-purple-500/20 shadow-xl'
    }`}>
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-600" />
          <h3 className={`text-sm font-bold font-['Outfit'] ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Product Filters
          </h3>
        </div>

        <button
          onClick={onResetFilters}
          className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
            isLight ? 'text-purple-600 hover:text-purple-800' : 'text-purple-400 hover:text-purple-300'
          }`}
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Search Bar inside filters */}
      <div className="space-y-1.5">
        <label className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
          isLight ? 'text-slate-700' : 'text-slate-300'
        }`}>
          <Search className="w-3.5 h-3.5 text-purple-600" /> Search Catalog
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, specs, brand..."
            className={`w-full border rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                : 'bg-[#020817] border-purple-500/30 text-white placeholder-slate-500'
            }`}
          />
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {/* Category filter */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        theme={theme}
      />

      {/* Brand filter */}
      <BrandFilter
        brands={brands}
        selectedBrand={selectedBrand}
        onSelectBrand={onSelectBrand}
        theme={theme}
      />

      {/* Price Range filter */}
      <PriceRangeFilter
        minPrice={minPrice}
        maxPrice={maxPrice}
        currentMax={currentMaxPrice}
        onMaxPriceChange={onMaxPriceChange}
        theme={theme}
      />

      {/* Matching summary */}
      <div className={`p-3 rounded-xl border text-center text-xs font-semibold ${
        isLight 
          ? 'bg-slate-50 border-slate-200 text-slate-700' 
          : 'bg-[#020817] border-purple-500/20 text-slate-300'
      }`}>
        <span>Showing <strong>{totalResults}</strong> matching products</span>
      </div>
    </div>
  );
}
