/**
 * Domain types used by storage interfaces.
 * Decoupled from any ORM — matches the Prisma model shape.
 */
export interface FlashSaleRecord {
  id: string;
  productName: string;
  totalStock: number;
  remainingStock: number;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseRecord {
  id: string;
  flashSaleId: string;
  userId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Storage interface for flash sale data access.
 * All I/O is abstracted behind this interface for testability.
 */
export interface FlashSaleStorage {
  getCurrentSale(): Promise<FlashSaleRecord | null>;
  findPurchase(
    flashSaleId: string,
    userId: string,
  ): Promise<PurchaseRecord | null>;
  createPurchase(flashSaleId: string, userId: string): Promise<PurchaseRecord>;
}

/**
 * Redis storage interface for stock counter operations.
 */
export interface FlashSaleRedisStorage {
  getStock(flashSaleId: string): Promise<number | null>;
  initializeStock(flashSaleId: string, stock: number): Promise<void>;
  decrementStock(flashSaleId: string): Promise<number>;
  incrementStock(flashSaleId: string): Promise<void>;
}

export const FLASH_SALE_STORAGE = 'FLASH_SALE_STORAGE';
export const FLASH_SALE_REDIS_STORAGE = 'FLASH_SALE_REDIS_STORAGE';
