import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { PrismaService } from "../../common";
import { FollowService } from "../../interactions/services/follow.service";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class UserService {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly followService: FollowService,
        private readonly jwtService: JwtService
    ) {}

    /**
     * Utility function to handle common pagination and filtering logic
     */
    private parseFilters(filters?: string): Prisma.UserWhereInput {
        let where: Prisma.UserWhereInput = {};

        if (filters) {
            try {
                where = JSON.parse(filters);
            } catch (error) {
                throw new BadRequestException(
                    "Invalid JSON format for filters"
                );
            }
        }

        return where;
    }

    /**
     * List users with pagination and filters
     */
 /**
 * List users with pagination and filters including following status
 */
 async list(
    access_token: string,
    page: number,
    pageSize: number,
    filters?: string,
): Promise<{
    data: (User & { isFollowing: boolean })[];
    total: number;
    page: number;
    pageSize: number;
}> {
    const skip = (page - 1) * pageSize;
    const take = Number(pageSize);
    const where = this.parseFilters(filters);

    // Decode and validate token
    let currentUserId: string;
    try {
        const decoded = this.jwtService.decode(access_token) as { sub: string };
        if (!decoded?.sub) {
            throw new UnauthorizedException("Invalid token payload");
        }
        currentUserId = decoded.sub;
    } catch (error) {
        throw new UnauthorizedException("Invalid token");
    }

    // Get current user
    const currentUser = await this.findOneId(currentUserId);
    if (!currentUser) {
        throw new UnauthorizedException("User not found");
    }

    // Get paginated users
    const [users, total] = await this.prismaService.$transaction([
        this.prismaService.user.findMany({
            where,
            skip,
            take,
           
        }),
        this.prismaService.user.count({ where }),
    ]);

    // Add following status for each user
    const usersWithFollowingStatus = await Promise.all(
        users.map(async (user) => {
            // Skip follow check for current user
            if (user.id === currentUserId) {
                return {
                    ...user,
                    isFollowing: false,
                };
            }

            // Now currentUserId is guaranteed to be string
            const isFollowing = await this.followService.isFollowing(currentUserId, user.id);
            return {
                ...user,
                isFollowing,
            };
        })
    );

    return {
        data: usersWithFollowingStatus,
        total,
        page,
        pageSize,
    };
}

    /**
     * Find a user by their email
     */
    async findOne(email: string) {
        return this.prismaService.user.findUnique({
            where: { email: email },
        });
    }

    /**
     * Find a user by their email
     */
    async findOneId(id: string) {
        return this.prismaService.user.findUnique({
            where: { id: id },
        });
    }

    /**
     * Create a new user
     */
    async create(data: Prisma.UserCreateInput) {
        return this.prismaService.user.create({
            data,
        });
    }

    /**
     * Update an existing user by ID
     */
    async update(id: string, data: Prisma.UserUpdateInput) {
        return this.prismaService.user.update({
            where: { email: id },
            data,
        });
    }

    /**
     * Delete a user by ID
     */
    async delete(id: string) {
        return this.prismaService.user.delete({
            where: { id },
        });
    }

    /**
     * Find a user by their verification code
     */
    async findByVerificationToken(code: string) {
        return this.prismaService.user.findUnique({
            where: { verificationCode: code },
        });
    }
}
