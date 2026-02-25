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
    const canPurchase = isActive && !disabled && userId.trim().length >= 3;

    const buttonLabel = () => {
        if (loading) return 'Processing...';
        if (saleStatus === 'upcoming') return 'Sale Not Started';
        if (saleStatus === 'ended') return 'Sale Ended';
        if (!userId.trim()) return 'Enter your User ID';
        if (userId.trim().length < 3) return 'User ID too short';
        return 'Buy Now';
    };

    return (
        <button
            onClick={onPurchase}
            disabled={!canPurchase || loading}
            className={`
        w-full flex items-center justify-center gap-3
        px-8 py-5 rounded-2xl font-black text-lg uppercase tracking-widest
        transition-all duration-300 transform relative overflow-hidden
        ${canPurchase && !loading
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer glow-cyan'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                }
      `}
        >
            {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
                <ShoppingBag className={`w-6 h-6 ${canPurchase ? 'animate-pulse' : ''}`} />
            )}

            <span className="relative z-10">{buttonLabel()}</span>

            {canPurchase && !loading && (
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20" />
            )}
        </button>
    );
}
