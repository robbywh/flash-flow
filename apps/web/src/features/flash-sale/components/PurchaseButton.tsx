import { ShoppingBag, Loader2 } from 'lucide-react';

interface PurchaseButtonProps {
    userId: string;
    disabled: boolean;
    loading: boolean;
    saleStatus: 'upcoming' | 'active' | 'ended' | null;
    onPurchase: () => void;
}

export function PurchaseButton({
    userId,
    disabled,
    loading,
    saleStatus,
    onPurchase,
}: PurchaseButtonProps) {
    const isActive = saleStatus === 'active';
    const isUserIdValid = userId.trim().length >= 3;
    const canPurchase = isActive && !disabled && isUserIdValid;

    const getStatusLabel = () => {
        if (loading) return 'Processing...';
        if (saleStatus === 'upcoming') return 'Sale Not Started';
        if (saleStatus === 'ended') return 'Sale Ended';
        return 'Buy Now';
    };

    const label = getStatusLabel();

    return (
        <button
            onClick={onPurchase}
            disabled={!canPurchase || loading}
            className={`
                w-full group relative flex items-center justify-center gap-3
                px-8 py-5 rounded-2xl font-black uppercase tracking-widest
                transition-all duration-500 transform overflow-hidden
                ${canPurchase && !loading
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/20 hover:shadow-cyan-400/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer glow-cyan animate-in fade-in zoom-in-95'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                }
            `}
        >
            {/* Animated background shimmer for active state */}
            {canPurchase && !loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            )}

            {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
                <ShoppingBag className={`w-6 h-6 transition-transform duration-300 ${canPurchase ? 'animate-bounce group-hover:scale-110' : ''}`} />
            )}

            <span className="text-xl md:text-2xl transition-all duration-300 z-10 group-hover:tracking-[0.1em]">
                {label}
            </span>

            {canPurchase && !loading && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20" />
            )}
        </button>
    );
}
