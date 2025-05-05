import { Injectable, ConflictException, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../common";
import { Prisma } from "@prisma/client";
import { GenericHelpers } from "../../common/flow/helpers";
import { PaginationResponse } from "../../../utils/generic.types.utils";

@Injectable()
export class FollowService {
    constructor(private readonly prisma: PrismaService) { }

    /**
   * Allows a user to follow another user.
   *
   * @param followerId - The ID of the user who wants to follow
   * @param followingId - The ID of the user to be followed
   * @returns The created Follow record with included followingUser
   */
    async followUser(followerId: string, followingId: string): Promise<Prisma.FollowGetPayload<any>> {
        if (followerId === followingId) {
            throw new BadRequestException("Cannot follow yourself");
        }

        await GenericHelpers.verifyEntityExists(
            (id) => this.prisma.user.findUnique({ where: { id } }),
            'User',
            followingId
        );

        const existing = await this.prisma.follow.findFirst({
            where: {
                follower: followerId,
                following: followingId
            },
        });

        if (existing) {
            throw new ConflictException("Already following this user");
        }

        return this.prisma.follow.create({
            data: {
                follower: followerId,
                following: followingId
            },
            include: { followingUser: true },
        });
    }

    /**
     * Allows a user to unfollow another user.
     *
     * @param followerId - The ID of the user who wants to unfollow
     * @param followingId - The ID of the user to be unfollowed
     * @returns The deleted Follow record with included followingUser
     */
    async unfollowUser(followerId: string, followingId: string): Promise<Prisma.FollowGetPayload<any>> {
        const follow = await this.prisma.follow.findFirst({
            where: {
                follower: followerId,
                following: followingId
            },
        });

        if (!follow) {
            throw new NotFoundException("Follow relationship not found");
        }

        return this.prisma.follow.delete({
            where: { id: follow.id },
            include: { followingUser: true },
        });
    }

    /**
     * Allows a user to remove one of their followers.
     *
     * @param followerId - The ID of the follower to remove
     * @param followingId - The ID of the current user
     * @returns The deleted Follow record
     */
    async removeFollower(followerId: string, followingId: string): Promise<Prisma.FollowGetPayload<any>> {
        const follow = await this.prisma.follow.findFirst({
            where: {
                follower: followerId,
                following: followingId,
            },
        });

        if (!follow) {
            throw new NotFoundException("Follow relationship not found");
        }

        return this.prisma.follow.delete({
            where: { id: follow.id },
            include: { followerUser: true },
        });
    }


    /**
     * Retrieves a paginated list of followers for a user.
     *
     * @param userId - The ID of the user whose followers are being requested
     * @param page - The page number for pagination (default: 1)
     * @param pageSize - The number of items per page (default: 10)
     * @returns A paginated response containing the list of followers
     */
    async getFollowers(userId: string,
        page: number = 1,
        pageSize: number = 10
    ): Promise<PaginationResponse<any>> {
        await GenericHelpers.verifyEntityExists(
            (id) => this.prisma.user.findUnique({ where: { id } }),
            'User',
            userId
        );

        const [data1, total] = await this.prisma.$transaction([
            this.prisma.follow.findMany({
                where: { following: userId },
                include: { followerUser: true },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.follow.count({ where: { following: userId } }),
        ]);

        const data = await this.addFollowingStatus(data1, userId);


        return { data, total, page, pageSize };
    }

    /**
    * Retrieves a paginated list of users that a specific user is following.
    *
    * @param userId - The ID of the user whose followings are being requested
    * @param page - The page number for pagination (default: 1)
    * @param pageSize - The number of items per page (default: 10)
    * @returns A paginated response containing the list of followings
    */
    async getFollowing(userId: string,
        page: number = 1,
        pageSize: number = 10
    ): Promise<PaginationResponse<any>> {
        await GenericHelpers.verifyEntityExists(
            (id) => this.prisma.user.findUnique({ where: { id } }),
            'User',
            userId
        );

        const [data1, total] = await this.prisma.$transaction([
            this.prisma.follow.findMany({
                where: { follower: userId },
                include: { followingUser: true },
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
            this.prisma.follow.count({ where: { follower: userId } }),
        ]);

        const data = await this.addFollowingStatus(data1, userId);


        return { data, total, page, pageSize };
    }

    /**
    * Checks whether a user is following another user.
    *
    * @param followerId - The ID of the follower
    * @param followingId - The ID of the user being followed
    * @returns True if the follower is following the other user, otherwise false
    */
    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        return !!(await this.prisma.follow.findFirst({
            where: {
                follower: followerId,
                following: followingId
            },
        }));
    }


    // ============ HELPER METHODS ============

    /**
     * Adds following status to each user in the list
     * @param users List of users
     * @param currentUserId ID of the current authenticated user
     * @returns List of users with following status
     */
    private async addFollowingStatus(users: any[], currentUserId: string) {
        return Promise.all(users.map(async user => ({
            ...user,
            isFollowing: user.followingUser?.id === currentUserId
                ? false
                : await this.isFollowing(currentUserId, user.followingUser?.id),
        })));
    }
}