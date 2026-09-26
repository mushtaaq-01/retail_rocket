import React from 'react';
import { 
  Home, 
  Sparkles, 
  Compass,
  LayoutGrid,
  BarChart3, 
  Database, 
  Settings, 
  ShoppingBag,
  Users,
  Package,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import assistantBotImg from '../assets/voice-assistant-bot.png';

export default function Sidebar({ activeTab, setActiveTab, datasetHealth, theme, cartCount = 0 }) {
  const isLight = theme === 'light';

  const navItems = [
    { id: 'home', label: 'Home Dashboard', icon: Home },
    { id: 'discovery', label: 'Product Discovery', icon: LayoutGrid },
    { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles },
    { id: 'voice', label: 'Voice Assistant', isBot: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'dataset', label: 'Dataset Info', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`w-64 flex flex-col justify-between p-5 min-h-screen border-r select-none transition-colors ${
      isLight 
        ? 'bg-white border-slate-200 text-slate-800 shadow-sm' 
        : 'bg-[#061126]/90 backdrop-blur-xl border-purple-500/20 text-slate-200'
    }`}>
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`font-['Outfit'] font-bold text-lg leading-tight tracking-wide flex items-center gap-1.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              RetailRocket <span className="text-purple-600">AI</span>
            </h1>
            <p className={`text-[10px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Smarter Recommendations. Happier Shoppers.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5 mb-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-300 relative ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 font-semibold'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {item.isBot ? (
                  <div className={`w-4 h-4 rounded-full overflow-hidden border ${isActive ? 'border-white/80' : 'border-purple-400/60'} shrink-0 shadow-sm`}>
                    <img src={assistantBotImg} alt="Voice Bot" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                )}
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-sm"
                  />
                )}
              </button>
            );
          })}
        </nav>


        {/* Dataset Card */}
        <div className={`p-3.5 rounded-xl border space-y-3 transition-colors ${
          isLight 
            ? 'bg-slate-50 border-slate-200' 
            : 'bg-[#0a1630]/80 border-purple-500/15'
        }`}>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600" />
            <div>
              <h4 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                RetailRocket Dataset
              </h4>
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Customer behavior e-commerce data
              </p>
            </div>
          </div>

          <div className="space-y-2 text-[11px] pt-1">
            <div className="flex justify-between items-center">
              <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <Users className="w-3 h-3 text-cyan-600" /> Visitors (Customers)
              </span>
              <span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                {datasetHealth ? `~${datasetHealth.users}` : '~2.2M'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <Package className="w-3 h-3 text-purple-600" /> Products (Items)
              </span>
              <span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                {datasetHealth ? `~${datasetHealth.products}` : '~41K'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <Activity className="w-3 h-3 text-emerald-600" /> Events (Interactions)
              </span>
              <span className={`font-mono font-semibold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                {datasetHealth?.interactions ? `~${datasetHealth.interactions}` : '~12.7M'}
              </span>
            </div>
          </div>

          {/* Event Types Legend */}
          <div className={`pt-2 border-t space-y-1.5 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Event Types
            </p>
            <div className="flex justify-between items-center text-[10px]">
              <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span> View
              </span>
              <span className={`font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>1x</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <span className="w-2 h-2 rounded-full bg-purple-600"></span> Add to Cart
              </span>
              <span className={`font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>3x</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Transaction
              </span>
              <span className={`font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>5x</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className={`pt-4 border-t text-[10px] text-center space-y-0.5 ${
        isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800/60 text-slate-500'
      }`}>
        <p className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>Powered by Machine Learning</p>
        <p>TruncatedSVD • Collaborative Filtering</p>
      </div>
    </aside>
  );
}
