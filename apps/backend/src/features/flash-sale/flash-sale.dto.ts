import type {
  FlashSaleData,
  PurchaseResult,
  UserPurchaseCheck,
  AttemptPurchaseRequest,
  SaleStatus,
} from 'shared';
import { IsString, IsNotEmpty, IsNumber, IsEnum, Min } from 'class-validator';

export class FlashSaleDto implements FlashSaleData {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsNumber()
  @Min(0)
  totalStock!: number;

  @IsNumber()
  @Min(0)
  remainingStock!: number;

  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @IsEnum(['upcoming', 'active', 'ended'])
  status!: SaleStatus;
}

export class PurchaseResultDto implements PurchaseResult {
  @IsString()
  @IsNotEmpty()
  purchaseId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  productName!: string;

  @IsEnum(['confirmed'])
  status!: 'confirmed';

  @IsString()
  @IsNotEmpty()
  purchasedAt!: string;
}

export class UserPurchaseCheckDto implements UserPurchaseCheck {
  purchased!: boolean;

  @IsString()
  purchaseId?: string;

  @IsString()
  purchasedAt?: string;
}

export class AttemptPurchaseRequestDto implements AttemptPurchaseRequest {
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
