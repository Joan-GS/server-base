import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    BadRequestException,
    NotFoundException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../../users/services/user.service";
import { Prisma, User } from "@prisma/client";
import { MailService } from "../../email/services/mail.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
    public constructor(
        private readonly usersService: UserService,
        private readonly mailService: MailService,
        private readonly jwtService: JwtService
    ) {}

    async me(access_token: string) {
        // Decode the token to get the payload
        const decoded = this.jwtService.decode(access_token) as { email: string };

        // Check if the token was decoded correctly and contains the 'email' (subject) field
        if (!decoded?.email) {
            throw new UnauthorizedException("Invalid token");
        }

        // Retrieve the user using the 'email' field (usually the user ID)
        const user = await this.usersService.findOne(decoded.email);

        // Return the username of the user
        return {
            id: user?.id,
            username: user?.username, // Return the user's username
        };
    }

    async signIn(email: string, pass: string) {
        const user = await this.usersService.findOne(email);

        // Ensure user exists and passwords match using bcrypt
        if (!user || !(await bcrypt.compare(pass, user.password))) {
            throw new UnauthorizedException("Invalid credentials");
        }

        // Check if the user is verified
        if (!user.isVerified) {
            throw new UnauthorizedException(
                "Your email is not confirmed yet. Please verify your email."
            );
        }

        // Payload to be included in the JWT token
        const payload = { email: user.email, sub: user.id, roles: user.roles };

        // Generate the access token (short-lived) and refresh token (long-lived)
        const access_token = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: "1h",
        });
        const refresh_token = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: "7d",
        });

        return {
            success: true,
            access_token,
            refresh_token,
        };
    }

    async register(
        data: Prisma.UserCreateInput,
        verificationCode: string
    ): Promise<User> {
        // Check if the user already exists
        const existingUser = await this.usersService.findOne(data.email);
        if (existingUser) {
            throw new ConflictException("User already exists");
        }

        // Hash password before storing it
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create the user with hashed password and unverified status
        const user = await this.usersService.create({
            ...data,
            password: hashedPassword,
            verificationCode,
            isVerified: false,
        });

        // Send confirmation email
        await this.mailService.sendUserConfirmation(user, verificationCode);

        return user;
    }

    async verifyEmailCode(code: string): Promise<User> {
        // Find the user by verification token
        const user = await this.usersService.findByVerificationToken(code);

        // Ensure the token is valid and exists
        if (!user) {
            throw new BadRequestException("Invalid or expired code");
        }

        // Update the user's verification status
        return this.usersService.update(user.id, {
            isVerified: true,
            verificationCode: null, // Remove the token after verification
        });
    }

    async generateVerificationCode(): Promise<string> {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    async refreshAccessToken(refresh_token: string) {
        try {
            // Verify the refresh token and extract the payload
            const payload = await this.jwtService.verifyAsync(refresh_token, {
                secret: process.env.JWT_REFRESH_SECRET,
            });

            // Generate a new access token with the payload
            const newAccessToken = await this.jwtService.signAsync(
                {
                    email: payload.email,
                    sub: payload.sub,
                    roles: payload.roles,
                },
                {
                    secret: process.env.JWT_SECRET,
                    expiresIn: "1h",
                }
            );

            return { access_token: newAccessToken }; // Return the new access token
        } catch (error) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }
    }
    /*******************************
     ** LÓGICA PARA REENVIAR CÓDIGO **
     *******************************/

    // Buscar usuario por email
    async findUserByEmail(email: string): Promise<User> {
        const user = await this.usersService.findOne(email);
        if (!user) {
            throw new NotFoundException("User not found");
        }
        return user;
    }

    // Actualizar el código de verificación del usuario
    async updateVerificationCode(userId: string, newCode: string) {
        return this.usersService.update(userId, {
            verificationCode: newCode,
        });
    }

    // Función principal para reenviar el código de verificación
    async resendVerificationCode(email: string): Promise<{ message: string }> {
        const user = await this.findUserByEmail(email);

        if (user.isVerified) {
            throw new BadRequestException("Email is already verified");
        }

        const newCode = await this.generateVerificationCode();

        await this.updateVerificationCode(user.id, newCode);
        await this.mailService.sendUserConfirmation(user, newCode);

        return {
            message: "A new verification code has been sent to your email",
        };
    }
}
