import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, AlertTriangle, Shield, Loader2, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { fetchApi } from '../lib/api';
import type { DashboardStats } from '../types';
import clsx from 'clsx';

export const Dashboard: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => fetchApi('/dashboard'),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyber animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <AlertTriangle className="w-12 h-12 text-threat-high mb-4" />
        <h2 className="text-xl font-medium text-white mb-2">Failed to load dashboard</h2>
        <p className="mb-4 text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
        <button onClick={() => refetch()} className="btn-secondary flex items-center space-x-2">
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { stats, recentThreats } = data;

  const pieData = Object.entries(stats.byClassification).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = {
    SAFE: '#10b981',
    SPAM: '#f59e0b',
    PHISHING: '#dc2626',
    PROMOTIONAL: '#6366f1',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-400">Security analysis of your inbox</p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary p-2 group">
          <RefreshCw className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard
          title="Emails Analyzed"
          value={stats.totalEmails.toLocaleString()}
          icon={Mail}
          trend="+12% from last week"
          color="blue"
        />
        <KpiCard
          title="Threats Detected"
          value={stats.threats.toLocaleString()}
          icon={AlertTriangle}
          trend={stats.threats > 0 ? "Requires attention" : "All clear"}
          color={stats.threats > 0 ? "red" : "green"}
        />
        <KpiCard
          title="Avg Security Score"
          value={`${stats.avgSecurityScore}/100`}
          icon={Shield}
          trend="Score based on AI analysis"
          color={stats.avgSecurityScore > 80 ? "green" : "orange"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 lg:col-span-1">
          <h3 className="text-lg font-medium text-white mb-6">Classification</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name as keyof typeof COLORS] || '#9ca3af'} 
                      className="transition-all duration-300 hover:opacity-80 outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0e1a', borderColor: '#1f2937', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Recent Threats</h3>
            <span className="text-xs px-2 py-1 bg-threat-high/10 text-threat-high border border-threat-high/20 rounded font-medium">
              High Priority
            </span>
          </div>
          
          <div className="flex-1 overflow-auto -mx-6 px-6">
            {recentThreats.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-navy-900/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg font-medium">Sender</th>
                    <th className="px-4 py-3 font-medium">Subject</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 rounded-tr-lg font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {recentThreats.map((threat) => (
                    <tr key={threat.id} className="hover:bg-navy-800/30 transition-colors group cursor-pointer">
                      <td className="px-4 py-3 text-slate-300 truncate max-w-[150px]">{threat.sender}</td>
                      <td className="px-4 py-3 text-white font-medium truncate max-w-[200px]">{threat.subject}</td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          "px-2 py-1 rounded text-xs font-medium border",
                          threat.securityScore < 30 ? "bg-threat-critical/10 text-threat-critical border-threat-critical/20" :
                          threat.securityScore < 50 ? "bg-threat-high/10 text-threat-high border-threat-high/20" :
                          "bg-threat-medium/10 text-threat-medium border-threat-medium/20"
                        )}>
                          {threat.securityScore}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500 whitespace-nowrap">
                        {new Date(threat.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Shield className="w-12 h-12 text-threat-safe mb-3 opacity-50" />
                <p>No recent threats detected</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component
function KpiCard({ title, value, icon: Icon, trend, color }: { title: string, value: string, icon: React.ElementType, trend: string, color: 'blue' | 'green' | 'red' | 'orange' }) {
  const colors = {
    blue: 'text-cyber bg-cyber/10 shadow-[inset_0_0_20px_rgba(0,212,255,0.1)] border-cyber/20',
    green: 'text-threat-safe bg-threat-safe/10 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)] border-threat-safe/20',
    red: 'text-threat-high bg-threat-high/10 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)] border-threat-high/20',
    orange: 'text-threat-medium bg-threat-medium/10 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)] border-threat-medium/20',
  };

  const iconColors = {
    blue: 'text-cyber',
    green: 'text-threat-safe',
    red: 'text-threat-high',
    orange: 'text-threat-medium',
  };

  return (
    <div className={clsx("glass-panel p-6 border relative overflow-hidden group", colors[color])}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-110" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h2 className="text-3xl font-bold text-white tracking-tight">{value}</h2>
        </div>
        <div className={clsx("p-3 rounded-xl bg-navy-950/50 backdrop-blur border border-white/5", iconColors[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="relative z-10">
        <span className="text-xs font-medium text-slate-500 bg-navy-950/50 px-2 py-1 rounded-md">{trend}</span>
      </div>
    </div>
  );
}
