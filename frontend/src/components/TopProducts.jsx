import React from 'react';
import { enrichProduct } from '../utils/productCatalog';

export default function TopProducts({ recommendations = [], onSelectProduct, theme }) {
  const isLight = theme === 'light';
  const topList = (recommendations || []).slice(0, 5).map(enrichProduct).filter(Boolean);

  return (
    <div className={`border rounded-2xl p-5 shadow-md flex flex-col justify-between h-full transition-colors ${
      isLight
        ? 'bg-white border-slate-200'
        : 'bg-[#0a1630]/80 backdrop-blur-xl border-purple-500/20 shadow-xl'
    }`}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-bold font-['Outfit'] ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Top Recommended Products
          </h3>
          <span className="text-[11px] text-purple-600 font-semibold cursor-pointer hover:underline">View All →</span>
        </div>

        <div className="space-y-2.5">
          <div className={`grid grid-cols-12 text-[10px] uppercase font-semibold pb-1 border-b ${
            isLight ? 'text-slate-500 border-slate-200' : 'text-slate-500 border-slate-800'
          }`}>
            <span className="col-span-1">#</span>
            <span className="col-span-7">Product Name</span>
            <span className="col-span-4 text-right">Score</span>
          </div>

          {topList.map((item, idx) => {
            const scoreVal = typeof item.score === 'number' ? item.score : parseFloat(item.score) || 0.5;
            const barWidth = Math.min(100, Math.max(15, Math.round(scoreVal * 1000)));
            return (
              <div
                key={item.item_id}
                onClick={() => onSelectProduct && onSelectProduct(item)}
                className={`grid grid-cols-12 items-center text-xs py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                  isLight
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <span className="col-span-1 font-bold font-mono text-purple-600">
                  {item.rank || idx + 1}
                </span>
                <div className="col-span-7 pr-2">
                  <div className={`font-medium line-clamp-1 ${isLight ? 'text-slate-900' : 'text-white'}`} title={item.name}>
                    {item.name}
                  </div>
                  <div className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                    ID: #{item.item_id}
                  </div>
                </div>
                <div className="col-span-4 flex items-center justify-end gap-2">
                  <span className={`font-mono text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {item.score}
                  </span>
                  <div className={`w-12 h-1.5 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
