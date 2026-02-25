import {
  FlashSaleData,
  PurchaseResult,
  UserPurchaseCheck,
  AttemptPurchaseRequest,
  SaleStatus,
} from 'shared';

export class FlashSaleDto implements FlashSaleData {
  id!: string;
  productName!: string;
  totalStock!: number;
  remainingStock!: number;
  startTime!: string;
  endTime!: string;
  status!: SaleStatus;
}

export class PurchaseResultDto implements PurchaseResult {
  purchaseId!: string;
  userId!: string;
  productName!: string;
  status!: 'confirmed';
  purchasedAt!: string;
}

export class UserPurchaseCheckDto implements UserPurchaseCheck {
  purchased!: boolean;
  purchaseId?: string;
  purchasedAt?: string;
}

export class AttemptPurchaseRequestDto implements AttemptPurchaseRequest {
  userId!: string;
}
