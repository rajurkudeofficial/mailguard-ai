import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import type { Email } from '../types';
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

interface ThreatsResponse {
  threats: Email[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const Threats: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<ThreatsResponse>({
    queryKey: ['threats', page],
    queryFn: () => fetchApi(`/threats?page=${page}&limit=10`),
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
        <h2 className="text-xl font-medium text-white mb-2">Failed to load threats</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Active Threats</h1>
          <p className="text-sm text-slate-400">High and Critical risk emails needing review</p>
        </div>
      </div>

      <div className="space-y-4">
        {data.threats.length === 0 ? (
          <div className="glass-panel p-12 flex flex-col items-center justify-center text-slate-400">
            <ShieldAlert className="w-16 h-16 text-threat-safe mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-white mb-2">No active threats</h3>
            <p>Your inbox is currently clear of high-risk items.</p>
          </div>
        ) : (
          data.threats.map((threat) => <ThreatCard key={threat.id} threat={threat} />)
        )}
      </div>

      {data.totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="flex items-center px-4 text-slate-400">
            Page {page} of {data.totalPages}
          </span>
          <button
            disabled={page === data.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

function ThreatCard({ threat }: { threat: Email }) {
  const [expanded, setExpanded] = useState(false);
  const isCritical = threat.riskLevel === 'CRITICAL';

  return (
    <div className={clsx(
      "glass-panel overflow-hidden transition-all duration-200 border-l-4",
      isCritical ? "border-l-threat-critical" : "border-l-threat-high"
    )}>
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-4 flex-1 overflow-hidden">
          <div className={clsx(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            isCritical ? "bg-threat-critical/20 text-threat-critical" : "bg-threat-high/20 text-threat-high"
          )}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className={clsx(
                "px-2 py-0.5 rounded text-xs font-bold border",
                isCritical ? "bg-threat-critical/10 text-threat-critical border-threat-critical/20" : "bg-threat-high/10 text-threat-high border-threat-high/20"
              )}>
                {threat.classification}
              </span>
              <span className="text-sm font-medium text-slate-300 truncate">{threat.sender}</span>
            </div>
            <h4 className="text-white font-medium truncate">{threat.subject}</h4>
          </div>
        </div>
        
        <div className="flex items-center space-x-6 ml-4">
          <div className="text-right hidden md:block">
            <div className="text-xs text-slate-500 mb-1">Security Score</div>
            <div className={clsx(
              "font-mono font-bold text-lg",
              isCritical ? "text-threat-critical" : "text-threat-high"
            )}>
              {threat.securityScore}/100
            </div>
          </div>
          <button className="text-slate-400 hover:text-white">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 bg-navy-950/50 border-t border-navy-800 animate-slide-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Snippet</h5>
              <p className="text-sm text-slate-300 bg-navy-900 p-3 rounded border border-navy-700">
                {threat.snippet}
              </p>
              
              <div className="mt-4">
                <h5 className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Metadata</h5>
                <div className="text-xs font-mono text-slate-400 space-y-1">
                  <p>Received: {new Date(threat.receivedAt).toLocaleString()}</p>
                  <p>Analyzed: {new Date(threat.analyzedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            {threat.analysis && (
              <div>
                <h5 className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">AI Evidence</h5>
                <p className="text-sm text-slate-300 bg-navy-900 p-3 rounded border border-navy-700 mb-4 whitespace-pre-wrap">
                  {threat.analysis.evidence}
                </p>
                
                <h5 className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Auth Checks</h5>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge label="SPF" value={threat.analysis.spfResult} />
                  <Badge label="DKIM" value={threat.analysis.dkimResult} />
                  <Badge label="DMARC" value={threat.analysis.dmarcResult} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ label, value }: { label: string, value: string }) {
  const isPass = value.toLowerCase() === 'pass';
  return (
    <span className={clsx(
      "px-2 py-1 rounded border font-mono",
      isPass ? "bg-threat-safe/10 text-threat-safe border-threat-safe/20" : "bg-threat-high/10 text-threat-high border-threat-high/20"
    )}>
      {label}: {value}
    </span>
  );
}
