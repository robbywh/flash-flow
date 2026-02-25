import type {
  FlashSaleData,
  PurchaseResult,
  UserPurchaseCheck,
} from "../types/flash-sale.types";

export interface FlashSaleApi {
  getCurrentSale(): Promise<FlashSaleData>;
  attemptPurchase(userId: string): Promise<PurchaseResult>;
  checkUserPurchase(userId: string): Promise<UserPurchaseCheck>;
}
