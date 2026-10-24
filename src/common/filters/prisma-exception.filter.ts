import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

// Translates Prisma errors into meaningful HTTP responses instead of opaque 500s.
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    const map: Record<string, [number, string]> = {
      P2002: [HttpStatus.CONFLICT, 'A record with this value already exists'],
      P2025: [HttpStatus.NOT_FOUND, 'Record not found'],
      P2003: [HttpStatus.CONFLICT, 'This record is still referenced by other content'],
    };
    const [statusCode, message] = map[exception.code] ?? [HttpStatus.INTERNAL_SERVER_ERROR, 'Database error'];

    response.status(statusCode).json({ statusCode, message, error: statusCode === 500 ? 'Internal Server Error' : undefined });
  }
}
