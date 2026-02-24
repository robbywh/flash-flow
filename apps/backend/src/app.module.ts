import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './platform/database/database.module';
import { RedisModule } from './platform/redis/redis.module';
import { FlashSaleModule } from './features/flash-sale/flash-sale.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // 1 minute (in milliseconds)
        limit: 100,  // 100 requests per minute
      },
    ]),
    DatabaseModule,
    RedisModule,
    FlashSaleModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
