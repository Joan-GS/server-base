import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common";

@Injectable()
export class LikeService {
    constructor(private readonly prismaService: PrismaService) {}

    // Adds a like to a climb with a transaction
    async create(climbId: string, userId: string) {
        return this.prismaService.$transaction(async (prisma) => {
            const climb = await prisma.climb.findUnique({
                where: { id: climbId },
                select: { recentLikes: true, likesCount: true },
            });

            if (!climb) throw new Error("Climb not found");

            // Prevent a user from liking more than once
            const existingLike = await prisma.like.findFirst({
                where: { climbId, userId },
            });

            if (existingLike) throw new Error("User already liked this climb");

            // Add the new user to the beginning of the array
            let updatedLikes = [userId, ...climb.recentLikes];
            if (updatedLikes.length > 5) {
                updatedLikes = updatedLikes.slice(0, 5);
            }

            // Create the like and update the climb in the same transaction
            const like = await prisma.like.create({
                data: { climbId, userId },
            });

            await prisma.climb.update({
                where: { id: climbId },
                data: {
                    recentLikes: updatedLikes,
                    likesCount: climb.likesCount + 1,
                },
            });

            return like;
        });
    }

    // Removes a like from a climb with a transaction
    async remove(climbId: string, userId: string) {
        return this.prismaService.$transaction(async (prisma) => {
            const climb = await prisma.climb.findUnique({
                where: { id: climbId },
                select: { recentLikes: true, likesCount: true },
            });

            if (!climb) throw new Error("Climb not found");

            // Find the like before deleting it
            const like = await prisma.like.findFirst({
                where: { climbId, userId },
            });

            if (!like) throw new Error("Like not found");

            console.log("Recent Likes Before Filter:", climb.recentLikes);
console.log("User ID to Remove:", userId);


            // Remove the user from the recent likes array
            const updatedLikes = climb.recentLikes.filter(
                (id) => id !== userId
            );

            // Delete the like
            await prisma.like.delete({
                where: { id: like.id },
            });

            // Update the climb
            await prisma.climb.update({
                where: { id: climbId },
                data: {
                    recentLikes: updatedLikes,
                    likesCount: Math.max(0, climb.likesCount - 1),
                },
            });

            return like;
        });
    }

    async isLiked(climbId: string, userId: string): Promise<boolean> {
        const existingLike = await this.prismaService.like.findFirst({
            where: { climbId, userId },
        });
        return !!existingLike;
    }
}
