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
            <div className="glass-dark border-emerald-500/20 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-8 zoom-in-95 duration-700">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-bounce">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-emerald-400 tracking-tight mb-2">
                            Order Secured!
                        </h3>
                        <p className="text-emerald-100/70 text-base leading-relaxed">{message}</p>
                    </div>
                    {purchaseId && (
                        <div className="w-full pt-4 border-t border-emerald-500/10 mt-2">
                            <p className="text-emerald-500/40 text-xs font-bold uppercase tracking-widest mb-1">
                                Confirmation Pointer
                            </p>
                            <p className="text-emerald-100/90 font-mono text-sm break-all bg-emerald-500/5 py-2 px-3 rounded-lg border border-emerald-500/10">
                                {purchaseId}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="glass-dark border-rose-500/20 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20">
                    <AlertTriangle className="w-12 h-12 text-rose-400" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-rose-400 tracking-tight mb-2">
                        Action Failed
                    </h3>
                    <p className="text-rose-100/70 text-base leading-relaxed">{message}</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-rose-400/60 hover:text-rose-400 text-sm font-bold uppercase tracking-widest transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
