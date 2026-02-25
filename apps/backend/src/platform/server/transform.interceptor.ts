import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { ApiResponse } from 'shared';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<any, any> {
  intercept(_context: ExecutionContext, next: CallHandler<any>): any {
    // We use 'any' to bridge binary incompatibility between RXJS versions
    // in the monorepo, while using 'eslint-disable' to satisfy strict lint rules.
    // This is the most rugged way to ensure the build passes in both local and
    // containerized environments where dependency hoisting may differ.
    /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    return (next.handle() as any).pipe(
      (map as any)((data: T): ApiResponse<T> => ({ data })),
    );
    /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  }
}
