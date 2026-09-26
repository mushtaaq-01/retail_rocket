import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Tag,
  Info,
  ChevronDown,
  DollarSign,
  Layers,
  Flame,
  ShoppingCart,
  Cpu
} from 'lucide-react';
import { enrichProduct } from '../utils/productCatalog';

export default function RecommendationCard({
  item: rawItem,
  rank = 1,
  onSelect,
  onAddToCart,
  theme = 'dark'
}) {
  if (!rawItem) return null;
  const item = enrichProduct(rawItem);
  if (!item) return null;

  const [showBreakdown, setShowBreakdown] = useState(false);
  const isLight = theme === 'light';
  const scoreVal = typeof item.score === 'number' ? item.score : parseFloat(item.score) || 0.5;
  const barWidth = Math.min(100, Math.max(15, Math.round(scoreVal * 100)));

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`border rounded-2xl p-4 flex flex-col justify-between shadow-md group relative overflow-hidden transition-all ${
        isLight
          ? 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-lg'
          : 'bg-[#0a1630]/90 backdrop-blur-xl border-purple-500/20 hover:border-purple-500/50 shadow-xl'
      }`}
    >
      <div>
        {/* Top bar with Rank & Badge */}
        <div className="flex justify-between items-center mb-3">
          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border ${
            isLight
              ? 'bg-purple-100 text-purple-700 border-purple-200'
              : 'bg-purple-600/20 text-purple-300 border-purple-500/30'
          }`}>
            #{rank}
          </span>
          <span className={`text-[10px] font-semibold flex items-center gap-1 ${
            isLight ? 'text-indigo-600' : 'text-indigo-400'
          }`}>
            <Sparkles className="w-3 h-3" /> Hybrid AI Rank
          </span>
        </div>

        {/* Real Product Image Container */}
        <div className={`w-full h-44 rounded-xl border relative overflow-hidden mb-3 bg-slate-900 group-hover:scale-[1.02] transition-transform duration-300 ${
          isLight ? 'border-slate-200' : 'border-white/10'
        }`}>
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80";
            }}
          />
          {/* Price Overlay Badge */}
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/20 text-white font-mono font-bold text-xs shadow-lg">
            {item.price}
          </div>
        </div>

        {/* Human-Readable Explanation Banner */}
        {item.reason && (
          <div className={`mb-3 p-2 rounded-xl text-[11px] font-medium flex items-center gap-2 border ${
            isLight
              ? 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
              : 'bg-indigo-950/40 border-indigo-900/50 text-indigo-200'
          }`}>
            <Info className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
            <span className="line-clamp-2 leading-tight">{item.reason}</span>
          </div>
        )}

        {/* Product Name & Category */}
        <div className="space-y-1 mb-3">
          <div className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 ${
            isLight ? 'text-purple-600' : 'text-purple-400'
          }`}>
            <Tag className="w-3 h-3" /> {item.category}
          </div>
          <h3 className={`text-sm font-bold font-['Outfit'] line-clamp-2 leading-snug ${
            isLight ? 'text-slate-900' : 'text-white'
          }`} title={item.name}>
            {item.name}
          </h3>
          <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            ID: #{item.item_id}
          </p>
        </div>

        {/* Combined Score Progress Bar */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between items-center text-xs">
            <span className={`font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Combined Rank Score
            </span>
            <span className={`font-mono font-bold ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`}>
              {typeof item.ranking_score === 'number' ? item.ranking_score.toFixed(4) : item.score}
            </span>
          </div>

          <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 rounded-full"
            />
          </div>
        </div>

        {/* Feature Match Score Breakdown Toggle */}
        <div className="mb-3">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className={`w-full py-1 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-between transition-colors ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            <span>Feature Score Breakdown</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showBreakdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mt-2 p-2.5 rounded-xl border text-[10px] space-y-1.5 font-mono ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/90 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-cyan-500" /> SVD ML Score:</span>
                  <span className="font-bold text-cyan-500">{item.ml_score ?? 0.5}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-emerald-500" /> Price Match:</span>
                  <span className="font-bold text-emerald-500">{item.price_match_score ?? 0.5}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Layers className="w-3 h-3 text-blue-500" /> Category Match:</span>
                  <span className="font-bold text-blue-500">{item.category_score ?? 0.5}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Tag className="w-3 h-3 text-purple-500" /> Brand Match:</span>
                  <span className="font-bold text-purple-500">{item.brand_score ?? 0.5}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> Interaction:</span>
                  <span className="font-bold text-orange-500">{item.interaction_score ?? 0.5}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1"><ShoppingCart className="w-3 h-3 text-pink-500" /> Cart Affinity:</span>
                  <span className="font-bold text-pink-500">{item.cart_score ?? 0.3}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onSelect && onSelect(item)}
          className={`flex-1 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 ${
            isLight
              ? 'bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border-slate-300'
              : 'bg-[#0d1b3e] hover:bg-purple-950/40 text-slate-300 hover:text-white border-purple-500/20'
          }`}
        >
          <span>Details</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {onAddToCart && (
          <button
            onClick={() => onAddToCart(item)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
            title="Add to Shopping Cart"
          >
            <Tag className="w-3 h-3" />
            <span>Add</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
