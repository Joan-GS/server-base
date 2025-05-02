import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../common";
import { Prisma } from "@prisma/client";
import { GenericHelpers } from "../../common/flow/helpers";

@Injectable()
export class LikeService {
    constructor(private readonly prisma: PrismaService) { }


    /**
     * Creates a like for a climb by a user.
     *
     * @param climbId - The ID of the climb being liked
     * @param userId - The ID of the user liking the climb
     * @returns The created Like record
     */
    async create(climbId: string, userId: string): Promise<Prisma.LikeGetPayload<any>> {
        await GenericHelpers.verifyEntityExists(
            (id) => this.prisma.climb.findUnique({ where: { id } }),
            'Climb',
            climbId
        );

        const existingLike = await this.prisma.like.findFirst({
            where: { climbId, userId },
        });

        if (existingLike) {
            throw new ConflictException('User already liked this climb');
        }

        return this.prisma.$transaction(async (tx) => {
            const like = await tx.like.create({
                data: { climbId, userId },
            });

            await tx.climb.update({
                where: { id: climbId },
                data: {
                    recentLikes: {
                        set: [userId, ...(await this.getRecentLikes(climbId, tx))],
                    },
                    likesCount: { increment: 1 },
                },
            });

            return like;
        });
    }

    /**
    * Retrieves the most recent user IDs who liked a climb.
    *
    * @param climbId - The ID of the climb
    * @param tx - Prisma transaction client
    * @returns A list of up to 4 recent user IDs who liked the climb
    */
    private async getRecentLikes(climbId: string, tx: Prisma.TransactionClient) {
        const recent = await tx.like.findMany({
            where: { climbId },
            orderBy: { createdAt: 'desc' },
            take: 4,
            select: { userId: true },
        });
        return recent.map(like => like.userId);
    }

    /**
    * Removes a like from a climb by a user.
    *
    * @param climbId - The ID of the climb
    * @param userId - The ID of the user who wants to remove the like
    * @returns The deleted Like record
    */
    async remove(climbId: string, userId: string): Promise<Prisma.LikeGetPayload<any>> {
        const like = await this.prisma.like.findFirst({
            where: { climbId, userId },
        });

        if (!like) {
            throw new NotFoundException('Like not found');
        }

        return this.prisma.$transaction(async (tx) => {
            await tx.like.delete({
                where: { id: like.id },
            });

            await tx.climb.update({
                where: { id: climbId },
                data: {
                    recentLikes: {
                        set: (await this.getRecentLikes(climbId, tx)),
                    },
                    likesCount: { decrement: 1 },
                },
            });

            return like;
        });
    }

    /**
   * Checks whether a user has liked a specific climb.
   *
   * @param climbId - The ID of the climb
   * @param userId - The ID of the user
   * @returns True if the user has liked the climb, otherwise false
   */
    async isLiked(climbId: string, userId: string): Promise<boolean> {
        return !!(await this.prisma.like.findFirst({
            where: { climbId, userId },
        }));
    }
}