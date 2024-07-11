import { Module } from '@nestjs/common';

import { CommonModule } from './common';
import { UserModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        CommonModule,
        AuthModule,
        UserModule
    ]
})
export class ApplicationModule {}
