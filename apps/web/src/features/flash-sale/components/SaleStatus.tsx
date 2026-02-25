import type { FlashSaleData } from '../types/flash-sale.types';
import { Zap, Clock, Package, XCircle, Timer } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SaleStatusProps {
    sale: FlashSaleData | null;
    loading: boolean;
}

export function SaleStatus({ sale, loading }: SaleStatusProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!sale) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const target = sale.status === 'upcoming'
                ? new Date(sale.startTime).getTime()
                : new Date(sale.endTime).getTime();

            const distance = target - now;

            if (distance < 0) {
                setTimeLeft('00:00:00');
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [sale]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-cyan-400 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!sale) return null;

    const statusConfig = {
        upcoming: {
            label: 'Coming Soon',
            color: 'text-amber-400',
            bgColor: 'bg-amber-400/10 border-amber-400/20',
            icon: <Clock className="w-5 h-5" />,
            timerLabel: 'Starts in',
        },
        active: {
            label: 'LIVE NOW',
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-400/10 border-cyan-400/20 glow-cyan',
            icon: <Zap className="w-5 h-5 fill-cyan-400" />,
            timerLabel: 'Ends in',
        },
        ended: {
            label: 'Sale Ended',
            color: 'text-slate-500',
            bgColor: 'bg-slate-500/10 border-slate-500/20',
            icon: <XCircle className="w-5 h-5" />,
            timerLabel: null,
        },
    };

    const config = statusConfig[sale.status];
    const stockPercentage = (sale.remainingStock / sale.totalStock) * 100;

    return (
        <div className="flex flex-col h-full space-y-6 md:space-y-10">
            {/* Header Section: Status, Timer, info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                {/* Status Badge */}
                <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Current Status</p>
                    <div
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${config.bgColor} ${config.color} font-bold text-xs tracking-widest uppercase transition-all duration-300 w-fit`}
                    >
                        {config.icon}
                        {config.label}
                        {sale.status === 'active' && (
                            <span className="relative flex h-2 w-2 ml-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                            </span>
                        )}
                    </div>
                </div>

                {/* Live Timer */}
                {config.timerLabel && (
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">{config.timerLabel}</p>
                        <div className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/50 px-4 py-2 rounded-xl w-fit">
                            <Timer className="w-4 h-4 text-cyan-400/70" />
                            <span className="text-xl font-mono font-black text-white tracking-wider leading-none">
                                {timeLeft}
                            </span>
                        </div>
                    </div>
                )}

                {/* Duration Info */}
                <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-1">Flash Window</p>
                    <div className="flex items-center gap-3 bg-slate-800/20 border border-slate-700/30 px-4 py-2 rounded-xl w-fit">
                        <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-xs text-slate-300 font-bold whitespace-nowrap">
                            {new Date(sale.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' '}-{' '}
                            {new Date(sale.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Product Info - Main Body */}
            <div className="flex-grow flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-cyan-500/80 text-[10px] font-bold uppercase tracking-[0.3em]">
                        <Package className="w-3.5 h-3.5" />
                        <span>Exclusive Micro-Drop</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter">
                        {sale.productName}
                    </h2>
                </div>
                <p className="text-slate-400 text-base md:text-lg max-w-md leading-relaxed">
                    Premium high-performance equipment designed for the elite. Available only during this exclusive flash window.
                </p>
            </div>

            {/* Bottom Section: Stock Management */}
            <div className="space-y-4 pt-6 border-t border-slate-800/50">
                <div className="flex justify-between items-end px-1">
                    <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Inventory Status</p>
                        <p className="text-2xl font-black text-white tracking-tighter">
                            {sale.remainingStock} <span className="text-slate-600 text-lg font-medium">/ {sale.totalStock}</span>
                        </p>
                    </div>
                    <p className={`text-xs font-black uppercase tracking-widest transition-all duration-300 transform ${stockPercentage < 20 ? 'text-rose-500 scale-110' : 'text-cyan-500'}`}>
                        {Math.round(stockPercentage)}% Available
                    </p>
                </div>

                <div className="relative h-3 bg-slate-900/80 rounded-full overflow-hidden border border-slate-800/50">
                    <div className={`absolute inset-0 opacity-20 blur-sm animate-pulse-glow ${stockPercentage > 50 ? 'bg-cyan-500' : stockPercentage > 20 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />

                    <div
                        className={`h-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(6,182,212,0.3)] ${stockPercentage > 50
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            : stockPercentage > 20
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                : 'bg-gradient-to-r from-rose-500 to-red-600'
                            }`}
                        style={{ width: `${stockPercentage}%` }}
                    >
                        {sale.status === 'active' && stockPercentage > 0 && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
