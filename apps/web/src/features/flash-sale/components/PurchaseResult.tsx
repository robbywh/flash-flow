import { CheckCircle2, AlertTriangle } from "lucide-react";

interface PurchaseResultProps {
  success: boolean | null;
  message: string | null;
  title?: string;
  buttonText?: string;
  purchaseId?: string;
  onRetry?: () => void;
}

export function PurchaseResult({
  success,
  message,
  title,
  buttonText,
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
                {title || "Order Secured!"}
              </h3>
              <p className="text-emerald-100/70 text-lg leading-relaxed">
                {message.split("!")[0]}!
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
                {buttonText || "Done"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state: Dedicated section in the control column with premium styling
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
        onClick={onRetry}
      />

      {/* Modal Content */}
      <div className="relative glass-dark border-rose-500/20 rounded-[2.5rem] p-8 md:p-10 w-full max-w-lg animate-in zoom-in-95 duration-500 shadow-[0_0_50px_rgba(244,63,94,0.1)]">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/10 blur-xl rounded-full" />
            <div className="relative p-5 rounded-full bg-rose-500/10 border border-rose-500/20 animate-in zoom-in-50 duration-500">
              <AlertTriangle className="w-10 h-10 text-rose-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white tracking-tight">
              {title || "Action Failed"}
            </h3>
            <p className="text-rose-100/70 text-sm leading-relaxed max-w-[240px] mx-auto">
              {message}
            </p>
          </div>

          <div className="w-full pt-4">
            <button
              onClick={onRetry || (() => window.location.reload())}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-dashed-border bg-rose-500/10 text-rose-400 font-bold hover:bg-rose-500/20 transition-all border border-rose-500/20 active:scale-[0.98]"
            >
              {buttonText || "Try Again"}
            </button>
            <p className="mt-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
              System automatically recovering...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
