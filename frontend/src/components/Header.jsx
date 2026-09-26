import React from 'react';
import { Wifi, WifiOff, Sun, Moon, ChevronDown, ShoppingBag, Database } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabaseClient';

export default function Header({ 
  apiConnected, 
  theme, 
  setTheme, 
  onOpenCart, 
  onOpenDbModal, 
  onOpenUserModal,
  visitorId = '1000294',
  cartCount = 0 
}) {
  const isLight = theme === 'light';
  const dbConnected = isSupabaseConfigured();

  return (
    <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b transition-colors ${
      isLight ? 'border-slate-200' : 'border-purple-500/10'
    }`}>
      <div>
        <h1 className={`text-2xl font-extrabold font-['Outfit'] tracking-tight flex items-center gap-2 ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          RetailRocket{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500">
            Intelligence
          </span>
        </h1>
        <p className={`text-xs max-w-2xl mt-1 leading-relaxed ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          Real-time product discovery and personalized SVD machine learning recommendations.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        
        {/* User Identity / Switch / Logout Pill Button */}
        <button
          onClick={onOpenUserModal}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all group ${
            isLight
              ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200 shadow-sm'
              : 'bg-gradient-to-r from-purple-950/60 to-indigo-950/60 hover:from-purple-900/80 hover:to-indigo-900/80 text-purple-200 border-purple-500/30'
          }`}
          title="Switch User / Logout / Enter New Visitor ID"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
            {visitorId.charAt(0).toUpperCase()}
          </div>
          <span className="font-mono">#{visitorId.length > 10 ? visitorId.substring(0, 10) + '...' : visitorId}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
            Switch
          </span>
        </button>

        {/* Database Connection Status / Settings Button */}
        {onOpenDbModal && (
          <button
            onClick={onOpenDbModal}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              dbConnected
                ? isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm'
                  : 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border-emerald-500/30'
                : isLight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300 shadow-sm'
                  : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-500/30'
            }`}
            title="Configure Supabase Database Connection"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{dbConnected ? 'Database Connected' : 'Connect Database'}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
          </button>
        )}

        {/* Shopping Cart Button */}
        {onOpenCart && (
          <button
            onClick={onOpenCart}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              isLight
                ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 shadow-sm'
                : 'bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 border-purple-500/30'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-purple-500" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-mono text-[10px] font-bold shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        )}


        {/* Light / Dark Theme Toggle Button */}
        <button
          onClick={() => setTheme(isLight ? 'dark' : 'light')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
            isLight
              ? 'bg-white border-slate-300 text-slate-700 shadow-sm hover:bg-slate-50'
              : 'bg-[#0a1630] border-purple-500/30 text-purple-300 hover:bg-purple-950/40'
          }`}
          title="Toggle Light / Dark Mode"
        >
          {isLight ? (
            <>
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-purple-400 fill-purple-400" />
              <span>Dark</span>
            </>
          )}
        </button>

        {/* API Connected Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
          apiConnected
            ? isLight
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
              : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            : isLight
              ? 'bg-rose-50 border-rose-300 text-rose-700'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
        }`}>
          <span className="relative flex h-2 w-2">
            {apiConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${apiConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
          </span>
          <span className="text-[11px] font-semibold">
            {apiConnected ? 'API Connected' : 'API Offline'}
          </span>
        </div>

        {/* Visitor Profile */}
        <div className={`flex items-center gap-2.5 pl-3 border-l ${
          isLight ? 'border-slate-300' : 'border-slate-800'
        }`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-md">
            JD
          </div>
          <div className="hidden sm:block text-left">
            <div className={`text-xs font-semibold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              John Doe
            </div>
            <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Visitor Profile
            </div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
        </div>
      </div>
    </header>
  );
}
