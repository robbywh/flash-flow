import { Module } from '@nestjs/common';
import { FlashSaleController } from './flash-sale.controller';
import { FlashSaleService } from './flash-sale.service';
import { FlashSaleStoragePg } from './flash-sale.storage.pg';
import { FlashSaleStorageRedis } from './flash-sale.storage.redis';
import {
  FLASH_SALE_STORAGE,
  FLASH_SALE_REDIS_STORAGE,
} from './flash-sale.storage';

@Module({
  controllers: [FlashSaleController],
  providers: [
    FlashSaleService,
    {
      provide: FLASH_SALE_STORAGE,
      useClass: FlashSaleStoragePg,
    },
    {
      provide: FLASH_SALE_REDIS_STORAGE,
      useClass: FlashSaleStorageRedis,
    },
  ],
  exports: [FlashSaleService],
})
export class FlashSaleModule {}
