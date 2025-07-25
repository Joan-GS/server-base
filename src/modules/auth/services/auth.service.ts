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
import { ClimbService } from "../../climbs/services/climb.service";
import { FollowService } from "../../interactions/services/follow.service";
import { AscensionService } from "../../interactions/services/ascension.service";
import { PrismaService } from "../../common";

@Injectable()
export class AuthService {
    public constructor(
        private readonly prisma: PrismaService,
        private readonly usersService: UserService,
        private readonly followService: FollowService,
        private readonly ascensionService: AscensionService,
        private readonly mailService: MailService,
        private readonly jwtService: JwtService,
        private readonly climbService: ClimbService
    ) { }

    async me(access_token: string) {
        // Decode the token to get the payload
        const decoded = this.jwtService.decode(access_token) as {
            sub: string;
            email: string;
        };

        // Check if the token was decoded correctly and contains the 'email' (subject) field
        if (!decoded?.email) {
            throw new UnauthorizedException("Invalid token");
        }

        // Retrieve the user using the 'email' field (usually the user ID)
        const user = await this.usersService.findByEmail(decoded.email);
        if (!user) {
            throw new UnauthorizedException("User not found");
        }
        const followers = await this.followService.getFollowers(user.id, decoded.sub);
        const following = await this.followService.getFollowing(user.id, decoded.sub);
        const ascensions = await this.ascensionService.getAscensions(user.id);
        const myClimbs = await this.climbService.list(
            1,
            10,
            `{"createdBy": "${user.id}"}`,
            user.id
        );
        return {
            id: user?.id,
            email: user?.email,
            username: user?.username,
            followers: followers,
            following: following,
            ascensions: ascensions,
            myClimbs: myClimbs,
        };
    }

    async getProfile(access_token: string, userId: string) {
        // Decode who is making the request
        const decoded = this.jwtService.decode(access_token) as { email: string; sub: string };

        if (!decoded?.sub) {
            throw new UnauthorizedException("Invalid token");
        }

        const currentUserId = decoded.sub;

        // Find the profile user
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new NotFoundException("User not found");
        }

        const followers = await this.followService.getFollowers(user.id, decoded.sub);
        const following = await this.followService.getFollowing(user.id, decoded.sub);
        const ascensions = await this.ascensionService.getAscensions(user.id);
        const myClimbs = await this.climbService.list(
            1,
            10,
            `{"createdBy": "${user.id}"}`,
            user.id
        );

        // Check if current user is following the profile user
        const isFollowing = await this.followService.isFollowing(currentUserId, user.id);

        return {
            id: user?.id,
            email: user?.email,
            username: user?.username,
            followers,
            following,
            ascensions,
            myClimbs,
            isFollowing,
        };
    }


    async signIn(email: string, pass: string) {
        const user = await this.usersService.findByEmail(email);

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
            access_token,
            refresh_token,
        };
    }

    async register(
        data: Prisma.UserCreateInput,
        verificationCode: string
    ): Promise<User> {
        // Check if the user already exists
        const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });
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
        const user = await this.usersService.findByEmail(email);
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

    /**
     * Request a password reset for a user
     * @param email - User's email address
     */
    async requestPasswordReset(email: string): Promise<void> {
        const user = await this.usersService.findByEmail(email);

        // Don't throw error if user doesn't exist (security measure)
        if (!user) {
            return;
        }

        // Generate reset token (expires in 1 hour)
        const resetToken = await this.jwtService.signAsync(
            { sub: user.id },
            {
                secret: process.env.JWT_RESET_SECRET,
                expiresIn: '1h',
            }
        );

        // Store the token in the database
        await this.usersService.update(user.id, {
            resetToken,
        });

        // Send email with reset link
        await this.mailService.sendPasswordReset(user, resetToken);
    }

    /**
     * Reset user's password using a valid token
     * @param token - Password reset token
     * @param newPassword - New password
     */
    async resetPassword(token: string, newPassword: string): Promise<void> {
        try {
            // Verify the token
            const payload = await this.jwtService.verifyAsync(token, {
                secret: process.env.JWT_RESET_SECRET,
            });

            // Find user by ID from token
            const user = await this.usersService.findById(payload.sub);
            if (!user) {
                throw new BadRequestException('Invalid token');
            }

            // Verify the token matches the one stored in DB and isn't expired
            if (user.resetToken !== token ||
                (user.resetTokenExpiresAt && new Date() > user.resetTokenExpiresAt)) {
                throw new BadRequestException('Invalid or expired token');
            }

            // Validate password strength
            if (newPassword.length < 8) {
                throw new BadRequestException('Password must be at least 8 characters long');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password and clear reset token
            await this.usersService.update(user.id, {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiresAt: null,
            });

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new BadRequestException('Token has expired');
            }
            throw new BadRequestException('Invalid token');
        }
    }
}
