import type { FlashSaleData } from '../types/flash-sale.types';
import { Zap, Clock, Package, XCircle } from 'lucide-react';

interface SaleStatusProps {
    sale: FlashSaleData | null;
    loading: boolean;
    error: string | null;
}

export function SaleStatus({ sale, loading, error }: SaleStatusProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-cyan-400 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-red-300 text-lg">{error}</p>
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
        },
        active: {
            label: 'LIVE NOW',
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-400/10 border-cyan-400/20 glow-cyan',
            icon: <Zap className="w-5 h-5 fill-cyan-400" />,
        },
        ended: {
            label: 'Sale Ended',
            color: 'text-slate-500',
            bgColor: 'bg-slate-500/10 border-slate-500/20',
            icon: <XCircle className="w-5 h-5" />,
        },
    };

    const config = statusConfig[sale.status];
    const stockPercentage = (sale.remainingStock / sale.totalStock) * 100;

    return (
        <div className="space-y-10">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
                <div
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border ${config.bgColor} ${config.color} font-bold text-sm tracking-widest uppercase transition-all duration-300`}
                >
                    {config.icon}
                    {config.label}
                    {sale.status === 'active' && (
                        <span className="relative flex h-3 w-3 ml-1">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                        </span>
                    )}
                </div>

                <div className="text-right hidden md:block">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter mb-1">Duration</p>
                    <p className="text-sm text-slate-300 font-medium">
                        {new Date(sale.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' '}-{' '}
                        {new Date(sale.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
            </div>

            {/* Product Info */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-cyan-500/80 text-xs font-bold uppercase tracking-[0.2em]">
                    <Package className="w-4 h-4" />
                    <span>Exclusive Drop</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                    {sale.productName}
                </h2>
                <p className="text-slate-400 text-lg max-w-md">
                    Premium high-performance equipment designed for the elite. Available only during this flash window.
                </p>
            </div>

            {/* Stock Bar */}
            <div className="space-y-5">
                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Availability</p>
                        <span className="text-2xl font-black text-white">
                            {sale.remainingStock} <span className="text-slate-600 text-lg font-medium">/ {sale.totalStock}</span>
                        </span>
                    </div>
                    <div className="text-right">
                        <span className={`text-sm font-bold ${stockPercentage > 50 ? 'text-cyan-400' : stockPercentage > 20 ? 'text-amber-400' : 'text-rose-500'
                            }`}>
                            {Math.round(stockPercentage)}% LEFT
                        </span>
                    </div>
                </div>
                <div className="h-4 bg-slate-800/50 rounded-full overflow-hidden p-1 border border-slate-700/50">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out relative ${stockPercentage > 50
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                                : stockPercentage > 20
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                    : 'bg-gradient-to-r from-rose-500 to-red-600'
                            }`}
                        style={{ width: `${stockPercentage}%` }}
                    >
                        {sale.status === 'active' && stockPercentage > 0 && (
                            <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Time Info */}
            <div className="md:hidden pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Starts: {new Date(sale.startTime).toLocaleString()}</span>
                    <span>Ends: {new Date(sale.endTime).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}
