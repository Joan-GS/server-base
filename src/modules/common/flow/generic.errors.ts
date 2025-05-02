import { HttpException, HttpStatus } from '@nestjs/common';

abstract class CustomHttpException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus,
    public readonly code?: string
  ) {
    super(message, status);
  }
}

export class NotFoundException extends CustomHttpException {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`, HttpStatus.NOT_FOUND, 'NOT_FOUND');
  }
}

export class AlreadyExistsException extends CustomHttpException {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} with ${field} ${value} already exists`, HttpStatus.CONFLICT, 'ALREADY_EXISTS');
  }
}

export class InvalidFormatException extends CustomHttpException {
  constructor(field: string, value: string) {
    super(`Invalid ${field} format: ${value}`, HttpStatus.BAD_REQUEST, 'INVALID_FORMAT');
  }
}

export class InvalidDataException extends CustomHttpException {
  constructor(message: string) {
    super(`Invalid data: ${message}`, HttpStatus.BAD_REQUEST, 'INVALID_DATA');
  }
}

export class InvalidTokenException extends CustomHttpException {
  constructor() {
    super('Invalid or expired token', HttpStatus.UNAUTHORIZED, 'INVALID_TOKEN');
  }
}