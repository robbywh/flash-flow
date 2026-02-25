import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FlashSaleService } from './flash-sale.service';
import {
  FlashSaleDto,
  AttemptPurchaseRequestDto,
  PurchaseResultDto,
  UserPurchaseCheckDto,
} from './flash-sale.dto';

@Controller('api/v1/flash-sales')
export class FlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) { }

  @Get('current')
  async getCurrentSale(): Promise<FlashSaleDto> {
    return this.flashSaleService.getCurrentSale();
  }

  @Post('current/purchase')
  @HttpCode(HttpStatus.CREATED)
  async attemptPurchase(
    @Body() body: AttemptPurchaseRequestDto,
  ): Promise<PurchaseResultDto> {
    return this.flashSaleService.attemptPurchase(body.userId);
  }

  @Get('current/purchase')
  async checkUserPurchase(
    @Query('userId') userId: string,
  ): Promise<UserPurchaseCheckDto> {
    return this.flashSaleService.checkUserPurchase(userId);
  }
}
