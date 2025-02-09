import {
    BadRequestException,
    Body,
    Controller,
    Post,
    Query,
} from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { Prisma, User } from "@prisma/client";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Role } from "../utils/role.enum";
import { Public } from "../decorators/public.decorator";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) {}

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
    @Public()
    @Post("login")
    @ApiOperation({ summary: "Authenticate a user" })
    async login(@Body() signInDto: Record<string, any>) {
        // Validate input early
        if (!signInDto.email || !signInDto.password) {
            throw new BadRequestException("Email and password are required");
        }

        // Call the authentication service for signing in
        return this.authService.signIn(signInDto.email, signInDto.password);
    }

    /**
     * POST /auth/register - Register a new user
     *
     * @param data - User data (including email, password, and roles)
     * @returns Newly created user
     * @throws BadRequestException if registration data is invalid
     */
    @Public() // Expose this route to the public for registration
    @Post("register")
    @ApiOperation({ summary: "Register a new user" })
    async register(@Body() data: Prisma.UserCreateInput): Promise<User> {
        // Validate incoming data
        if (!data.email || !data.password) {
            throw new BadRequestException("Email and password are required");
        }
        // Set default role to 'User'
        data.roles = Role.User;
        // Generate a verification code
        const verificationCode =
            await this.authService.generateVerificationCode();
        // Register the user and attach the verification code
        const user = await this.authService.register(data, verificationCode);

        return user;
    }

    /**
     * GET /auth/confirm - Confirm the email address using a verification code
     *
     * @param code - The verification code sent to the user's email
     * @returns Success message and the updated user details
     * @throws BadRequestException if the verification code is invalid or expired
     */
    @Public()
    @Post("confirm")
    @ApiOperation({ summary: "Confirm email address using verification code" })
    async confirmEmail(@Query("code") code: string) {
        // Ensure the code is provided
        if (!code) {
            throw new BadRequestException("Verification code is required");
        }

        // Attempt to verify the code and get the associated user
        const user = await this.authService.verifyEmailCode(code);

        // Handle case where no user was found for the verification code
        if (!user) {
            throw new BadRequestException(
                "Invalid or expired verification code"
            );
        }

        // Return success message and the confirmed user
        return { message: "Email confirmed successfully", user };
    }
}
