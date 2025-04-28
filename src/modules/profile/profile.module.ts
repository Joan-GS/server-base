import { Module } from "@nestjs/common";
import { CommonModule } from "../common";
import { ProfileService } from "./services/profile.service";
import { ProfileController } from "./controllers/profile.controller";
import { ClimbModule } from "../climbs/climb.module";
import { InteractionModule } from "../interactions/interaction.module";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "../users/users.module";

@Module({
    imports: [CommonModule, ClimbModule, InteractionModule, JwtModule, UserModule],
    providers: [ProfileService],
    controllers: [ProfileController],
    exports: [ProfileService],
})
export class ProfileModule {}
