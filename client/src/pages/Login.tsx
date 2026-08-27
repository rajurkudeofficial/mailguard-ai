import React from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { user, login } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md p-8 glass-panel animate-slide-up">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber to-purple flex items-center justify-center shadow-cyber-lg mb-6">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">MailGuard AI</h1>
          <p className="text-slate-400">Advanced Gmail Spam & Phishing Investigation</p>
        </div>

        <div className="space-y-6">
          <button
            onClick={login}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3 bg-white text-navy-950 rounded-xl font-bold transition-all hover:bg-slate-100 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Sign in with Google</span>
          </button>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
            <Mail className="w-4 h-4" />
            <span>Secure read-only access to your inbox</span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-center text-sm text-slate-500 font-mono">
        <p>MailGuard AI Core v1.0</p>
        <p>SYSTEM STATUS: <span className="text-cyber">ONLINE</span></p>
      </div>
    </div>
  );
};
