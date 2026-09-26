import React, { useState } from 'react';
import { Sparkles, Eye, ShoppingCart, CheckCircle2, Volume2, ArrowRight } from 'lucide-react';

export default function AIInsight({ visitorId, userStats, theme }) {
  const isLight = theme === 'light';
  const [isPlaying, setIsPlaying] = useState(false);

  const hasStats = userStats && (userStats.views || userStats.add_to_cart || userStats.transactions);

  const insightText = visitorId
    ? `Recommendations generated from visitor ${visitorId}'s interaction pattern.`
    : "Enter a visitor ID to inspect personalized AI recommendation insights.";

  const statsSummaryText = hasStats
    ? `This visitor has ${userStats.views} views, ${userStats.add_to_cart} add-to-cart actions and ${userStats.transactions} transactions.`
    : "No interaction event history available for this visitor.";

  const handlePlayExplanation = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text = `${insightText} ${statsSummaryText} Views are weighted 1x, Add to Cart is weighted 3x, and Transactions are weighted 5x in Truncated SVD collaborative filtering.`;
      const utterance = new SpeechSynthesisUtterance(text);
      setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`border rounded-2xl p-5 shadow-md flex flex-col justify-between h-full relative overflow-hidden transition-colors ${
      isLight
        ? 'bg-white border-slate-200'
        : 'bg-[#0a1630]/80 backdrop-blur-xl border-purple-500/20 shadow-xl'
    }`}>
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            isLight
              ? 'bg-purple-100 text-purple-600'
              : 'bg-purple-600/20 text-purple-400'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className={`text-sm font-bold font-['Outfit'] ${isLight ? 'text-slate-900' : 'text-white'}`}>
            AI Insight
          </h3>
        </div>

        <p className={`text-xs font-semibold mb-1 leading-relaxed ${isLight ? 'text-purple-700' : 'text-purple-400'}`}>
          {insightText}
        </p>

        {hasStats && (
          <p className={`text-[11px] mb-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {statsSummaryText}
          </p>
        )}

        {/* Visual sequence pipeline */}
        <div className={`flex items-center justify-between border rounded-xl p-3 my-3 ${
          isLight
            ? 'bg-slate-50 border-slate-200'
            : 'bg-[#020817] border-purple-500/20'
        }`}>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-600 flex items-center justify-center mb-1">
              <Eye className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>View</span>
            <span className="text-[9px] font-mono text-cyan-600 font-bold">1x</span>
          </div>

          <ArrowRight className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-600 flex items-center justify-center mb-1">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Add to Cart</span>
            <span className="text-[9px] font-mono text-purple-600 font-bold">3x</span>
          </div>

          <ArrowRight className={`w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mb-1">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>Transaction</span>
            <span className="text-[9px] font-mono text-emerald-600 font-bold">5x</span>
          </div>
        </div>

        <p className={`text-[11px] italic mb-4 text-center ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          "The SVD model identifies items with highest latent similarity scores."
        </p>
      </div>

      <button
        onClick={handlePlayExplanation}
        className={`w-full py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
          isPlaying
            ? 'bg-purple-600 text-white border-purple-500 shadow-md'
            : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-500/30'
        }`}
      >
        <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce' : ''}`} />
        <span>{isPlaying ? 'Playing Explanation...' : 'Play Explanation'}</span>
      </button>
    </div>
  );
}
