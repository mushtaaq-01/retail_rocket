import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Tag,
  DollarSign,
  Layers,
  Flame,
  ShoppingCart,
  Cpu,
  Info,
  CheckCircle2,
  HelpCircle,
  ShoppingBag,
  Eye,
  ArrowRight,
  ShieldCheck,
  Search,
  RefreshCw,
  BarChart2
} from 'lucide-react';
import { enrichProduct } from '../utils/productCatalog';

export default function PredictionAnalysis({
  visitorId,
  preferences,
  recommendations = [],
  userStats,
  cartItems = [],
  loading = false,
  onSelectProduct,
  onAddToCart,
  onRefresh,
  theme = 'light'
}) {
  const isLight = theme === 'light';
  const [selectedRec, setSelectedRec] = useState(null);

  const pref = preferences || {};
  const recs = recommendations || [];

  // Helper to convert normalized 0-1 scores into user-friendly qualitative tiers
  const getMatchTier = (score) => {
    const val = typeof score === 'number' ? score : parseFloat(score) || 0;
    if (val >= 0.75) return { label: 'High Match', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' };
    if (val >= 0.45) return { label: 'Medium Match', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' };
    return { label: 'Moderate', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' };
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner: Explanation & Header */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isLight
          ? 'bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white border-indigo-800 shadow-lg'
          : 'bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 text-white border-purple-500/30 shadow-2xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-purple-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Hybrid Behavioral ML Prediction Engine
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-['Outfit'] tracking-tight">
              Personalized Recommendation Analysis
            </h2>
            <p className="text-xs md:text-sm text-purple-200/80 max-w-2xl">
              Explaining AI predictions for Shopper <span className="font-mono font-bold text-white">#{visitorId}</span> by combining Collaborative Filtering Latent Factors with real-time shopping behavior.
            </p>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Recalculate Analysis</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: USER SHOPPING PROFILE */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200/80 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-xl'
      }`}>
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                User Shopping Profile
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Aggregated from {pref.interactionCount || userStats?.views || 0} customer interaction events
              </p>
            </div>
          </div>
        </div>

        {/* 7 Core Profile Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
          {/* 1. Preferred Price Range */}
          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-800/40 border-slate-800'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              <span>Price Range</span>
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate" title={pref.topPriceRange}>
              ₹{Number(pref.preferredPriceMin || 5000).toLocaleString('en-IN')} – ₹{Number(pref.preferredPriceMax || 50000).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">{pref.topPriceRange || 'Mid-Range'}</div>
          </div>

          {/* 2. Average Viewed Price */}
          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-800/40 border-slate-800'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1">
              <BarChart2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Avg Viewed Price</span>
            </div>
            <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
              ₹{Number(pref.averagePrice || 25000).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Time-Weighted</div>
          </div>

          {/* 3. Top Category */}
          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-800/40 border-slate-800'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span>Top Category</span>
            </div>
            <div className={`text-xs font-bold truncate ${isLight ? 'text-slate-800' : 'text-slate-100'}`} title={pref.topCategory}>
              {pref.topCategory || 'Consumer Retail'}
            </div>
            <div className="text-[10px] text-blue-500 mt-0.5 font-medium">Primary Affinity</div>
          </div>

          {/* 4. Top Brand */}
          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-800/40 border-slate-800'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1">
              <Tag className="w-3.5 h-3.5 text-purple-500" />
              <span>Top Brand</span>
            </div>
            <div className={`text-xs font-bold truncate ${isLight ? 'text-slate-800' : 'text-slate-100'}`} title={pref.topBrand}>
              {pref.topBrand || 'Popular Brands'}
            </div>
            <div className="text-[10px] text-purple-500 mt-0.5 font-medium">Brand Loyalty</div>
          </div>

          {/* 5. Products Viewed */}
          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-800/40 border-slate-800'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1">
              <Eye className="w-3.5 h-3.5 text-cyan-500" />
              <span>Products Viewed</span>
            </div>
            <div className={`text-sm font-bold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              {userStats?.views || pref.interactionCount || 1}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Browsing History</div>
          </div>

          {/* 6. Products in Cart */}
          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-800/40 border-slate-800'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1">
              <ShoppingCart className="w-3.5 h-3.5 text-pink-500" />
              <span>Cart Items</span>
            </div>
            <div className={`text-sm font-bold text-pink-600 dark:text-pink-400`}>
              {pref.cartProducts?.length || cartItems.length || userStats?.add_to_cart || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">High Purchase Intent</div>
          </div>

          {/* 7. Interaction Count */}
          <div className={`p-3.5 rounded-xl border ${
            isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-800/40 border-slate-800'
          }`}>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mb-1">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>Total Events</span>
            </div>
            <div className={`text-sm font-bold text-orange-600 dark:text-orange-400`}>
              {pref.interactionCount || (userStats ? userStats.views + userStats.add_to_cart + userStats.transactions : 1)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Signal Velocity</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: "WHY THESE PRODUCTS?" EXPLAINABILITY COMPONENT */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200/80 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-xl'
      }`}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-base font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Why These Products?
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Transparent breakdown of the 6 behavioral and predictive factors driving the recommendations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Factor 1: Price Preference */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            isLight ? 'bg-emerald-50/40 border-emerald-100' : 'bg-emerald-950/20 border-emerald-900/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" /> Price Preference
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold">
                Weight: 15%
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Scores products based on proximity to your average viewed price (₹{Number(pref.averagePrice || 25000).toLocaleString('en-IN')}) and within your preferred bracket ({pref.topPriceRange || 'Mid-Range'}).
            </p>
          </div>

          {/* Factor 2: Category Preference */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            isLight ? 'bg-blue-50/40 border-blue-100' : 'bg-blue-950/20 border-blue-900/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                <Layers className="w-4 h-4" /> Category Preference
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                Weight: 20%
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Applies time-decay to prioritize categories you have actively explored, prioritizing {pref.topCategory || 'Consumer Tech'} with high interest share.
            </p>
          </div>

          {/* Factor 3: Brand Interaction */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            isLight ? 'bg-purple-50/40 border-purple-100' : 'bg-purple-950/20 border-purple-900/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-400">
                <Tag className="w-4 h-4" /> Brand Interaction
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-semibold">
                Weight: 15%
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Rewards catalog items manufactured by brands with which you have demonstrated high engagement or repeated views ({pref.topBrand || 'Top Brands'}).
            </p>
          </div>

          {/* Factor 4: Browsing Behavior */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            isLight ? 'bg-orange-50/40 border-orange-100' : 'bg-orange-950/20 border-orange-900/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-400">
                <Flame className="w-4 h-4" /> Browsing Behavior
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300 font-semibold">
                Weight: 10%
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Analyzes interaction frequency and recency. Events from recent sessions hold stronger influence via exponential time-decay (half-life of 7 days).
            </p>
          </div>

          {/* Factor 5: Cart Behavior */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            isLight ? 'bg-pink-50/40 border-pink-100' : 'bg-pink-950/20 border-pink-900/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-pink-700 dark:text-pink-400">
                <ShoppingCart className="w-4 h-4" /> Cart Affinity
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/60 text-pink-700 dark:text-pink-300 font-semibold">
                Weight: 5%
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Boosts complementary items and matching accessories that pair well with products currently in your active shopping cart.
            </p>
          </div>

          {/* Factor 6: ML Ranking (Collaborative Filtering) */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            isLight ? 'bg-cyan-50/40 border-cyan-100' : 'bg-cyan-950/20 border-cyan-900/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-400">
                <Cpu className="w-4 h-4" /> Collaborative ML Model
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 font-semibold">
                Weight: 35%
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              TruncatedSVD matrix factorization discovers latent preferences by comparing your event stream against 2.2M shoppers in the RetailRocket dataset.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: RECOMMENDED PRODUCTS WITH DETAILED MATCH FACTORS */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isLight ? 'bg-white border-slate-200/80 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-xl'
      }`}>
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Recommended Products
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Ranked by hybrid combined score with detailed factor matching
              </p>
            </div>
          </div>
        </div>

        {recs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No recommendations generated. Search for a visitor ID to view predictions.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recs.map((item, idx) => {
              const enriched = enrichProduct(item);
              const brandTier = getMatchTier(enriched.brand_score);
              const categoryTier = getMatchTier(enriched.category_score);
              const priceTier = getMatchTier(enriched.price_match_score);

              return (
                <div
                  key={enriched.item_id || idx}
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isLight 
                      ? 'bg-slate-50/50 border-slate-200 hover:border-indigo-300 hover:shadow-md' 
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:shadow-lg'
                  }`}
                >
                  <div>
                    {/* Top Row: Product image + Name + Rank Badge */}
                    <div className="flex gap-4 mb-4">
                      <img
                        src={enriched.image}
                        alt={enriched.name}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80";
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-900/60 text-purple-300'
                          }`}>
                            Rank #{enriched.rank || idx + 1}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {enriched.price}
                          </span>
                        </div>
                        <h4 className={`text-sm font-bold font-['Outfit'] line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {enriched.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{enriched.brand || 'RetailBrand'}</span>
                          <span>•</span>
                          <span className="truncate">{enriched.category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Feature Match Breakdown Badges */}
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      <div className={`p-2 rounded-lg border text-[11px] ${priceTier.color}`}>
                        <div className="text-[9px] uppercase font-bold tracking-wider opacity-75">Price Match</div>
                        <div className="font-semibold mt-0.5">{priceTier.label}</div>
                      </div>
                      <div className={`p-2 rounded-lg border text-[11px] ${categoryTier.color}`}>
                        <div className="text-[9px] uppercase font-bold tracking-wider opacity-75">Category Match</div>
                        <div className="font-semibold mt-0.5">{categoryTier.label}</div>
                      </div>
                      <div className={`p-2 rounded-lg border text-[11px] ${brandTier.color}`}>
                        <div className="text-[9px] uppercase font-bold tracking-wider opacity-75">Brand Match</div>
                        <div className="font-semibold mt-0.5">{brandTier.label}</div>
                      </div>
                    </div>

                    {/* Score Comparison Bars: ML Ranking vs Final Hybrid Score */}
                    <div className={`p-3 rounded-xl border mb-3 space-y-2 ${
                      isLight ? 'bg-white border-slate-200/70' : 'bg-slate-900/60 border-slate-800'
                    }`}>
                      <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Cpu className="w-3.5 h-3.5 text-cyan-500" /> Existing ML Score
                        </span>
                        <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">
                          {typeof enriched.ml_score === 'number' ? enriched.ml_score.toFixed(4) : '0.5000'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Final Combined Score
                        </span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {typeof enriched.ranking_score === 'number' ? enriched.ranking_score.toFixed(4) : enriched.score}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(15, ((enriched.ranking_score || enriched.score || 0.5) * 100)))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Human-Readable Explanation Reason */}
                    {enriched.reason && (
                      <div className={`p-2.5 rounded-xl border text-xs font-medium flex items-start gap-2 mb-4 ${
                        isLight ? 'bg-indigo-50/70 border-indigo-100 text-indigo-900' : 'bg-indigo-950/40 border-indigo-900/50 text-indigo-200'
                      }`}>
                        <Info className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <span className="leading-snug">{enriched.reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => onSelectProduct && onSelectProduct(enriched)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        isLight 
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <span>Inspect Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {onAddToCart && (
                      <button
                        onClick={() => onAddToCart(enriched)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
