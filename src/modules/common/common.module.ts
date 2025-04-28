import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './controller';
import { LogInterceptor, ApiResponseInterceptor } from './flow';
import {  LoggerService, PrismaService } from './provider';

@Module({
    imports: [
        TerminusModule
    ],
    providers: [
        LoggerService,
        LogInterceptor,
        ApiResponseInterceptor,
        PrismaService,
    ],
    exports: [
        LoggerService,
        LogInterceptor,
        PrismaService
    ],
    controllers: [
        HealthController
    ],
})
export class CommonModule {}
