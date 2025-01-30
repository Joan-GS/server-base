import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { Prisma, User } from "@prisma/client";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Role } from "../utils/role.enum";
import { Public } from "../decorators/public.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) {}

    /************
     ** ACTIONS **
     ************/

    /**
     * POST /auth/login - Authenticate a user
     *
     * @param signInDto - User credentials (email and password)
     * @returns Auth token if credentials are valid
     * @throws UnauthorizedException if credentials are invalid
     */
    @Public() // Expose this route to the public without authentication
    @Post("login")
    @ApiOperation({ summary: "Authenticate a user" })
    login(@Body() signInDto: Record<string, any>) {
        return this.authService.signIn(signInDto.email, signInDto.password);
    }

    /**
     * POST /auth/register - Register a new user
     *
     * @param data - User data (including email, password, and roles)
     * @returns Newly created user
     * @throws BadRequestException if registration data is invalid
     */
    @Public()
    @Post("register")
    @ApiOperation({ summary: "Register a new user" })
    register(@Body() data: Prisma.UserCreateInput): Promise<User> {
        // Assign the default role for a new user
        data.roles = Role.Admin;
        return this.authService.register(data);
    }
}
