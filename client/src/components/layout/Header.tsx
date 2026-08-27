import React from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const { user, logout, isDemo } = useAuth();

  return (
    <header className="h-16 bg-navy-950/80 backdrop-blur-md border-b border-navy-800 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center text-sm text-slate-400 font-mono">
        <span className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-cyber mr-2 animate-pulse-cyber" />
          SYSTEM ONLINE
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {isDemo && (
          <span className="px-3 py-1 rounded-full bg-threat-medium/20 text-threat-medium text-xs font-bold border border-threat-medium/30">
            DEMO MODE
          </span>
        )}
        
        <div className="flex items-center space-x-3 pl-4 border-l border-navy-800">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-slate-200">{user?.name || 'Unknown User'}</span>
            <span className="text-xs text-slate-500">{user?.email || 'user@example.com'}</span>
          </div>
          <div className="w-9 h-9 rounded-full overflow-hidden bg-navy-800 border border-navy-700">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <UserIcon size={18} />
              </div>
            )}
          </div>
          <button 
            onClick={() => logout()}
            className="p-2 text-slate-400 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
