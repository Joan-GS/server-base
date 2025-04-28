import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<FastifyReply>();

        let status = 500;
        let message = 'Internal server error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            // Extrae el 'detail' si existe (para errores de JoiValidationPipe)
            const detail = typeof exceptionResponse === 'object' 
                ? (exceptionResponse as any).detail 
                : null;

            message = detail || 
                     (typeof exceptionResponse === 'object' 
                        ? (exceptionResponse as any).message 
                        : exception.message);
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        response.status(status).send({
            success: false,
            message, // Aquí se incluirá el 'detail' si existe
            code: status,
        });
    }
}