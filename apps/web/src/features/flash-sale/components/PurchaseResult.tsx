import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface PurchaseResultProps {
    success: boolean | null;
    message: string | null;
    purchaseId?: string;
    onRetry?: () => void;
}

export function PurchaseResult({
    success,
    message,
    purchaseId,
    onRetry,
}: PurchaseResultProps) {
    if (success === null || message === null) return null;

    if (success) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
                    onClick={onRetry}
                />

                {/* Modal Content */}
                <div className="relative glass-dark border-emerald-500/30 rounded-[2.5rem] p-10 md:p-12 w-full max-w-xl shadow-[0_0_100px_rgba(16,185,129,0.15)] animate-in zoom-in-95 slide-in-from-bottom-12 duration-500">
                    <div className="flex flex-col items-center text-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                            <div className="relative p-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 animate-bounce">
                                <CheckCircle2 className="w-16 h-16 text-emerald-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                                Order Secured!
                            </h3>
                            <p className="text-emerald-100/70 text-lg leading-relaxed">
                                {message.split('!')[0]}!
                            </p>
                        </div>

                        {purchaseId && (
                            <div className="w-full pt-6 border-t border-emerald-500/10">
                                <p className="text-emerald-500/40 text-[10px] font-black uppercase tracking-[0.3em] mb-2">
                                    Transaction ID
                                </p>
                                <p className="text-emerald-100/90 font-mono text-sm break-all bg-emerald-500/5 py-3 px-4 rounded-xl border border-emerald-500/10">
                                    {purchaseId}
                                </p>
                            </div>
                        )}

                        <div className="w-full mt-4">
                            <button
                                onClick={onRetry}
                                className="w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest hover:bg-emerald-500 shadow-xl shadow-emerald-600/20 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state remains inline as a dedicated section in the control column
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

                <div className="w-full mt-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-rose-500/10 text-rose-400 font-bold hover:bg-rose-500/20 transition-all border border-rose-500/20"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );
}
