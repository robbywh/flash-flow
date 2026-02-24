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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="relative py-8 px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5" />
        <div className="relative flex items-center justify-center gap-3">
          <Zap className="w-10 h-10 text-cyan-400" />
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            <span className="text-gray-300">FLASH</span>{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              FLOW
            </span>
          </h1>
        </div>
        <p className="text-gray-400 mt-2 text-lg">
          Lightning-fast flash sales
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 pb-20 space-y-8">
        {/* Sale Status */}
        <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
          <SaleStatus sale={sale} loading={loading} error={error} />
        </section>

        {/* Purchase Form */}
        <section className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 space-y-6">
          <h3 className="text-xl font-semibold text-white text-center">
            Secure Your Item
          </h3>

          {/* User ID Input */}
          <div className="max-w-md mx-auto">
            <label
              htmlFor="userId"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              Your User ID (email or username)
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="user@example.com"
              disabled={sale?.status !== 'active' || purchaseSuccess === true}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Purchase Button */}
          <div className="flex justify-center">
            <PurchaseButton
              userId={userId}
              disabled={purchaseSuccess === true}
              loading={purchasing}
              saleStatus={sale?.status ?? null}
              onPurchase={handlePurchase}
            />
          </div>

          {/* Purchase Result */}
          <PurchaseResult
            success={purchaseSuccess}
            message={purchaseMessage}
            purchaseId={purchaseId}
          />
        </section>
      </main>
    </div>
  );
}
