import { Module } from "@nestjs/common";
import { CommonModule } from "../common";
import { UserService } from "./services/user.service";
import { UserController } from "./controllers/user.controller";

@Module({
    imports: [CommonModule],
    providers: [UserService],
    controllers: [UserController],
    exports: [],
})
export class UserModule {}
