import React from 'react';
import { User, Sparkles, RefreshCw } from 'lucide-react';
import assistantBotImg from '../assets/voice-assistant-bot.png';

export default function VisitorSearch({ 
  visitorId, 
  setVisitorId, 
  onSearch, 
  onVoiceClick, 
  onGenerateNew, 
  loading,
  theme 
}) {
  const isLight = theme === 'light';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (visitorId.trim()) {
      onSearch(visitorId);
    }
  };

  return (
    <div className={`rounded-2xl p-4 md:p-5 my-6 shadow-md transition-colors ${
      isLight
        ? 'bg-white border border-slate-200'
        : 'bg-[#0a1630]/90 backdrop-blur-xl border border-purple-500/20 shadow-xl'
    }`}>
      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Left: Input section */}
        <div className="flex-1 space-y-1.5">
          <label className={`text-xs font-semibold flex items-center gap-1.5 ${
            isLight ? 'text-slate-700' : 'text-slate-300'
          }`}>
            <User className="w-3.5 h-3.5 text-purple-600" /> Enter Visitor ID
          </label>
          <div className="relative">
            <input
              type="text"
              value={visitorId}
              onChange={(e) => setVisitorId(e.target.value)}
              placeholder="e.g. 1000294"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                  : 'bg-[#020817] border-purple-500/30 text-white placeholder-slate-500'
              }`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1 lg:pt-5">
          {/* Main Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-md shadow-purple-600/30 active:scale-98 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Fetching...' : 'Get Recommendations'}</span>
          </button>

          {/* Quick Actions */}
          <button
            type="button"
            onClick={onVoiceClick}
            className={`group flex items-center gap-2 border text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all ${
              isLight
                ? 'bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border-slate-300 hover:border-purple-300'
                : 'bg-[#0d1b3e] hover:bg-purple-950/40 text-slate-300 hover:text-purple-200 border-purple-500/20 hover:border-purple-500/40'
            }`}
          >
            <div className="w-5 h-5 rounded-full overflow-hidden border border-purple-400/50 shadow-sm transition-transform duration-300 group-hover:scale-110">
              <img src={assistantBotImg} alt="Voice Bot" className="w-full h-full object-cover" />
            </div>
            <span>Use Voice Assistant</span>
          </button>

          <button
            type="button"
            onClick={onGenerateNew}
            className={`flex items-center gap-1.5 border text-xs font-semibold px-3.5 py-3 rounded-xl transition-all ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-[#0d1b3e] hover:bg-[#12234f] text-slate-300 hover:text-white border-purple-500/20'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-600" />
            <span>Generate New</span>
          </button>
        </div>

      </form>
    </div>
  );
}

