import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common";

@Injectable()
export class CommentService {
    constructor(private readonly prismaService: PrismaService) {}

    // Add a comment with a transaction
    async create(climbId: string, userId: string, content: string) {
        return this.prismaService.$transaction(async (prisma) => {
            const comment = await prisma.comment.create({
                data: { climbId, userId, content },
            });

            const climb = await prisma.climb.findUnique({
                where: { id: climbId },
                select: { recentComments: true, commentsCount: true },
            });

            if (!climb) throw new Error("Climb not found");

            // Add the new comment at the beginning of the array
            let updatedComments = [comment.id, ...climb.recentComments];
            if (updatedComments.length > 5) {
                updatedComments = updatedComments.slice(0, 5);
            }

            await prisma.climb.update({
                where: { id: climbId },
                data: {
                    recentComments: updatedComments,
                    commentsCount: climb.commentsCount + 1,
                },
            });

            return comment;
        });
    }

    // Delete a comment with a transaction
    async remove(climbId: string, commentId: string) {
        return this.prismaService.$transaction(async (prisma) => {
            // Find the comment before deleting it
            const comment = await prisma.comment.findUnique({
                where: { id: commentId },
            });
    
            if (!comment) {
                throw new Error("Comment not found");
            }
    
            const climb = await prisma.climb.findUnique({
                where: { id: climbId },
                select: { recentComments: true, commentsCount: true },
            });
    
            if (!climb) {
                throw new Error("Climb not found");
            }
    
            // Remove the comment from the recent comments array
            const updatedComments = climb.recentComments.filter((id) => id !== commentId);
    
            // Delete the comment
            await prisma.comment.delete({
                where: { id: commentId },
            });
    
            // Update the climb with the new recent comments and count
            await prisma.climb.update({
                where: { id: climbId },
                data: {
                    recentComments: updatedComments,
                    commentsCount: Math.max(0, climb.commentsCount - 1),
                },
            });
    
            // Return the deleted comment
            return comment;
        });
    }
}
