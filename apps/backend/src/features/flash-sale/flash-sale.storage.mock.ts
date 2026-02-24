/* eslint-disable @typescript-eslint/require-await */
import type {
  FlashSaleStorage,
  FlashSaleRedisStorage,
  FlashSaleRecord,
  PurchaseRecord,
} from './flash-sale.storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * In-memory mock for FlashSaleStorage.
 * Used in unit tests to avoid database I/O.
 */
export class MockFlashSaleStorage implements FlashSaleStorage {
  public sales: FlashSaleRecord[] = [];
  public purchases: PurchaseRecord[] = [];

  async getCurrentSale(): Promise<FlashSaleRecord | null> {
    return this.sales.length > 0 ? this.sales[this.sales.length - 1] : null;
  }

  async findPurchase(
    flashSaleId: string,
    userId: string,
  ): Promise<PurchaseRecord | null> {
    return (
      this.purchases.find(
        (p) =>
          p.flashSaleId === flashSaleId &&
          p.userId === userId &&
          p.status === 'confirmed',
      ) ?? null
    );
  }

  async createPurchase(
    flashSaleId: string,
    userId: string,
  ): Promise<PurchaseRecord> {
    const existing = await this.findPurchase(flashSaleId, userId);
    if (existing) throw new Error('ALREADY_PURCHASED');

    const sale = this.sales.find((s) => s.id === flashSaleId);
    if (!sale || sale.remainingStock <= 0) throw new Error('SOLD_OUT');

    sale.remainingStock -= 1;

    const purchase: PurchaseRecord = {
      id: uuidv4(),
      flashSaleId,
      userId,
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.purchases.push(purchase);
    return purchase;
  }
}

/**
 * In-memory mock for FlashSaleRedisStorage.
 */
export class MockFlashSaleRedisStorage implements FlashSaleRedisStorage {
  private stockMap = new Map<string, number>();

  async getStock(flashSaleId: string): Promise<number | null> {
    return this.stockMap.get(flashSaleId) ?? null;
  }

  async initializeStock(flashSaleId: string, stock: number): Promise<void> {
    this.stockMap.set(flashSaleId, stock);
  }

  async decrementStock(flashSaleId: string): Promise<number> {
    const current = this.stockMap.get(flashSaleId) ?? 0;
    const newValue = current - 1;
    this.stockMap.set(flashSaleId, newValue);
    return newValue;
  }

  async incrementStock(flashSaleId: string): Promise<void> {
    const current = this.stockMap.get(flashSaleId) ?? 0;
    this.stockMap.set(flashSaleId, current + 1);
  }
}
