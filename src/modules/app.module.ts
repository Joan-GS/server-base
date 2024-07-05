import { Module } from '@nestjs/common';

import { CommonModule } from './common';
import { UserModule } from './users/users.module';

@Module({
    imports: [
        CommonModule,
        UserModule
    ]
})
export class ApplicationModule {}
