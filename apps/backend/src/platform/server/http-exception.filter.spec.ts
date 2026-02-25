import { HttpException, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiErrorResponse } from 'shared';
import { HttpExceptionFilter } from './http-exception.filter';
describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  const mockArgumentsHost = (responseJson: (body: unknown) => void) =>
    ({
      switchToHttp: () => ({
        getResponse: () => ({
          status: () => ({
            json: responseJson,
          }),
        }),
        getRequest: () => ({
          url: '/test',
          method: 'GET',
        }),
      }),
    }) as unknown as ArgumentsHost;

  it('should format HttpException with object response correctly', () => {
    const jsonSpy = vi.fn();
    const host = mockArgumentsHost(jsonSpy);
    const exception = new HttpException(
      { message: 'Custom Error', code: 'CUSTOM_CODE' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    const call = jsonSpy.mock.calls[0][0] as ApiErrorResponse;
    expect(call.code).toBe(400);
    expect(call.status).toBe('error');
    expect(call.error.message).toBe('Custom Error');
    expect(call.error.code).toBe('CUSTOM_CODE');
    expect(call.error.correlationId).toBeDefined();
  });

  it('should handle validation errors (array message)', () => {
    const jsonSpy = vi.fn();
    const host = mockArgumentsHost(jsonSpy);
    const exception = new HttpException(
      { message: ['error1', 'error2'] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    const call = jsonSpy.mock.calls[0][0] as ApiErrorResponse;
    expect(call.error.message).toBe('error1, error2');
    expect(call.error.code).toBe('VALIDATION_ERROR');
  });

  it('should handle generic Error (non-HttpException)', () => {
    const jsonSpy = vi.fn();
    const host = mockArgumentsHost(jsonSpy);
    const error = new Error('Database explode');

    filter.catch(error, host);

    const call = jsonSpy.mock.calls[0][0] as ApiErrorResponse;
    expect(call.code).toBe(500);
    expect(call.error.code).toBe('INTERNAL_ERROR');
    expect(call.error.message).toBe('Database explode');
  });

  it('should handle Error with .status property', () => {
    const jsonSpy = vi.fn();
    const host = mockArgumentsHost(jsonSpy);
    const error = new Error('Custom status error') as Error & {
      status: number;
    };
    error.status = 418;

    filter.catch(error, host);

    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 418,
      }),
    );
  });

  it('should use exception.message if response object message is missing', () => {
    const jsonSpy = vi.fn();
    const host = mockArgumentsHost(jsonSpy);
    const exception = new HttpException({}, HttpStatus.FORBIDDEN);

    filter.catch(exception, host);

    const call = jsonSpy.mock.calls[0][0] as ApiErrorResponse;
    expect(call.code).toBe(403);
    expect(call.error.message).toBe('Http Exception');
    expect(call.error.code).toBe('HTTP_ERROR');
  });
});
