import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common';
import { FollowService } from '../../interactions/services/follow.service';
import {
    UserNotFoundException,
    UserAlreadyExistsException,
    InvalidIdFormatException,
    InvalidFiltersException,
} from '../flow/user.errors';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly followService: FollowService,
    ) { }

    /**
     * Retrieves a paginated list of users with following status
     * @param token JWT token for authentication
     * @param page Page number (default: 1)
     * @param pageSize Items per page (default: 10)
     * @param filters Optional JSON string with Prisma filters
     * @returns Paginated user list with following status
     */
    async list(
        currentUserId: string,
        page: number = 1,
        pageSize: number = 10,
        filters?: string,
    ) {
        await this.verifyUserExists(currentUserId);

        const [users, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                skip: (page - 1) * pageSize,
                take: pageSize,
                where: this.parseFilters(filters),
            }),
            this.prisma.user.count({ where: this.parseFilters(filters) }),
        ]);

        const data = await this.addFollowingStatus(users, currentUserId);

        return { data, total, page, pageSize };
    }

    /**
     * Finds a user by ID with proper validation
     * @param id User ID (must be valid MongoDB ObjectId)
     * @returns User entity
     * @throws UserNotFoundException if user doesn't exist
     * @throws InvalidIdFormatException if ID format is invalid
     */
    async findById(id: string): Promise<User> {
        if (!this.isValidId(id)) {
            throw new InvalidIdFormatException(id);
        }

        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new UserNotFoundException(id);
        return user;
    }

    /**
     * Finds a user by email with validation
     * @param email Valid email address
     * @returns User entity
     * @throws UserNotFoundException if user doesn't exist
     */
    async findByEmail(email: string): Promise<User> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new UserNotFoundException(email);
        return user;
    }

    /**
     * Finds a user by verification code
     * @param code Verification token
     * @returns User entity
     * @throws UserNotFoundException if user doesn't exist
     */
    async findByVerificationToken(code: string) {
        const user = await this.prisma.user.findUnique({
            where: { verificationCode: code }
        });
        if (!user) throw new UserNotFoundException('with this verification code');
        return user;
    }

    /**
     * Creates a new user with validation
     * @param data User creation data
     * @returns Created user
     * @throws UserAlreadyExistsException if email already registered
     */
    async create(data: Prisma.UserCreateInput): Promise<User> {
        if (await this.prisma.user.findUnique({ where: { email: data.email } })) {
            throw new UserAlreadyExistsException(data.email);
        }
        return this.prisma.user.create({ data });
    }

    /**
     * Updates an existing user
     * @param id Valid user ID
     * @param data User update data
     * @returns Updated user
     * @throws UserNotFoundException if user doesn't exist
     */
    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        await this.verifyUserExists(id);
        return this.prisma.user.update({ where: { id }, data });
    }

    /**
     * Deletes a user
     * @param id Valid user ID
     * @returns Deleted user
     * @throws UserNotFoundException if user doesn't exist
     */
    async delete(id: string): Promise<User> {
        await this.verifyUserExists(id);
        return this.prisma.user.delete({ where: { id } });
    }

    // ============ HELPER METHODS ============

    private async verifyUserExists(id: string): Promise<void> {
        if (!await this.findById(id)) {
            throw new UserNotFoundException(id);
        }
    }

    private parseFilters(filters?: string): Prisma.UserWhereInput {
        try {
            return filters ? JSON.parse(filters) : {};
        } catch {
            throw new InvalidFiltersException();
        }
    }

    private async addFollowingStatus(users: User[], currentUserId: string) {
        return Promise.all(users.map(async user => ({
            ...user,
            isFollowing: user.id === currentUserId
                ? false
                : await this.followService.isFollowing(currentUserId, user.id),
        })));
    }

    private isValidId(id: string): boolean {
        return /^[0-9a-fA-F]{24}$/.test(id);
    }
}