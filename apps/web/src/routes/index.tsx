import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { SaleStatus } from '../features/flash-sale/components/SaleStatus';
import { PurchaseButton } from '../features/flash-sale/components/PurchaseButton';
import { PurchaseResult } from '../features/flash-sale/components/PurchaseResult';
import { flashSaleApi } from '../features/flash-sale';
import type { FlashSaleData } from '../features/flash-sale';

export const Route = createFileRoute('/')({ component: FlashSalePage });

function FlashSalePage() {
  const [sale, setSale] = useState<FlashSaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<boolean | null>(null);
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
  const [purchaseId, setPurchaseId] = useState<string | undefined>();

  const fetchSale = useCallback(async () => {
    try {
      const data = await flashSaleApi.getCurrentSale();
      setSale(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sale');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSale();
    const interval = setInterval(fetchSale, 3000);
    return () => clearInterval(interval);
  }, [fetchSale]);

  const handleReset = () => {
    setPurchaseSuccess(null);
    setPurchaseMessage(null);
    setPurchaseId(undefined);
    setUserId('');
  };

  const handlePurchase = async () => {
    if (!userId.trim() || purchasing) return;

    setPurchasing(true);
    setPurchaseSuccess(null);
    setPurchaseMessage(null);
    setPurchaseId(undefined);

    try {
      const result = await flashSaleApi.attemptPurchase(userId.trim());
      setPurchaseSuccess(true);
      setPurchaseMessage(
        `You've secured a ${result.productName}! Transaction ID: ${result.purchaseId}`,
      );
      setPurchaseId(result.purchaseId);
      fetchSale(); // Refresh stock
    } catch (err) {
      setPurchaseSuccess(false);
      setPurchaseMessage(
        err instanceof Error ? err.message : 'Purchase failed',
      );
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col">
      {/* Header / Hero - More compact */}
      <header className="relative pt-8 md:pt-12 pb-4 px-6 text-center overflow-hidden shrink-0">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 glow-cyan mb-2">
            <Zap className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
            <span className="text-white">FLASH</span>{' '}
            <span className="text-gradient">FLOW</span>
          </h1>
        </div>
      </header>

      {/* Main Content - Centered vertically on desktop */}
      <main className="flex-grow flex items-center justify-center px-6 pb-12 lg:pb-0">
        <div className="w-full max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Sale Status - Left */}
            <section className="lg:col-span-7">
              <div className="glass-dark rounded-3xl p-6 md:p-8 h-full flex flex-col">
                <SaleStatus sale={sale} loading={loading} error={error} />
              </div>
            </section>

            {/* Purchase Control - Right */}
            <section className="lg:col-span-5 flex flex-col gap-6">
              <div className="glass-dark rounded-3xl p-6 md:p-8 space-y-6 flex flex-col justify-between h-full">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-white">
                      Secure Allocation
                    </h3>
                    <p className="text-xs text-slate-400">
                      Enter your identity to participate in the active drop.
                    </p>
                  </div>

                  {/* User ID Input Area - Removed space-y to control gaps precisely */}
                  <div className="flex flex-col">
                    <div className="space-y-2">
                      <label
                        htmlFor="userId"
                        className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1"
                      >
                        User Identity
                      </label>
                      <input
                        id="userId"
                        type="text"
                        value={userId}
                        onChange={(e) => {
                          setUserId(e.target.value);
                          if (purchaseSuccess === false) {
                            setPurchaseSuccess(null);
                            setPurchaseMessage(null);
                          }
                        }}
                        placeholder="e.g. robbywh"
                        disabled={sale?.status !== 'active' || purchaseSuccess === true}
                        className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/30 focus:ring-4 focus:ring-cyan-500/5 transition-all disabled:opacity-50"
                      />
                    </div>

                    {/* External Info/Error Area - Rigid height to prevent button movement */}
                    <div className="h-12 flex items-center px-1 shrink-0">
                      <div className="w-full">
                        {!userId.trim() && sale?.status === 'active' && !purchaseSuccess && (
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider animate-pulse">
                            Requires a valid identity to proceed
                          </p>
                        )}
                        {userId.trim() && userId.trim().length < 3 && sale?.status === 'active' && !purchaseSuccess && (
                          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider leading-tight">
                            Identity must be at least 3 characters
                          </p>
                        )}
                        {purchaseSuccess === false && (
                          <p className="text-xs text-rose-500 font-bold leading-tight line-clamp-2">
                            {purchaseMessage}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Purchase Button */}
                    <PurchaseButton
                      userId={userId}
                      disabled={purchaseSuccess === true}
                      loading={purchasing}
                      saleStatus={sale?.status ?? null}
                      onPurchase={handlePurchase}
                    />
                  </div>
                </div>

                {/* Hint Box - Compact */}
                <div className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5">
                  <p className="text-[10px] text-blue-300/80 leading-relaxed font-medium text-center">
                    <span className="font-black text-blue-200 uppercase tracking-tighter mr-1">Tip:</span>
                    Every millisecond counts. Ensure your connection is stable before attempting.
                  </p>
                </div>
              </div>

              {/* Purchase Success Modal Overlay Or Inline Result */}
              {purchaseSuccess && (
                <PurchaseResult
                  success={purchaseSuccess}
                  message={purchaseMessage}
                  purchaseId={purchaseId}
                  onRetry={handleReset}
                />
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="shrink-0 py-4 px-6 text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">
        © 2026 Flash Flow High-Performance Systems
      </footer>
    </div>
  );
}
