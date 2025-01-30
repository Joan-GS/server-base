import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../../users/services/user.service";
import { Prisma, User } from "@prisma/client";

@Injectable()
export class AuthService {
    public constructor(
        private readonly usersService: UserService,
        private readonly jwtService: JwtService
    ) {}

    async signIn(email: string, pass: string) {
        const user = await this.usersService.findOne(email);
        if (!user || user.password !== pass) {
            throw new UnauthorizedException("Invalid credentials");
        }
        const payload = { email: user.email, sub: user.id, roles: user.roles };
        return {
            access_token: await this.jwtService.signAsync(payload),
        };
    }

    async register(data: Prisma.UserCreateInput): Promise<User> {
        const existingUser = await this.usersService.findOne(data.email);
        if (existingUser) {
            throw new ConflictException("User already exists");
        }

        return this.usersService.create(data);
    }
}
