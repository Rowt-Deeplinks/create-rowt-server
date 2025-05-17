import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter to handle and log all exceptions
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code and error message
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // Extract the error response
    const errorResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    // Create a structured error log
    const errorLog = {
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode: status,
      message,
      requestId: request.headers['x-request-id'] || 'unknown',
      user: request.user ? { id: (request.user as any).userId } : 'anonymous',
      errorDetail:
        exception instanceof Error ? exception.stack : String(exception),
    };

    // Properly log the error with relevant info
    if (status >= 500) {
      this.logger.error(`Server error: ${errorLog.message}`, errorLog);
    } else {
      this.logger.warn(`Client error: ${errorLog.message}`, errorLog);
    }

    // Handle special case for 401 errors
    if (status === HttpStatus.UNAUTHORIZED) {
      return response.status(status).json({
        statusCode: status,
        message: 'Unauthorized',
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Return appropriate error response to client
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(errorResponse && typeof errorResponse === 'object'
        ? errorResponse
        : {}),
    });
  }
}
