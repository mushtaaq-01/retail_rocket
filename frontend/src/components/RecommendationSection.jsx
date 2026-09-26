import React, { useState } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import RecommendationCard from './RecommendationCard';
import LoadingSkeleton from './LoadingSkeleton';
import EmptyState from './EmptyState';

export default function RecommendationSection({ 
  recommendations, 
  loading, 
  error, 
  onRetry, 
  onGenerateNew,
  onSelectProduct,
  onAddToCart,
  theme 
}) {
  const isLight = theme === 'light';
  const [currentIndex, setCurrentIndex] = useState(0);

  const visibleCards = 3;
  const maxIndex = Math.max(0, recommendations.length - visibleCards);

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className={`border rounded-2xl p-5 md:p-6 mb-6 shadow-md relative overflow-hidden transition-colors ${
      isLight
        ? 'bg-white border-slate-200'
        : 'bg-[#0a1630]/80 backdrop-blur-xl border-purple-500/20 shadow-xl'
    }`}>
      {/* Header section */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b ${
        isLight ? 'border-slate-200' : 'border-slate-800/60'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mt-0.5 ${
            isLight
              ? 'bg-purple-100 border-purple-200 text-purple-600'
              : 'bg-purple-600/20 border-purple-500/30 text-purple-400'
          }`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-lg font-bold font-['Outfit'] ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Recommended Products
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Top products based on your interaction history and similar customer patterns
            </p>
          </div>
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Sort by:</label>
          <select className={`border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 ${
            isLight
              ? 'bg-slate-50 border-slate-300 text-slate-900'
              : 'bg-[#020817] border-purple-500/30 text-white'
          }`}>
            <option value="score">Recommendation Score</option>
            <option value="rank">Rank Position</option>
          </select>
        </div>
      </div>

      {/* Body section */}
      {loading ? (
        <LoadingSkeleton count={3} />
      ) : error ? (
        <EmptyState error={error} onRetry={onRetry} onGenerateNew={onGenerateNew} />
      ) : recommendations.length === 0 ? (
        <EmptyState error={{ type: 'NOT_FOUND' }} onGenerateNew={onGenerateNew} />
      ) : (
        <div className="relative group">
          {/* Navigation Controls */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-9 h-9 rounded-full border flex items-center justify-center shadow-lg transition-all ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-[#0d1b3e] border-purple-500/40 text-white hover:bg-purple-600/40'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {currentIndex < maxIndex && (
            <button
              onClick={handleNext}
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-9 h-9 rounded-full border flex items-center justify-center shadow-lg transition-all ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  : 'bg-[#0d1b3e] border-purple-500/40 text-white hover:bg-purple-600/40'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {recommendations.slice(currentIndex, currentIndex + visibleCards).map((item, idx) => (
                <RecommendationCard
                  key={item.item_id}
                  item={item}
                  rank={item.rank || currentIndex + idx + 1}
                  onSelect={onSelectProduct}
                  onAddToCart={onAddToCart}
                  theme={theme}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination Indicators */}
          <div className="flex justify-center items-center gap-1.5 mt-5">
            {Array.from({ length: Math.ceil(recommendations.length / visibleCards) }).map((_, idx) => (
              <span
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  Math.floor(currentIndex / visibleCards) === idx
                    ? 'w-6 bg-gradient-to-r from-purple-600 to-indigo-600'
                    : isLight
                    ? 'bg-slate-300'
                    : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
