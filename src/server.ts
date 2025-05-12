import { NestFactory } from "@nestjs/core";
import {
    FastifyAdapter,
    NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { ApplicationModule } from "./modules/app.module";
import { CommonModule, LogInterceptor } from "./modules/common";
import { ApiResponseInterceptor } from "./modules/common/flow/api-response.interceptor";
import { AllExceptionsFilter } from "./modules/common/filters/http-exception.filter";
import { Logger } from '@nestjs/common';

// Configuración para Railway
const API_DEFAULT_PORT = process.env.PORT || 3000; // Usar PORT de Railway o 3000 por defecto
const API_DEFAULT_HOST = '0.0.0.0'; // Aceptar conexiones de todas las interfaces
const API_DEFAULT_PREFIX = "/api/v1/";

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create<NestFastifyApplication>(
        ApplicationModule,
        new FastifyAdapter({
            logger: true, // Habilitar logs de Fastify
            trustProxy: true // Importante para Railway
        })
    );

    // Configuración crítica para Railway
    app.setGlobalPrefix(process.env.API_PREFIX || API_DEFAULT_PREFIX);
    
    // Configuración de Swagger (si está habilitado)
    if (!process.env.SWAGGER_ENABLE || process.env.SWAGGER_ENABLE === "1") {
        const options = new DocumentBuilder()
            .setTitle(process.env.SWAGGER_TITLE || "Base API")
            .setDescription(process.env.SWAGGER_DESCRIPTION || "API description")
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, options);
        SwaggerModule.setup(process.env.SWAGGER_PREFIX || "/docs", app, document);
    }

    // Middlewares e interceptores
    const logInterceptor = app.select(CommonModule).get(LogInterceptor);
    const apiResponseInterceptor = app.select(CommonModule).get(ApiResponseInterceptor);
    app.useGlobalInterceptors(logInterceptor, apiResponseInterceptor);
    app.useGlobalFilters(new AllExceptionsFilter());

    // Configuración CORS para producción
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    });

    // Iniciar aplicación
    await app.listen(API_DEFAULT_PORT, API_DEFAULT_HOST);
    
    // Log de inicio
    const logger = new Logger('Bootstrap');
    logger.log(`🚀 Application is running on: http://${API_DEFAULT_HOST}:${API_DEFAULT_PORT}`);
    logger.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((err) => {
    const logger = new Logger('Bootstrap');
    logger.error('Failed to start application', err.stack);
    process.exit(1);
});