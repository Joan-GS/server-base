import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common";

@Injectable()
export class LikeService {
    constructor(private readonly prismaService: PrismaService) {}

    // Create a like
    async create(climbId: string, userId: string) {
        return this.prismaService.like.create({
            data: {
                climbId,
                userId,
            },
        });
    }

    // Remove a like
    async remove(climbId: string, userId: string) {
        await this.prismaService.like.deleteMany({
            where: { climbId, userId },
        });
    }
}
