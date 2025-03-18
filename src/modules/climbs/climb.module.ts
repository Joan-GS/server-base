import { Module } from "@nestjs/common";
import { CommonModule } from "../common";
import { ClimbService } from "./services/climb.service";
import { ClimbController } from "./controllers/climb.controller";
import { AuthService } from "../auth/services/auth.service";
import { UserModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";
import { MailService } from "../email/services/mail.service";

@Module({
    imports: [CommonModule, UserModule, AuthModule],
    providers: [ClimbService, AuthService, MailService],
    controllers: [ClimbController],
    exports: [ClimbService],
})
export class ClimbModule {}
