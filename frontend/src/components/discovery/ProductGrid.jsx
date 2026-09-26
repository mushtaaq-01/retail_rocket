import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { ArrowUpDown, SearchX } from 'lucide-react';
import ProductCard from './ProductCard';

export default function ProductGrid({
  products,
  sortBy,
  onSortChange,
  onSelectProduct,
  onAddToCart,
  cartItems = [],
  onResetFilters,
  theme
}) {
  const isLight = theme === 'light';

  const cartMap = cartItems.reduce((acc, item) => {
    acc[item.id] = (acc[item.id] || 0) + (item.quantity || 1);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Top Bar: Count & Sorting */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-colors ${
        isLight 
          ? 'bg-white border-slate-200' 
          : 'bg-[#0a1630]/80 backdrop-blur-xl border-purple-500/20'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Found <strong className={`font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{products.length}</strong> items in catalog
          </span>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label className={`text-xs flex items-center gap-1 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" /> Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className={`border rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900'
                : 'bg-[#020817] border-purple-500/30 text-white'
            }`}
          >
            <option value="featured">Featured / Catalog Order</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Top Customer Rating</option>
            <option value="name_asc">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid of Cards or Empty State */}
      {products.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border flex flex-col items-center justify-center space-y-4 ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0a1630]/80 border-purple-500/20'
        }`}>
          <div className="w-16 h-16 rounded-full bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <SearchX className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h4 className={`text-base font-bold font-['Outfit'] ${isLight ? 'text-slate-900' : 'text-white'}`}>
              No Matching Products Found
            </h4>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Try expanding your search keyword, adjusting the price slider, or selecting "All Categories".
            </p>
          </div>
          <button
            onClick={onResetFilters}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all hover:scale-102"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                onAddToCart={onAddToCart}
                isInCart={Boolean(cartMap[product.id])}
                cartQuantity={cartMap[product.id] || 0}
                theme={theme}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
