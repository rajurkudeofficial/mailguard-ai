import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-navy-950 overflow-hidden text-slate-300 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[url('/src/assets/react.svg')] bg-fixed bg-no-repeat bg-center" style={{ backgroundImage: 'var(--tw-gradient-stops)' }}>
        {/* We use a subtle grid pattern overlay for the cyber feel */}
        <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none" />
        <div className="absolute inset-0 bg-hero-gradient pointer-events-none" />
        
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
