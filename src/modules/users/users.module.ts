import { Module } from "@nestjs/common";
import { CommonModule } from "../common";
import { UserService } from "./services/user.service";
import { UserController } from "./controllers/user.controller";
import { JwtModule } from "@nestjs/jwt";

@Module({
    imports: [CommonModule, JwtModule],
    providers: [UserService],
    controllers: [UserController],
    exports: [],
})
export class UserModule {}
