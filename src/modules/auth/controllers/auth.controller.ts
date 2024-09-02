import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { Prisma, Users } from "@prisma/client";
import { ApiTags } from "@nestjs/swagger";
import { Role } from "../utils/role.enum";
import { Public } from "../utils/public.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) {}

    @Public()
    @Post("login")
    login(@Body() signInDto: Record<string, any>) {
        return this.authService.signIn(signInDto.email, signInDto.password);
    }

    @Public()
    @Post("register")
    register(@Body() data: Prisma.UsersCreateInput): Promise<Users> {
        data.roles = Role.Admin;
        return this.authService.register(data);
    }
}
