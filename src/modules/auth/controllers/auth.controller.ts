import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Post,
    Headers,
    Param,
} from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { Prisma, User } from "@prisma/client";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Public } from "../decorators/public.decorator";
import { ROLE } from "@joan16/shared-base";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /************
     ** ACTIONS **
     ************/

    /**
     * GET /auth/me - Get the username of the authenticated user
     *
     * @param access_token - The user's access token in the request headers
     * @returns Username of the authenticated user
     * @throws UnauthorizedException if the user is not authenticated
     */
    @Get("me")
    @ApiOperation({ summary: "Get the authenticated user's attributes" })
    async me(@Headers("authorization") authorization: string) {
        // Validate if token is provided in the Authorization header
        if (!authorization) {
            throw new BadRequestException("Authorization token is required");
        }

        const token = authorization.split(" ")[1]; // Extract the Bearer token

        // Use the auth service to decode the token and get user details
        const data = await this.authService.me(token);

        if (!data) {
            throw new BadRequestException("Data not found or invalid token");
        }

        return {
            ...data,
        };
    }

    /**
     * POST /auth/profile - Get the profile of another user
     *
     * @param authorization - The current user's access token in headers
     * @param body - An object containing the profileId of the user to view
     * @returns Profile info + isFollowing boolean
     */
    @Get("profile/:id")
    @ApiOperation({ summary: "Get another user's profile" })
    async getProfile(
        @Headers("authorization") authorization: string,
        @Param("id") id: string
    ) {
        if (!authorization) {
            throw new BadRequestException("Authorization token is required");
        }
        const token = authorization.split(" ")[1];

        if (!id) {
            throw new BadRequestException("id is required");
        }

        const profileData = await this.authService.getProfile(
            token,
            id
        );

        return profileData;
    }

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
        data.roles = ROLE.USER;
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
    async confirmEmail(@Body() code: Record<string, any>) {
        // Ensure the code is provided
        if (!code) {
            throw new BadRequestException("Verification code is required");
        }

        // Attempt to verify the code and get the associated user
        const user = await this.authService.verifyEmailCode(code.code);

        // Handle case where no user was found for the verification code
        if (!user) {
            throw new BadRequestException(
                "Invalid or expired verification code"
            );
        }

        // Return success message and the confirmed user
        return { message: "Email confirmed successfully", user };
    }

    /**
     * POST /auth/resend - Reenviar código de verificación
     *
     * @param email - Email del usuario que necesita un nuevo código
     * @returns Mensaje de confirmación
     * @throws BadRequestException si el email no es válido o el usuario no existe
     */
    @Public()
    @Post("resend")
    @ApiOperation({ summary: "Resend email verification code" })
    async resendVerificationCode(@Body("email") email: string) {
        // Validar si se proporciona un email
        if (!email) {
            throw new BadRequestException("Email is required");
        }

        // Enviar el nuevo código por email
        await this.authService.resendVerificationCode(email);

        return {
            message: "A new verification code has been sent to your email",
        };
    }


    /**
     * POST /auth/forgot-password - Request a password reset
     *
     * @param email - The user's email address
     * @returns Success message
     * @throws BadRequestException if email is invalid or user doesn't exist
     */
    @Public()
    @Post('forgot-password')
    @ApiOperation({ summary: 'Request a password reset' })
    async forgotPassword(@Body('email') email: string) {
        if (!email) {
            throw new BadRequestException('Email is required');
        }

        await this.authService.requestPasswordReset(email);

        return {
            message: 'If an account with that email exists, a reset link has been sent',
        };
    }

    /**
     * POST /auth/reset-password - Reset user's password using a token
     *
     * @param token - The password reset token
     * @param newPassword - The new password
     * @returns Success message
     * @throws BadRequestException if token is invalid or password is weak
     */
    @Public()
    @Post('reset-password')
    @ApiOperation({ summary: 'Reset password using a token' })
    async resetPassword(
        @Body('token') token: string,
        @Body('newPassword') newPassword: string,
    ) {
        if (!token || !newPassword) {
            throw new BadRequestException('Token and new password are required');
        }

        await this.authService.resetPassword(token, newPassword);

        return {
            message: 'Password has been successfully reset',
        };
    }
}
