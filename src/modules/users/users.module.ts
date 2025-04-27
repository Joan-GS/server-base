import { Module } from "@nestjs/common";
import { CommonModule } from "../common";
import { UserService } from "./services/user.service";
import { UserController } from "./controllers/user.controller";
import { FollowService } from "../interactions/services/follow.service";

@Module({
    imports: [CommonModule],
    providers: [UserService, FollowService],
    controllers: [UserController],
    exports: [UserService],
})
export class UserModule {}
