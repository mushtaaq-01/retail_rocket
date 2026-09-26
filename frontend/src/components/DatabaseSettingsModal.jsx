import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  Key,
  Globe,
  RefreshCw,
  Copy,
  Check,
  Server,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseConfig,
  updateSupabaseCredentials,
  testSupabaseConnection
} from '../services/supabaseClient';

export default function DatabaseSettingsModal({ isOpen, onClose, theme = 'light' }) {
  const isLight = theme === 'light';
  const [activeSubTab, setActiveSubTab] = useState('config'); // 'config' | 'schema' | 'tables'
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [status, setStatus] = useState({ connected: false, configured: false, message: '' });
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(localStorage.getItem('rr_supabase_url') || cfg.url || 'https://fkoenadkhgevcrycfhan.supabase.co');
      setKey(localStorage.getItem('rr_supabase_key') || 'sb_publishable_iqk-JN3bl1ajtXdJDL2qbA_AaWUwDHb');
      setApiUrl(localStorage.getItem('rr_api_url') || import.meta.env?.VITE_API_URL || '');
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    setTesting(true);
    const result = await testSupabaseConnection();
    setStatus(result);
    setTesting(false);
  };

  const handleSaveAndConnect = async (e) => {
    e.preventDefault();
    setTesting(true);
    updateSupabaseCredentials(url, key);

    if (apiUrl && apiUrl.trim()) {
      localStorage.setItem('rr_api_url', apiUrl.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('rr_api_url');
    }

    // Also inform backend if reachable
    try {
      const targetApi = apiUrl ? apiUrl.trim().replace(/\/+$/, '') : 'http://127.0.0.1:8088';
      await fetch(`${targetApi}/db/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, key })
      });
    } catch {
      // ignore
    }

    const res = await testSupabaseConnection();
    setStatus(res);
    setTesting(false);
  };

  const handleCopySql = () => {
    const sqlText = `-- Supabase Schema for RetailRocket AI
-- 1. Profiles & Products
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT UNIQUE NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT DEFAULT 'RetailBrand',
    price TEXT NOT NULL,
    numeric_price NUMERIC(12, 2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Interactions & Cart
CREATE TABLE IF NOT EXISTS public.product_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    product_id TEXT,
    interaction_type TEXT NOT NULL,
    session_id TEXT,
    category TEXT,
    brand TEXT,
    price_at_interaction NUMERIC(12, 2),
    quantity INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    price_at_addition NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Preferences & Recommendations
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    preferred_min_price NUMERIC(12, 2) DEFAULT 0.00,
    preferred_max_price NUMERIC(12, 2),
    preferred_price_average NUMERIC(12, 2),
    top_category TEXT,
    top_brand TEXT,
    preferred_categories JSONB DEFAULT '[]'::jsonb,
    preferred_brands JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    ranking_score NUMERIC(10, 6) NOT NULL,
    ml_score NUMERIC(10, 6) DEFAULT 0.0,
    price_match_score NUMERIC(10, 6) DEFAULT 0.0,
    category_score NUMERIC(10, 6) DEFAULT 0.0,
    brand_score NUMERIC(10, 6) DEFAULT 0.0,
    interaction_score NUMERIC(10, 6) DEFAULT 0.0,
    cart_score NUMERIC(10, 6) DEFAULT 0.0,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);`;

    navigator.clipboard.writeText(sqlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`px-6 py-5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800/80 bg-slate-950/40'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base font-['Outfit'] flex items-center gap-2">
                Supabase Database Connection
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  status.connected
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                }`}>
                  {status.connected ? 'Connected' : 'Local Fallback Mode'}
                </span>
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Connect PostgreSQL for persistent behavior tracking, cart sync, and preference storage
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs */}
        <div className={`px-6 pt-3 flex gap-2 border-b text-xs font-semibold ${
          isLight ? 'border-slate-100' : 'border-slate-800'
        }`}>
          <button
            onClick={() => setActiveSubTab('config')}
            className={`pb-2.5 px-2 border-b-2 transition-all ${
              activeSubTab === 'config'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Connection Settings
          </button>
          <button
            onClick={() => setActiveSubTab('schema')}
            className={`pb-2.5 px-2 border-b-2 transition-all ${
              activeSubTab === 'schema'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            SQL Migration Schema
          </button>
          <button
            onClick={() => setActiveSubTab('tables')}
            className={`pb-2.5 px-2 border-b-2 transition-all ${
              activeSubTab === 'tables'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Managed Entities (7)
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeSubTab === 'config' && (
            <form onSubmit={handleSaveAndConnect} className="space-y-4">
              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                status.connected
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200'
                  : 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50 text-indigo-800 dark:text-indigo-200'
              }`}>
                {status.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <Server className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <div className="font-bold">
                    {status.connected ? 'Active Database Connected' : 'Ready for Supabase Connection'}
                  </div>
                  <p className="mt-0.5 leading-relaxed opacity-90">
                    {status.message || 'Enter your Supabase Project URL and Public Anon Key below to enable persistent tracking and synchronization.'}
                  </p>
                </div>
              </div>

              {/* Supabase URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-500" />
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  placeholder="https://your-project-ref.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
                  }`}
                />
                <p className="text-[10px] text-slate-400">Found under Project Settings &gt; API in your Supabase Dashboard.</p>
              </div>

              {/* Supabase Anon Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-500" />
                  Supabase Public Anon Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
                  }`}
                />
                <p className="text-[10px] text-slate-400">The public anon key is safe for client applications with Row Level Security (RLS).</p>
              </div>

              {/* Backend API URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cyan-500" />
                  FastAPI Recommendation Backend URL
                </label>
                <input
                  type="url"
                  placeholder="https://retailrocket-backend.onrender.com (or leave empty for local auto-probe)"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-slate-100'
                  }`}
                />
                <p className="text-[10px] text-slate-400">Enter your deployed Render backend URL (e.g. https://your-app.onrender.com) so the frontend connects live.</p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={testing}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-indigo-500' : ''}`} />
                  <span>Test Connection</span>
                </button>

                <button
                  type="submit"
                  disabled={testing}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-2"
                >
                  <span>Save & Connect</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {activeSubTab === 'schema' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Run this SQL in your Supabase SQL Editor:
                </span>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <pre className={`p-4 rounded-2xl border text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                {`-- Supabase PostgreSQL Schema
-- Tables: profiles, products, product_interactions,
-- cart_items, user_preferences, recommendations, prediction_history

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT UNIQUE NOT NULL,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT DEFAULT 'RetailBrand',
    price TEXT NOT NULL,
    numeric_price NUMERIC(12, 2) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.product_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    product_id TEXT,
    interaction_type TEXT NOT NULL,
    session_id TEXT,
    category TEXT,
    brand TEXT,
    price_at_interaction NUMERIC(12, 2),
    quantity INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    price_at_addition NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    preferred_min_price NUMERIC(12, 2) DEFAULT 0.00,
    preferred_max_price NUMERIC(12, 2),
    preferred_price_average NUMERIC(12, 2),
    top_category TEXT,
    top_brand TEXT,
    preferred_categories JSONB DEFAULT '[]'::jsonb,
    preferred_brands JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    ranking_score NUMERIC(10, 6) NOT NULL,
    ml_score NUMERIC(10, 6) DEFAULT 0.0,
    price_match_score NUMERIC(10, 6) DEFAULT 0.0,
    category_score NUMERIC(10, 6) DEFAULT 0.0,
    brand_score NUMERIC(10, 6) DEFAULT 0.0,
    interaction_score NUMERIC(10, 6) DEFAULT 0.0,
    cart_score NUMERIC(10, 6) DEFAULT 0.0,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);`}
              </pre>
            </div>
          )}

          {activeSubTab === 'tables' && (
            <div className="space-y-3">
              {[
                { name: 'profiles', desc: 'User identity, visitor IDs, and authentication linking' },
                { name: 'products', desc: 'Product catalog with prices, categories, and image URLs' },
                { name: 'product_interactions', desc: 'All 8 user behavior events: views, clicks, cart additions, searches' },
                { name: 'cart_items', desc: 'Synchronized shopping cart items persisted across sessions' },
                { name: 'user_preferences', desc: 'Aggregated time-decayed behavioral metrics and price preferences' },
                { name: 'recommendations', desc: 'Personalized hybrid recommendation scores, factor breakdowns, and reasons' },
                { name: 'prediction_history', desc: 'Audit trail and model explainability records' }
              ].map((t) => (
                <div key={t.name} className={`p-3 rounded-xl border flex items-center justify-between ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-800'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <div>
                      <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        public.{t.name}
                      </div>
                      <div className="text-[11px] text-slate-500">{t.desc}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
