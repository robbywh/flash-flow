import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface PurchaseResultProps {
    success: boolean | null;
    message: string | null;
    purchaseId?: string;
}

export function PurchaseResult({
    success,
    message,
    purchaseId,
}: PurchaseResultProps) {
    if (success === null || message === null) return null;

    if (success) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    <h3 className="text-xl font-bold text-emerald-300">
                        Purchase Confirmed!
                    </h3>
                </div>
                <p className="text-emerald-200/80 text-sm">{message}</p>
                {purchaseId && (
                    <p className="text-emerald-200/50 text-xs mt-2 font-mono">
                        Order ID: {purchaseId}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
                <h3 className="text-xl font-bold text-red-300">Purchase Failed</h3>
            </div>
            <p className="text-red-200/80 text-sm">{message}</p>
        </div>
    );
}
