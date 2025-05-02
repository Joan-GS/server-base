import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundException extends HttpException {
    constructor(resource: string, id: string) {
        super(`${resource} with id ${id} not found`, HttpStatus.NOT_FOUND);
    }
}

export class InvalidIdFormatException extends HttpException {
    constructor(id: string) {
        super(`Invalid ID format: ${id}`, HttpStatus.BAD_REQUEST);
    }
}

export class AlreadyExistsException extends HttpException {
    constructor(resource: string, id: string) {
        super(`${resource} already exists: ${id}`, HttpStatus.CONFLICT);
    }
}

export class InvalidOperationException extends HttpException {
    constructor(message: string) {
        super(`Invalid operation: ${message}`, HttpStatus.BAD_REQUEST);
    }
}

export class InvalidInputException extends HttpException {
    constructor(message: string) {
        super(`Invalid input: ${message}`, HttpStatus.BAD_REQUEST);
    }
}