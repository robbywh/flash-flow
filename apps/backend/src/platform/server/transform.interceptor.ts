import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { map } from 'rxjs/operators';
import { ApiResponse } from 'shared';

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<any, any> {
    intercept(
        _context: ExecutionContext,
        next: CallHandler<any>,
    ): any {
        return (next.handle() as any).pipe(
            (map as any)((data: any): ApiResponse<T> => ({ data })),
        );
    }
}
