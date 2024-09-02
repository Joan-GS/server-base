import { Module } from "@nestjs/common";
import { AuthService } from "./services/auth.service";
import { AuthController } from "./controllers/auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { CommonModule } from "../common";
import { UserModule } from "../users/users.module";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard } from "./security/auth.guard";

@Module({
    imports: [
        CommonModule,
        UserModule,
        JwtModule.register({
            global: true,
            secret: `${process.env.JWT_SECRET}`,
            signOptions: { expiresIn: "1 days" },
        }),
    ],
    providers: [
        AuthService,
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule {}
