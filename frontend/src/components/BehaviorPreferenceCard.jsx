import React, { useState } from 'react';
import {
  SlidersHorizontal,
  TrendingUp,
  Tag,
  DollarSign,
  ShoppingBag,
  Clock,
  Flame,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  ShoppingCart
} from 'lucide-react';

export default function BehaviorPreferenceCard({
  preferences,
  loading,
  onRecompute,
  theme = 'light'
}) {
  const isLight = theme === 'light';
  const [showWeightConfig, setShowWeightConfig] = useState(false);
  const [customWeights, setCustomWeights] = useState({
    product_view: 1.0,
    product_click: 2.0,
    category_view: 2.0,
    brand_view: 2.0,
    search: 3.0,
    wishlist: 5.0,
    add_to_cart: 7.0,
    transaction: 10.0
  });

  const handleWeightChange = (key, val) => {
    setCustomWeights(prev => ({
      ...prev,
      [key]: parseFloat(val) || 1.0
    }));
  };

  const handleApplyWeights = () => {
    if (onRecompute) {
      onRecompute(customWeights);
    }
  };

  if (loading && !preferences) {
    return (
      <div className={`p-6 rounded-2xl border animate-pulse ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
          <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
          <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
          <div className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const pref = preferences || {};
  const topCategories = pref.topCategories || [];
  const topBrands = pref.topBrands || [];
  const topProducts = pref.topProducts || [];
  const recentInteractions = pref.recentInteractions || [];

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      isLight 
        ? 'bg-white border-slate-200/80 shadow-sm hover:shadow-md' 
        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700/80 shadow-xl'
    }`}>
      {/* Header Bar */}
      <div className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
        isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800/60 bg-slate-800/30'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`font-bold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Behavioral Preference Profile
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                Time-Decayed Aggregation
              </span>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Calculated dynamically from {pref.interactionCount || 0} interaction events
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWeightConfig(!showWeightConfig)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              showWeightConfig
                ? 'bg-indigo-600 text-white shadow-sm'
                : isLight
                ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showWeightConfig ? 'Hide Weights' : 'Configure Weights'}</span>
          </button>

          <button
            onClick={() => onRecompute && onRecompute(customWeights)}
            disabled={loading}
            title="Recalculate Preferences"
            className={`p-1.5 rounded-lg border text-xs transition-all ${
              isLight
                ? 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Configurable Weights Dropdown Panel */}
      {showWeightConfig && (
        <div className={`p-4 border-b text-xs transition-all ${
          isLight ? 'bg-indigo-50/40 border-indigo-100' : 'bg-indigo-950/20 border-indigo-900/40'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`font-semibold ${isLight ? 'text-indigo-900' : 'text-indigo-200'}`}>
              Configurable Interaction Weights & Time-Decay Strategy
            </span>
            <span className="text-[11px] text-slate-500">
              Half-Life: <strong className="text-indigo-600 dark:text-indigo-400">7 Days</strong> (λ = ln(2)/7)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'product_view', label: 'Product View' },
              { key: 'product_click', label: 'Product Click' },
              { key: 'category_view', label: 'Category View' },
              { key: 'brand_view', label: 'Brand View' },
              { key: 'search', label: 'Search Query' },
              { key: 'wishlist', label: 'Wishlist' },
              { key: 'add_to_cart', label: 'Add to Cart' },
              { key: 'transaction', label: 'Purchase' }
            ].map(item => (
              <div key={item.key} className="flex flex-col gap-1">
                <label className={`text-[11px] font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {item.label}
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={customWeights[item.key] || 1.0}
                  onChange={(e) => handleWeightChange(item.key, e.target.value)}
                  className={`px-2.5 py-1 rounded-md border text-xs font-mono font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    isLight 
                      ? 'bg-white border-slate-200 text-slate-800' 
                      : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={handleApplyWeights}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recompute with Custom Weights
            </button>
          </div>
        </div>
      )}

      {/* Main Aggregation Stats Grid */}
      <div className="p-6 space-y-6">
        {/* 1-4. Price Analytics Row */}
        <div>
          <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            Price Preference Aggregations
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Preferred Min Price */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200/70' : 'bg-slate-800/40 border-slate-800'
            }`}>
              <div className="text-[11px] font-medium text-slate-500">Min Interacted Price</div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ₹{Number(pref.preferredPriceMin || 0).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Preferred Max Price */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200/70' : 'bg-slate-800/40 border-slate-800'
            }`}>
              <div className="text-[11px] font-medium text-slate-500">Max Interacted Price</div>
              <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                ₹{Number(pref.preferredPriceMax || 0).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Average Price */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200/70' : 'bg-slate-800/40 border-slate-800'
            }`}>
              <div className="text-[11px] font-medium text-slate-500">Decay-Weighted Avg</div>
              <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                ₹{Number(pref.averagePrice || 0).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Price Range */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200/70' : 'bg-slate-800/40 border-slate-800'
            }`}>
              <div className="text-[11px] font-medium text-slate-500">Dominant Range</div>
              <div className="text-xs font-bold text-violet-600 dark:text-violet-400 mt-1 truncate" title={pref.topPriceRange}>
                {pref.topPriceRange || 'Mid-Range'}
              </div>
            </div>
          </div>
        </div>

        {/* 5-6. Categories & Brands Affinities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Categories */}
          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              Top Category Affinities
            </h4>

            <div className="space-y-2">
              {topCategories.length > 0 ? (
                topCategories.slice(0, 4).map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {cat.category}
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {cat.percentage}% ({cat.score} pts)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(12, cat.percentage))}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No category interactions recorded yet</p>
              )}
            </div>
          </div>

          {/* Top Brands */}
          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <Tag className="w-3.5 h-3.5 text-purple-500" />
              Top Brand Affinities
            </h4>

            <div className="space-y-2">
              {topBrands.length > 0 ? (
                topBrands.slice(0, 4).map((br, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {br.brand}
                      </span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        {br.percentage}% ({br.score} pts)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(12, br.percentage))}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No brand interactions recorded yet</p>
              )}
            </div>
          </div>
        </div>

        {/* 7 & 10. Top Products & Recent Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          {/* Top Products */}
          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              Most Interacted Products
            </h4>

            <div className="space-y-2">
              {topProducts.length > 0 ? (
                topProducts.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${
                      isLight ? 'bg-white border-slate-200/60' : 'bg-slate-800/40 border-slate-800'
                    }`}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{item.price}</span>
                        <span>•</span>
                        <span>{item.category}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                        {item.score} pts
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No product history available</p>
              )}
            </div>
          </div>

          {/* Recent Interaction Stream */}
          <div>
            <h4 className={`text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              Recent Event Stream (Decaying)
            </h4>

            <div className="space-y-1.5">
              {recentInteractions.length > 0 ? (
                recentInteractions.slice(0, 3).map((ev, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between text-xs p-2 rounded-lg ${
                      isLight ? 'bg-slate-50' : 'bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                        ev.interaction_type === 'add_to_cart' 
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      }`}>
                        {ev.interaction_type}
                      </span>
                      <span className={`truncate text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {ev.product_name || `Item #${ev.product_id}`}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="text-[11px] font-mono text-slate-500">
                        w: {ev.effective_weight}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No recent events</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
