import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiErrorResponse } from 'shared';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : (exception as any).statusCode ||
          (exception as any).status ||
          HttpStatus.INTERNAL_SERVER_ERROR;

    const correlationId = uuidv4();
    let message = 'Internal server error';
    let errorCode =
      (exception as any).errorCode ||
      (exception as any).code ||
      'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        // Handle NestJS built-in validation pipe errors
        if ((res as any).message && Array.isArray((res as any).message)) {
          message = (res as any).message.join(', ');
          errorCode = 'VALIDATION_ERROR';
        } else {
          message = (res as any).message || exception.message;
          errorCode = (res as any).code || 'HTTP_ERROR';
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse: ApiErrorResponse = {
      status: 'error',
      code: statusCode,
      error: {
        code: errorCode,
        message,
        correlationId,
      },
    };

    response.status(statusCode).json(errorResponse);
  }
}
