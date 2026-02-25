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

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const responseObj = res as Record<string, unknown>;
        if (responseObj.message && Array.isArray(responseObj.message)) {
          message = responseObj.message.join(', ');
          errorCode = 'VALIDATION_ERROR';
        } else {
          message = (responseObj.message as string) || exception.message;
          errorCode = (responseObj.code as string) || 'HTTP_ERROR';
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      const errorWithStatus = exception as Error & {
        statusCode?: number;
        status?: number;
        errorCode?: string;
        code?: string;
      };
      statusCode =
        errorWithStatus.statusCode ||
        errorWithStatus.status ||
        HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
      errorCode =
        errorWithStatus.errorCode || errorWithStatus.code || 'INTERNAL_ERROR';
    }

    const correlationId = uuidv4();

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
