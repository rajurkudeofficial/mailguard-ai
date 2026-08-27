import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, ShieldCheck, Settings, Mail } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/inbox', label: 'Gmail Investigation', icon: Mail },
  { path: '/threats', label: 'Threats', icon: AlertTriangle },
  { path: '/trusted', label: 'Trusted Senders', icon: ShieldCheck },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 flex-shrink-0 bg-navy-950 border-r border-navy-800 flex flex-col h-full relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-purple-glow opacity-30 blur-3xl pointer-events-none" />

      <div className="p-6 relative z-10 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber to-purple flex items-center justify-center shadow-cyber">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          MailGuard AI
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 relative z-10">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-navy-800 text-white shadow-glass'
                  : 'text-slate-400 hover:bg-navy-800/50 hover:text-slate-200'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-cyber rounded-r-md shadow-cyber" />
                )}
                <item.icon
                  className={clsx(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-cyber' : 'group-hover:text-cyber-dim'
                  )}
                />
                <span className="font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 relative z-10 text-xs text-slate-500 font-mono">
        v1.0.0
      </div>
    </aside>
  );
};
