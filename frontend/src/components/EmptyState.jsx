import React from 'react';
import { SearchX, AlertCircle, RefreshCw } from 'lucide-react';

export default function EmptyState({ error, onRetry, onGenerateNew }) {
  const isNotFound = error?.type === 'NOT_FOUND';

  return (
    <div className="bg-[#0a1630]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 text-center my-6 flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-purple-600/10 border border-purple-500/30 flex items-center justify-center">
        {isNotFound ? (
          <SearchX className="w-8 h-8 text-purple-400" />
        ) : (
          <AlertCircle className="w-8 h-8 text-rose-400" />
        )}
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg font-bold text-white">
          {isNotFound ? 'Visitor ID Not Found' : 'Unable to Connect to Service'}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          {isNotFound
            ? 'The visitor ID entered was not found in the dataset index. Click "Generate New" to pick a valid customer ID.'
            : 'Unable to connect to the recommendation API backend service. Please verify your FastAPI server is running.'}
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        )}

        {onGenerateNew && (
          <button
            onClick={onGenerateNew}
            className="bg-[#0d1b3e] hover:bg-[#12234f] text-slate-300 hover:text-white border border-purple-500/20 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            Generate Valid Visitor ID
          </button>
        )}
      </div>
    </div>
  );
}
