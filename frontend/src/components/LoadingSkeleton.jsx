import React from 'react';

export default function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-[#0a1630]/70 border border-purple-500/10 rounded-2xl p-4 space-y-4 animate-pulse"
        >
          <div className="flex justify-between items-center">
            <div className="w-12 h-5 bg-slate-800 rounded-md" />
            <div className="w-20 h-4 bg-slate-800 rounded-md" />
          </div>

          <div className="w-full h-36 bg-slate-800/80 rounded-xl" />

          <div className="space-y-2">
            <div className="w-24 h-3 bg-slate-800 rounded" />
            <div className="w-32 h-6 bg-slate-800 rounded-lg" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="w-28 h-3 bg-slate-800 rounded" />
              <div className="w-12 h-3 bg-slate-800 rounded" />
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full" />
          </div>

          <div className="w-full h-10 bg-slate-800 rounded-xl" />
        </div>
      ))}
    </div>
  );
}
