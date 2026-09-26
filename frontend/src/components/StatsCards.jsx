import React from 'react';
import { Eye, ShoppingCart, CheckCircle2, Star, TrendingUp } from 'lucide-react';

export default function StatsCards({ userStats, theme }) {
  const isLight = theme === 'light';

  const stats = [
    {
      title: 'Product Views',
      value: userStats ? userStats.views : '--',
      trend: '↑ 12% vs last week',
      icon: Eye,
      iconBg: isLight ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-purple-600/20 text-purple-400 border-purple-500/30'
    },
    {
      title: 'Add to Cart',
      value: userStats ? userStats.add_to_cart : '--',
      trend: '↑ 25% vs last week',
      icon: ShoppingCart,
      iconBg: isLight ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-blue-600/20 text-blue-400 border-blue-500/30'
    },
    {
      title: 'Transactions',
      value: userStats ? userStats.transactions : '--',
      trend: '↑ 50% vs last week',
      icon: CheckCircle2,
      iconBg: isLight ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
    },
    {
      title: 'Interaction Score',
      value: userStats ? userStats.interaction_score : '--',
      trend: '↑ 18% vs last week',
      icon: Star,
      iconBg: isLight ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-amber-600/20 text-amber-400 border-amber-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className={`border rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all duration-300 ${
              isLight
                ? 'bg-white border-slate-200 hover:border-slate-300'
                : 'bg-[#0a1630]/80 backdrop-blur-xl border-purple-500/15 hover:border-purple-500/35'
            }`}
          >
            <div>
              <p className={`text-[11px] font-semibold mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {stat.title}
              </p>
              <h3 className={`text-xl font-bold font-['Outfit'] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {stat.value}
              </h3>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-2.5 h-2.5" /> {stat.trend}
              </p>
            </div>

            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${stat.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
