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
        w-full max-w-md mx-auto flex items-center justify-center gap-3
        px-8 py-4 rounded-xl font-bold text-lg
        transition-all duration-300 transform
        ${canPurchase && !loading
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }
      `}
        >
            {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
                <ShoppingBag className="w-6 h-6" />
            )}
            {buttonLabel()}
        </button>
    );
}
