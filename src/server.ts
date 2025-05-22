import { INestApplication } from "@nestjs/common";
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

// Default configuration constants
const API_DEFAULT_PORT = 3000;
const API_DEFAULT_PREFIX = "/api/v1";
const SWAGGER_TITLE = "Base API";
const SWAGGER_DESCRIPTION = "API used for base management";
const SWAGGER_PREFIX = "/docs";

// Set up Swagger documentation
function createSwagger(app: INestApplication) {
    const options = new DocumentBuilder()
        .setTitle(SWAGGER_TITLE)
        .setDescription(SWAGGER_DESCRIPTION)
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(SWAGGER_PREFIX, app, document);
}

async function bootstrap(): Promise<void> {
    // Create the NestJS app with Fastify
    const app = await NestFactory.create<NestFastifyApplication>(
        ApplicationModule,
        new FastifyAdapter()
    );

    const env = process.env.NODE_ENV || 'development';
    const port = process.env.PORT || API_DEFAULT_PORT;
    const host = env === 'production' ? '0.0.0.0' : 'localhost';

    // Set global API prefix
    app.setGlobalPrefix(process.env.API_PREFIX || API_DEFAULT_PREFIX);

    // Initialize Swagger docs if enabled
    if (!process.env.SWAGGER_ENABLE || process.env.SWAGGER_ENABLE === "1") {
        createSwagger(app);
    }

    // Register global interceptors and exception filter
    const logInterceptor = app.select(CommonModule).get(LogInterceptor);
    const apiResponseInterceptor = app.select(CommonModule).get(ApiResponseInterceptor);
    app.useGlobalInterceptors(logInterceptor, apiResponseInterceptor);
    app.useGlobalFilters(new AllExceptionsFilter());

    // Configure CORS based on environment
    app.enableCors({
        origin: env === 'production' ? '*' : 'http://localhost:8081',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Start the application
    await app.listen(port, host, () => {
        console.log(`Server running on http://${host}:${port}`);
        if (process.env.SWAGGER_ENABLE === '1') {
            console.log(`Swagger docs available at http://${host}:${port}${SWAGGER_PREFIX}`);
        }
    });
}

// Catch and log any fatal errors during bootstrap
bootstrap().catch((err) => {
    console.error(err);
    process.exit(1);
});
