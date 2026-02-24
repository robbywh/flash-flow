import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FlashSaleService } from './flash-sale.service';
import { FlashSaleError } from './flash-sale.errors';
import { v4 as uuidv4 } from 'uuid';

@Controller('api/v1/flash-sales')
export class FlashSaleController {
  constructor(private readonly flashSaleService: FlashSaleService) {}

  @Get('current')
  async getCurrentSale() {
    try {
      const sale = await this.flashSaleService.getCurrentSale();
      return { data: sale };
    } catch (error) {
      this.handleError(error);
    }
  }

  @Post('current/purchase')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 10000 } })
  async attemptPurchase(@Body() body: { userId: string }) {
    try {
      const result = await this.flashSaleService.attemptPurchase(body.userId);
      return { data: result };
    } catch (error) {
      this.handleError(error);
    }
  }

  @Get('current/purchase')
  async checkUserPurchase(@Query('userId') userId: string) {
    try {
      const result = await this.flashSaleService.checkUserPurchase(userId);
      return { data: result };
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(error: unknown): never {
    const correlationId = uuidv4();

    if (error instanceof FlashSaleError) {
      throw new HttpException(
        {
          status: 'error',
          code: error.statusCode,
          error: {
            code: error.errorCode,
            message: error.message,
            correlationId,
          },
        },
        error.statusCode,
      );
    }

    throw new HttpException(
      {
        status: 'error',
        code: 500,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred.',
          correlationId,
        },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
