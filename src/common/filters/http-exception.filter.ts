import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Catches every exception thrown anywhere in the app (HttpException,
 * Prisma errors, or unexpected runtime errors) and normalizes them into a
 * single consistent JSON shape so API consumers never have to branch on
 * error format.
 *
 * Response shape:
 * {
 *   statusCode: number,
 *   message: string | string[],
 *   error: string,
 *   path: string,
 *   timestamp: string (ISO, UTC)
 * }
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const bodyObj = body as Record<string, unknown>;
        message = (bodyObj.message as string | string[]) ?? exception.message;
        error = (bodyObj.error as string) ?? HttpStatus[statusCode];
      }
      error = error || HttpStatus[statusCode];
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: unique constraint violation, P2025: record not found, etc.
      if (exception.code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        message = `A record with this ${(exception.meta?.target as string[])?.join(', ') ?? 'value'} already exists.`;
        error = 'Conflict';
      } else if (exception.code === 'P2025') {
        statusCode = HttpStatus.NOT_FOUND;
        message = 'The requested record was not found.';
        error = 'Not Found';
      } else {
        statusCode = HttpStatus.BAD_REQUEST;
        message = `Database error (${exception.code}).`;
        error = 'Bad Request';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
