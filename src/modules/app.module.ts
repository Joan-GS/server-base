import { Module } from '@nestjs/common';

import { CommonModule } from './common';
import { UserModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
    imports: [
        CommonModule,
        AuthModule,
        UserModule,
        MailerModule
    ]
})
export class ApplicationModule {}
