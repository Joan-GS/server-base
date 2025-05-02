import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common";
import { Prisma } from "@prisma/client";
import { GenericHelpers } from "../../common/flow/helpers";

@Injectable()
export class CommentService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Creates a new comment on a specific climb and updates climb metadata.
     *
     * @param climbId - The ID of the climb being commented on
     * @param userId - The ID of the user creating the comment
     * @param content - The content of the comment
     * @returns The created Comment record
     */
    async create(
        climbId: string,
        userId: string,
        content: string
    ): Promise<Prisma.CommentGetPayload<any>> {
        await GenericHelpers.verifyEntityExists(
            (id) => this.prisma.climb.findUnique({ where: { id } }),
            'Climb',
            climbId
        );

        return this.prisma.$transaction(async (tx) => {
            const comment = await tx.comment.create({
                data: { climbId, userId, content },
            });

            await tx.climb.update({
                where: { id: climbId },
                data: {
                    recentComments: {
                        set: [comment.id, ...(await this.getRecentComments(climbId, tx))],
                    },
                    commentsCount: { increment: 1 },
                },
            });

            return comment;
        });
    }

    /**
    * Retrieves the most recent 4 comment IDs for a climb.
    *
    * @param climbId - The ID of the climb
    * @param tx - The Prisma transaction client
    * @returns An array of recent comment IDs
    */
    private async getRecentComments(climbId: string, tx: Prisma.TransactionClient) {
        const recent = await tx.comment.findMany({
            where: { climbId },
            orderBy: { createdAt: 'desc' },
            take: 4,
            select: { id: true },
        });
        return recent.map(comment => comment.id);
    }

    /**
    * Removes a comment and updates the related climb's metadata accordingly.
    *
    * @param commentId - The ID of the comment to remove
    * @returns The deleted Comment record
    */
    async remove(commentId: string): Promise<Prisma.CommentGetPayload<any>> {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new NotFoundException('Comment not found');
        }

        return this.prisma.$transaction(async (tx) => {
            await tx.comment.delete({
                where: { id: commentId },
            });

            await tx.climb.update({
                where: { id: comment.climbId },
                data: {
                    recentComments: {
                        set: (await this.getRecentComments(comment.climbId, tx)),
                    },
                    commentsCount: { decrement: 1 },
                },
            });

            return comment;
        });
    }
}