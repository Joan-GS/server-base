import { Module } from '@nestjs/common';

import { CommonModule } from './common';
import { UserModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ClimbModule } from './climbs/climb.module';
import { InteractionModule } from './interactions/interaction.module';
import { ProfileModule } from './profile/profile.module';

@Module({
    imports: [
        CommonModule,
        AuthModule,
        UserModule,
        ProfileModule,
        ClimbModule,
        InteractionModule,
        MailerModule
    ],
})
export class ApplicationModule {}
