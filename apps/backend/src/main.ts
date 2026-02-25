import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './platform/server/transform.interceptor';
import { HttpExceptionFilter } from './platform/server/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global response transformation
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global exception handling
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  logger.log(`Flash Flow API running on http://localhost:${port}`);
}
void bootstrap();
