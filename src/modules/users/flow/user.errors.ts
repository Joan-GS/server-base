import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidIdFormatException extends HttpException {
    constructor(id: string) {
      super(`Invalid ID format: ${id}`, HttpStatus.BAD_REQUEST);
    }
  }

export class UserNotFoundException extends HttpException {
  constructor(id: string) {
    super(`User with id ${id} not found`, HttpStatus.NOT_FOUND);
  }
}

export class InvalidUserDataException extends HttpException {
  constructor(message: string) {
    super(`Invalid user data: ${message}`, HttpStatus.BAD_REQUEST);
  }
}

export class UserAlreadyExistsException extends HttpException {
  constructor(email: string) {
    super(`User with email ${email} already exists`, HttpStatus.CONFLICT);
  }
}

export class InvalidTokenException extends HttpException {
  constructor() {
    super('Invalid or expired token', HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidFiltersException extends HttpException {
  constructor() {
    super('Invalid filters format. Expected valid JSON', HttpStatus.BAD_REQUEST);
  }
}