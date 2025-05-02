import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common';
import { FollowService } from '../../interactions/services/follow.service';
import {
    AlreadyExistsException,
    InvalidFormatException,
    NotFoundException,
} from '../../common/flow/generic.errors';
import { GenericHelpers } from '../../common/flow/helpers';

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
        // Verify user exists using generic helper
        await GenericHelpers.verifyEntityExists(
            (id) => this.prisma.user.findUnique({ where: { id } }),
            'User',
            currentUserId
        );

        // Parse filters using generic helper
        const where = GenericHelpers.parseFilters<Prisma.UserWhereInput>(filters);

        const [users, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                skip: (page - 1) * pageSize,
                take: pageSize,
                where,
            }),
            this.prisma.user.count({ where }),
        ]);

        const data = await this.addFollowingStatus(users, currentUserId);

        return { data, total, page, pageSize };
    }

    /**
     * Finds a user by ID with proper validation
     * @param id User ID (must be valid MongoDB ObjectId)
     * @returns User entity
     * @throws NotFoundException if user doesn't exist
     * @throws InvalidFormatException if ID format is invalid
     */
    async findById(id: string): Promise<User> {
        // ID validation using generic helper
        if (!GenericHelpers.isValidMongoId(id)) {
            throw new InvalidFormatException('ID', id);
        }

        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) throw new NotFoundException('User', id);
        return user;
    }

    /**
     * Finds a user by email with validation
     * @param email Valid email address
     * @returns User entity
     * @throws NotFoundException if user doesn't exist
     */
    async findByEmail(email: string): Promise<User> {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new NotFoundException('User', email);
        return user;
    }

    /**
     * Finds a user by verification code
     * @param code Verification token
     * @returns User entity
     * @throws NotFoundException if user doesn't exist
     */
    async findByVerificationToken(code: string) {
        const user = await this.prisma.user.findUnique({
            where: { verificationCode: code }
        });
        if (!user) throw new NotFoundException('User', 'with this verification code');
        return user;
    }

    /**
     * Creates a new user with validation
     * @param data User creation data
     * @returns Created user
     * @throws AlreadyExistsException if email already registered
     */
    async create(data: Prisma.UserCreateInput): Promise<User> {
        if (await this.prisma.user.findUnique({ where: { email: data.email } })) {
            throw new AlreadyExistsException('User', 'email', data.email);
        }
        return this.prisma.user.create({ data });
    }

    /**
     * Updates an existing user
     * @param id Valid user ID
     * @param data User update data
     * @returns Updated user
     * @throws NotFoundException if user doesn't exist
     */
    async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        // Verify exists using generic helper
        await GenericHelpers.verifyEntityExists(
            (id) => this.prisma.user.findUnique({ where: { id } }),
            'User',
            id
        );

        return this.prisma.user.update({ where: { id }, data });
    }

    /**
     * Deletes a user
     * @param id Valid user ID
     * @returns Deleted user
     * @throws NotFoundException if user doesn't exist
     */
    async delete(id: string): Promise<User> {
        // Verify exists using generic helper
        await GenericHelpers.verifyEntityExists(
            (id) => this.prisma.user.findUnique({ where: { id } }),
            'User',
            id
        );

        return this.prisma.user.delete({ where: { id } });
    }

    // ============ HELPER METHODS ============

    /**
     * Adds following status to each user in the list
     * @param users List of users
     * @param currentUserId ID of the current authenticated user
     * @returns List of users with following status
     */
    private async addFollowingStatus(users: User[], currentUserId: string) {
        return Promise.all(users.map(async user => ({
            ...user,
            isFollowing: user.id === currentUserId
                ? false
                : await this.followService.isFollowing(currentUserId, user.id),
        })));
    }
}