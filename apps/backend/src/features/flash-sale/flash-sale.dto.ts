export class FlashSaleDto {
  id!: string;
  productName!: string;
  totalStock!: number;
  remainingStock!: number;
  startTime!: string;
  endTime!: string;
  status!: 'upcoming' | 'active' | 'ended';
}

export class PurchaseResultDto {
  purchaseId!: string;
  userId!: string;
  productName!: string;
  status!: 'confirmed';
  purchasedAt!: string;
}

export class UserPurchaseCheckDto {
  purchased!: boolean;
  purchaseId?: string;
  purchasedAt?: string;
}

export class AttemptPurchaseRequestDto {
  userId!: string;
}
