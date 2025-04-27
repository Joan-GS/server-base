import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common";

@Injectable()
export class FollowService {
    constructor(private readonly prismaService: PrismaService) {}

    async followUser(followerId: string, followingId: string) {
        if (followerId === followingId) {
            throw new Error("Users cannot follow themselves");
        }

        const existingFollow = await this.prismaService.follow.findFirst({
            where: { follower: followerId, following: followingId },
        });

        if (existingFollow) {
            throw new Error("Already following this user");
        }

        return this.prismaService.follow.create({
            data: { follower: followerId, following: followingId },
        });
    }

    async unfollowUser(followerId: string, followingId: string) {
        const follow = await this.prismaService.follow.findFirst({
            where: { follower: followerId, following: followingId },
        });

        if (!follow) {
            throw new Error("Not following this user");
        }

        return this.prismaService.follow.delete({
            where: { id: follow.id },
        });
    }

    async getFollowers(userId: string) {
        return this.prismaService.follow.findMany({
            where: { following: userId },
            include: { followerUser: true },
        });
    }

    async getFollowing(userId: string) {
        return this.prismaService.follow.findMany({
            where: { follower: userId },
            include: { followingUser: true },
        });
    }

    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        const follow = await this.prismaService.follow.findFirst({
            where: {
                follower: followerId,
                following: followingId,
            },
        });
        return !!follow;
    }
    
}
