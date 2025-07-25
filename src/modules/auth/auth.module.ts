import { Module } from "@nestjs/common";
import { AuthService } from "./services/auth.service";
import { AuthController } from "./controllers/auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "../users/users.module";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./security/auth.guard";
import { MailModule } from "../email/email.module";
import { ClimbModule } from "../climbs/climb.module";
import { InteractionModule } from "../interactions/interaction.module";
import { PrismaService } from "../common";

@Module({
    imports: [
        UserModule,
        JwtModule.register({
            global: true,
            secret: `${process.env.JWT_SECRET}`,
            signOptions: { expiresIn: "1 days" },
        }),
        MailModule,
        ClimbModule,
        InteractionModule,
    ],
    providers: [
        AuthService,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
        PrismaService
    ],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
