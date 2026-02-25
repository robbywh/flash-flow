import { HttpException, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter';
describe('HttpExceptionFilter', () => {
    let filter: HttpExceptionFilter;

    beforeEach(() => {
        filter = new HttpExceptionFilter();
    });

    const mockArgumentsHost = (responseJson: any) => ({
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
    } as unknown as ArgumentsHost);

    it('should format HttpException with object response correctly', () => {
        const jsonSpy = vi.fn();
        const host = mockArgumentsHost(jsonSpy);
        const exception = new HttpException({ message: 'Custom Error', code: 'CUSTOM_CODE' }, HttpStatus.BAD_REQUEST);

        filter.catch(exception, host);

        expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
            code: 400,
            status: 'error',
            error: expect.objectContaining({
                message: 'Custom Error',
                code: 'CUSTOM_CODE',
            }),
        }));
    });

    it('should handle validation errors (array message)', () => {
        const jsonSpy = vi.fn();
        const host = mockArgumentsHost(jsonSpy);
        const exception = new HttpException({ message: ['error1', 'error2'] }, HttpStatus.BAD_REQUEST);

        filter.catch(exception, host);

        expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.objectContaining({
                message: 'error1, error2',
                code: 'VALIDATION_ERROR',
            }),
        }));
    });

    it('should handle generic Error (non-HttpException)', () => {
        const jsonSpy = vi.fn();
        const host = mockArgumentsHost(jsonSpy);
        const error = new Error('Database explode');

        filter.catch(error, host);

        expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
            code: 500,
            error: expect.objectContaining({
                code: 'INTERNAL_ERROR',
                message: 'Database explode',
            }),
        }));
    });

    it('should handle Error with .status property', () => {
        const jsonSpy = vi.fn();
        const host = mockArgumentsHost(jsonSpy);
        const error = new Error('Custom status error') as any;
        error.status = 418;

        filter.catch(error, host);

        expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
            code: 418,
        }));
    });

    it('should use exception.message if response object message is missing', () => {
        const jsonSpy = vi.fn();
        const host = mockArgumentsHost(jsonSpy);
        const exception = new HttpException({}, HttpStatus.FORBIDDEN);

        filter.catch(exception, host);

        expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
            code: 403,
            error: expect.objectContaining({
                message: 'Http Exception',
                code: 'HTTP_ERROR',
            }),
        }));
    });
});
