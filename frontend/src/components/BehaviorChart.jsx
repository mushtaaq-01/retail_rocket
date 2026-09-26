import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';

export default function BehaviorChart({ userHistory, theme }) {
  const isLight = theme === 'light';

  return (
    <div className={`border rounded-2xl p-5 shadow-md flex flex-col justify-between h-full transition-colors ${
      isLight
        ? 'bg-white border-slate-200'
        : 'bg-[#0a1630]/80 backdrop-blur-xl border-purple-500/20 shadow-xl'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-sm font-bold font-['Outfit'] ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Your Shopping Behavior
          </h3>
          <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Interaction timeline over recent days
          </p>
        </div>

        {/* Legend */}
        {userHistory && userHistory.length > 0 && (
          <div className="flex items-center gap-3 text-[10px] font-medium">
            <span className={`flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Views
            </span>
            <span className={`flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <span className="w-2 h-2 rounded-full bg-purple-600"></span> Add to Cart
            </span>
            <span className={`flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Transactions
            </span>
          </div>
        )}
      </div>

      <div className="w-full h-48 pt-2 flex items-center justify-center">
        {!userHistory || userHistory.length === 0 ? (
          <div className="text-center space-y-1 text-slate-400">
            <Activity className="w-8 h-8 mx-auto text-slate-500 opacity-50" />
            <p className="text-xs font-medium">Interaction history unavailable</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={userHistory} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} opacity={0.7} />
              <XAxis dataKey="date" stroke={isLight ? '#64748b' : '#94a3b8'} tick={{ fontSize: 10 }} />
              <YAxis stroke={isLight ? '#64748b' : '#94a3b8'} tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isLight ? '#ffffff' : '#061126',
                  borderColor: isLight ? '#cbd5e1' : 'rgba(124, 58, 237, 0.3)',
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  color: isLight ? '#0f172a' : '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Line type="monotone" dataKey="views" stroke="#06b6d4" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="add_to_cart" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="transactions" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
