import { Module } from "@nestjs/common";
import { CommonModule } from "../common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

@Module({
    imports: [CommonModule],
    providers: [UserService],
    controllers: [UserController],
    exports: [],
})
export class UserModule {}
