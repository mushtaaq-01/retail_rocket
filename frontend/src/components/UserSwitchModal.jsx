import React, { useState } from 'react';
import { 
  User, 
  LogOut, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Database, 
  RefreshCw, 
  Zap, 
  X, 
  ArrowRight,
  ShoppingBag,
  Activity,
  Layers
} from 'lucide-react';
import { registerUserProfile } from '../services/api';

export default function UserSwitchModal({
  isOpen,
  onClose,
  currentVisitorId,
  onSwitchVisitor,
  theme
}) {
  const isLight = theme === 'light';
  const [newVisitorId, setNewVisitorId] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  if (!isOpen) return null;

  const handleGenerateRandomId = () => {
    const randomHex = Math.random().toString(36).substring(2, 8);
    const generatedId = `usr_${randomHex}_${Date.now().toString().slice(-4)}`;
    setNewVisitorId(generatedId);
    setEmail(`${generatedId}@retailrocket.ai`);
  };

  const handleApplyUser = async (idToUse, emailToUse = null) => {
    const finalId = (idToUse || newVisitorId).trim();
    if (!finalId) return;

    setIsSubmitting(true);
    setStatusMessage('Syncing user profile to Supabase database...');

    try {
      // 1. Register / Upsert user profile to Supabase
      await registerUserProfile(finalId, emailToUse || email || `${finalId}@retailrocket.ai`, {
        registered_at: new Date().toISOString(),
        client_agent: 'RetailRocket Web Portal'
      });

      // 2. Set new active visitor in application state & localStorage
      localStorage.setItem('rr_active_visitor_id', String(finalId));
      
      // 3. Reset session ID for fresh analytics tracking
      const newSessionId = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      try {
        sessionStorage.setItem('rr_session_id', newSessionId);
      } catch {}

      setStatusMessage(`Successfully connected as Visitor #${finalId}!`);

      setTimeout(() => {
        setIsSubmitting(false);
        onSwitchVisitor(finalId);
        onClose();
      }, 500);

    } catch (err) {
      console.error("Error registering user profile:", err);
      setIsSubmitting(false);
      onSwitchVisitor(finalId);
      onClose();
    }
  };

  const handleLogout = () => {
    // Clear local storage and switch to empty / new generated visitor
    const freshId = `usr_${Math.random().toString(36).substring(2, 8)}`;
    handleApplyUser(freshId, `${freshId}@retailrocket.ai`);
  };

  const samplePersonas = [
    {
      id: 'user_runner_01',
      name: 'Nike Sportswear Runner',
      category: 'Shoes & Apparel',
      desc: 'Active interest in Nike running footwear & accessories',
      icon: '🏃',
      color: 'from-orange-500 to-amber-600'
    },
    {
      id: 'user_audiophile_02',
      name: 'Audiophile & Tech Explorer',
      category: 'Audio & Electronics',
      desc: 'Frequent visits to Sony & Bose noise cancelling audio',
      icon: '🎧',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: '1000294',
      name: 'Historical Training Shopper',
      category: 'Collaborative SVD ML',
      desc: 'Benchmark profile with pre-trained matrix latent factors',
      icon: '🤖',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: `usr_${Math.random().toString(36).substring(2, 7)}`,
      name: 'Brand New Clean Visitor',
      category: 'Cold-Start Baseline',
      desc: 'Zero prior history - progressive personalization showcase',
      icon: '✨',
      color: 'from-emerald-500 to-teal-600'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-900' 
            : 'bg-[#0a1630] border-purple-500/30 text-white'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-6 border-b flex items-center justify-between ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060e22] border-purple-500/20'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Outfit'] flex items-center gap-2">
                User Identity & Profile Switcher
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Persistent visitor identity synchronized with Supabase PostgreSQL
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-400 hover:text-slate-700' : 'hover:bg-purple-950/50 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Current Active User Status Card */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            isLight ? 'bg-purple-50/60 border-purple-200' : 'bg-purple-950/30 border-purple-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider block">
                  Active Authenticated Identity
                </span>
                <span className="text-sm font-mono font-bold text-slate-800 dark:text-white">
                  Visitor #{currentVisitorId}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                isLight 
                  ? 'bg-white hover:bg-rose-50 text-rose-600 border-slate-200 hover:border-rose-300' 
                  : 'bg-[#060e22] hover:bg-rose-950/40 text-rose-300 border-purple-500/20 hover:border-rose-500/40'
              }`}
              title="Logout and start fresh session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Form: Enter Custom Visitor ID or Generate */}
          <div className="space-y-3">
            <label className={`text-xs font-semibold flex items-center justify-between ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}>
              <span>Enter New Visitor ID or Identifier</span>
              <button
                type="button"
                onClick={handleGenerateRandomId}
                className="text-purple-600 hover:text-purple-500 font-semibold text-[11px] flex items-center gap-1"
              >
                <Zap className="w-3 h-3" /> Auto-Generate ID
              </button>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newVisitorId}
                onChange={(e) => setNewVisitorId(e.target.value)}
                placeholder="e.g. user_sarah, shopper_01, 1000294"
                className={`flex-1 border rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                    : 'bg-[#060e22] border-purple-500/30 text-white placeholder-slate-500'
                }`}
              />

              <button
                onClick={() => handleApplyUser()}
                disabled={!newVisitorId.trim() || isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-purple-600/30 transition-all disabled:opacity-40"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Login & Store</span>
              </button>
            </div>
          </div>

          {/* Quick Select Personas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold uppercase tracking-wider ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Or Quick Switch to Sample Personas
              </span>
              <span className="text-[11px] text-purple-600 font-medium">Distinct Behavior Sets</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {samplePersonas.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => handleApplyUser(persona.id, `${persona.id}@retailrocket.ai`)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all group ${
                    isLight 
                      ? 'bg-slate-50 hover:bg-white border-slate-200 hover:border-purple-300 hover:shadow-md' 
                      : 'bg-[#060e22] hover:bg-purple-950/30 border-purple-500/20 hover:border-purple-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between w-full mb-2">
                    <span className="text-xl p-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                      {persona.icon}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-semibold">
                      #{persona.id.substring(0, 12)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-purple-600 transition-colors">
                      {persona.name}
                    </h4>
                    <p className={`text-[11px] line-clamp-2 mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {persona.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Database Persistence Assurance */}
          <div className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#060e22] border-purple-500/20 text-slate-300'
          }`}>
            <Database className="w-4 h-4 text-cyan-600 shrink-0" />
            <span>
              Every user ID is stored in Supabase with isolated behavior streams, cart items, preference weights, and personalized recommendations.
            </span>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 text-xs font-medium text-center animate-pulse">
              {statusMessage}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
