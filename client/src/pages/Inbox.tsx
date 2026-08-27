import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Mail,
    RefreshCw,
    Loader2,
    ShieldAlert,
    ShieldCheck,
    Search,
} from 'lucide-react';
import { fetchApi } from '../lib/api';

interface GmailMessage {
    id: string;
    threadId: string;
    snippet?: string;
    subject?: string;
    from?: string;
    date?: string;
    receivedAt: string;
}

interface GmailMessagesResponse {
    messages: GmailMessage[];
    nextPageToken?: string;
    total: number;
}

export const Inbox: React.FC = () => {
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery<GmailMessagesResponse>({
        queryKey: ['gmail-messages'],
        queryFn: () => fetchApi('/gmail/messages?maxResults=20'),
    });

    const analyzeMutation = useMutation({
        mutationFn: (messageId: string) =>
            fetchApi(`/analyze/email/${messageId}`, {
                method: 'POST',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyber animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <ShieldAlert className="w-12 h-12 text-threat-high mb-4" />
                <h2 className="text-xl font-medium text-white mb-2">
                    Failed to load Gmail
                </h2>
                <p className="text-sm mb-4">
                    {error instanceof Error ? error.message : 'Unable to fetch Gmail messages'}
                </p>

                <button
                    onClick={() => refetch()}
                    className="btn-secondary flex items-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                </button>
            </div>
        );
    }

    const messages = data?.messages ?? [];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        Gmail Investigation
                    </h1>
                    <p className="text-sm text-slate-400">
                        Fetch and analyze emails from your Gmail inbox
                    </p>
                </div>

                <button
                    onClick={() => refetch()}
                    className="btn-secondary p-2"
                    title="Refresh Gmail"
                >
                    <RefreshCw className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Search / info */}
            <div className="glass-panel p-4 flex items-center gap-3">
                <Search className="w-5 h-5 text-cyber" />
                <span className="text-sm text-slate-300">
                    {data?.total ?? 0} Gmail messages available
                </span>
            </div>

            {/* Emails */}
            <div className="glass-panel overflow-hidden">
                {messages.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No Gmail messages found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-navy-800">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className="p-5 hover:bg-navy-800/30 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-6">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Mail className="w-5 h-5 text-cyber shrink-0" />

                                            <h3 className="text-white font-medium truncate">
                                                {message.subject || '(No Subject)'}
                                            </h3>
                                        </div>

                                        <p className="text-sm text-slate-300 truncate">
                                            From: {message.from || 'Unknown sender'}
                                        </p>

                                        <p className="text-sm text-slate-500 mt-1">
                                            {message.receivedAt
                                                ? new Date(message.receivedAt).toLocaleString()
                                                : message.date}
                                        </p>

                                        <p className="text-sm text-slate-400 mt-3 line-clamp-2">
                                            {message.snippet || 'No preview available'}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => analyzeMutation.mutate(message.id)}
                                        disabled={analyzeMutation.isPending}
                                        className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                                    >
                                        {analyzeMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="w-4 h-4" />
                                        )}

                                        Analyze
                                    </button>
                                </div>

                                {analyzeMutation.isSuccess &&
                                    analyzeMutation.variables === message.id && (
                                        <div className="mt-4 p-3 rounded-lg bg-threat-safe/10 border border-threat-safe/20 text-threat-safe text-sm">
                                            Email analyzed successfully. Check the Dashboard for the result.
                                        </div>
                                    )}

                                {analyzeMutation.isError &&
                                    analyzeMutation.variables === message.id && (
                                        <div className="mt-4 p-3 rounded-lg bg-threat-high/10 border border-threat-high/20 text-threat-high text-sm">
                                            Analysis failed. Check the backend terminal for details.
                                        </div>
                                    )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};