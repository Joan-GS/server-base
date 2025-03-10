import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common";

@Injectable()
export class CommentService {
    constructor(private readonly prismaService: PrismaService) {}

    // Create a comment on a climb
    async create(climbId: string, userId: string, content: string) {
        return this.prismaService.comment.create({
            data: {
                climbId,
                userId,
                content,
            },
        });
    }

    async remove(commentId: string): Promise<void> {
        await this.prismaService.comment.delete({
            where: { id: commentId },
        });
    }
}
