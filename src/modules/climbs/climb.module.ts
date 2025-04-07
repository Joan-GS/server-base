import { forwardRef, Module } from "@nestjs/common";
import { CommonModule } from "../common";
import { ClimbService } from "./services/climb.service";
import { ClimbController } from "./controllers/climb.controller";
import { AuthService } from "../auth/services/auth.service";
import { UserModule } from "../users/users.module";
import { MailService } from "../email/services/mail.service";
import { InteractionModule } from "../interactions/interaction.module";

@Module({
    imports: [CommonModule, UserModule, forwardRef(() =>InteractionModule)],
    providers: [ClimbService, AuthService, MailService],
    controllers: [ClimbController],
    exports: [ClimbService],
})
export class ClimbModule {}
