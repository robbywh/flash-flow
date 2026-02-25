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
        `You've secured a ${result.productName}! Confirmation ID: ${result.purchaseId}`,
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
    <div className="min-h-screen">
      {/* Header / Hero */}
      <header className="relative pt-20 pb-16 px-6 text-center overflow-hidden">
        <div className="relative z-10 space-y-4 animate-float">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 glow-cyan mb-4">
            <Zap className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
            <span className="text-white">FLASH</span>{' '}
            <span className="text-gradient">FLOW</span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-lg md:text-xl font-medium">
            Experience the future of high-throughput commerce. Secured, scalable, and lightning fast.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pb-32 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sale Status - Left/Top */}
          <section className="md:col-span-12 lg:col-span-7">
            <div className="glass-dark rounded-3xl p-8 h-full">
              <SaleStatus sale={sale} loading={loading} error={error} />
            </div>
          </section>

          {/* New Column for Info or Stats if needed, for now just Purchase Form */}
          <section className="md:col-span-12 lg:col-span-5 space-y-8">
            <div className="glass-dark rounded-3xl p-8 space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white">
                  Get It Now
                </h3>
                <p className="text-sm text-slate-400">
                  Enter your details to participate in the active flash sale.
                </p>
              </div>

              {/* User ID Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="userId"
                    className="block text-sm font-semibold text-slate-300 ml-1"
                  >
                    User Identity
                  </label>
                  <input
                    id="userId"
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. Satoshi Nakamoto"
                    disabled={sale?.status !== 'active' || purchaseSuccess === true}
                    className="w-full px-5 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Purchase Button */}
                <div className="pt-2">
                  <PurchaseButton
                    userId={userId}
                    disabled={purchaseSuccess === true}
                    loading={purchasing}
                    saleStatus={sale?.status ?? null}
                    onPurchase={handlePurchase}
                  />
                </div>
              </div>

              {/* Purchase Result */}
              <PurchaseResult
                success={purchaseSuccess}
                message={purchaseMessage}
                purchaseId={purchaseId}
              />
            </div>

            {/* Hint Box */}
            <div className="p-6 rounded-2xl border border-blue-500/10 bg-blue-500/5 backdrop-blur-sm">
              <p className="text-sm text-blue-300 leading-relaxed">
                <span className="font-bold text-blue-200">Tip:</span> Ensure you have a stable connection. Our system handles thousands of requests per second, so every millisecond counts!
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
