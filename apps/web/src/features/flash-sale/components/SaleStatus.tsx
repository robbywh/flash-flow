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
            bgColor: 'bg-amber-400/10 border-amber-400/30',
            icon: <Clock className="w-6 h-6" />,
        },
        active: {
            label: 'LIVE NOW',
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-400/10 border-emerald-400/30',
            icon: <Zap className="w-6 h-6" />,
        },
        ended: {
            label: 'Sale Ended',
            color: 'text-gray-400',
            bgColor: 'bg-gray-400/10 border-gray-400/30',
            icon: <XCircle className="w-6 h-6" />,
        },
    };

    const config = statusConfig[sale.status];
    const stockPercentage = (sale.remainingStock / sale.totalStock) * 100;

    return (
        <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-center">
                <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${config.bgColor} ${config.color} font-semibold text-sm tracking-wide`}
                >
                    {config.icon}
                    {config.label}
                    {sale.status === 'active' && (
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                        </span>
                    )}
                </div>
            </div>

            {/* Product Info */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                    <Package className="w-4 h-4" />
                    <span>Limited Edition</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                    {sale.productName}
                </h2>
            </div>

            {/* Stock Bar */}
            <div className="space-y-2 max-w-md mx-auto">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Stock remaining</span>
                    <span className="text-white font-semibold">
                        {sale.remainingStock} / {sale.totalStock}
                    </span>
                </div>
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${stockPercentage > 50
                                ? 'bg-emerald-500'
                                : stockPercentage > 20
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                            }`}
                        style={{ width: `${stockPercentage}%` }}
                    />
                </div>
            </div>

            {/* Time Info */}
            <div className="flex justify-center gap-6 text-sm text-gray-400">
                <div>
                    <span className="text-gray-500">Starts: </span>
                    {new Date(sale.startTime).toLocaleString()}
                </div>
                <div>
                    <span className="text-gray-500">Ends: </span>
                    {new Date(sale.endTime).toLocaleString()}
                </div>
            </div>
        </div>
    );
}
