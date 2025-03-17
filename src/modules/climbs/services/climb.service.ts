import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from "@nestjs/common";
import { Climb, Prisma } from "@prisma/client";
import { PrismaService } from "../../common";

@Injectable()
export class ClimbService {
    public constructor(private readonly prismaService: PrismaService) {}

    // Utility function to parse query filters (optional filters passed as JSON string)
    private parseFilters(filters?: string): Prisma.ClimbWhereInput {
        let where: Prisma.ClimbWhereInput = {};

        if (filters) {
            try {
                where = JSON.parse(filters);
            } catch (error) {
                throw new BadRequestException(
                    "Invalid JSON format for filters"
                );
            }
        }

        return where;
    }

    // Utility function to ensure a climb exists by its ID
    async ensureClimbExists(id: string): Promise<Climb> {
        const climb = await this.prismaService.climb.findUnique({
            where: { id },
            include: {
                ascensions: true, // Include ascensions in the response
                likes: true, // Include likes in the response
                comments: true, // Include comments in the response
            },
        });

        if (!climb) {
            throw new NotFoundException(`Climb with id ${id} not found`);
        }

        return climb;
    }

    // List climbs with pagination and filters
    async list(page: number, pageSize: number, filters?: string) {
        const skip = (page - 1) * pageSize;
        const take = Number(pageSize);
        const where = this.parseFilters(filters);

        // Use transaction to perform both queries simultaneously
        const [climbs, total] = await this.prismaService.$transaction([
            this.prismaService.climb.findMany({
                where,
                skip,
                take,
                include: {
                    ascensions: true, // Include ascensions in the response
                    likes: true, // Include likes in the response
                    comments: true, // Include comments in the response
                },
            }),
            this.prismaService.climb.count({
                where,
            }),
        ]);

        return {
            data: climbs,
            total,
            page,
            pageSize,
        };
    }

    // Find a climb by its ID
    async findOne(id: string) {
        return this.prismaService.climb.findUnique({
            where: { id },
            include: {
                ascensions: true,
                likes: true,
                comments: true,
            },
        });
    }

    // Create a new climb
    async create(data: Prisma.ClimbCreateInput) {
        return this.prismaService.climb.create({
            data,
            include: {
                ascensions: true,
                likes: true,
                comments: true,
            },
        });
    }

    // Update an existing climb by ID
    async update(id: string, data: Prisma.ClimbUpdateInput) {
        return this.prismaService.climb.update({
            where: { id },
            data,
            include: {
                ascensions: true,
                likes: true,
                comments: true,
            },
        });
    }

    // Delete a climb by ID
    async delete(id: string) {
        return this.prismaService.climb.delete({
            where: { id },
            include: {
                ascensions: true,
                likes: true,
                comments: true,
            },
        });
    }

    // Updates the list of recent likes, keeping only the last 5, and increments the likes count
    async updateRecentLikes(climbId: string, userId: string) {
        const climb = await this.prismaService.climb.findUnique({
            where: { id: climbId },
            select: { recentLikes: true, likesCount: true },
        });

        if (!climb) return;

        let updatedLikes = [userId, ...climb.recentLikes];
        if (updatedLikes.length > 5) {
            updatedLikes = updatedLikes.slice(0, 5);
        }

        await this.prismaService.climb.update({
            where: { id: climbId },
            data: {
                recentLikes: updatedLikes,
                likesCount: climb.likesCount + 1,
            },
        });
    }

    // Removes a like from recent likes and decrements the likes count
    async removeRecentLike(climbId: string, userId: string) {
        const climb = await this.prismaService.climb.findUnique({
            where: { id: climbId },
            select: { recentLikes: true, likesCount: true },
        });

        if (!climb) return;

        const updatedLikes = climb.recentLikes.filter((id) => id !== userId);

        await this.prismaService.climb.update({
            where: { id: climbId },
            data: {
                recentLikes: updatedLikes,
                likesCount: Math.max(0, climb.likesCount - 1),
            },
        });
    }

    // Updates the list of recent comments, keeping only the last 5, and increments the comments count
    async updateRecentComments(climbId: string, commentId: string) {
        const climb = await this.prismaService.climb.findUnique({
            where: { id: climbId },
            select: { recentComments: true, commentsCount: true },
        });

        if (!climb) return;

        let updatedComments = [commentId, ...climb.recentComments];
        if (updatedComments.length > 5) {
            updatedComments = updatedComments.slice(0, 5);
        }

        await this.prismaService.climb.update({
            where: { id: climbId },
            data: {
                recentComments: updatedComments,
                commentsCount: climb.commentsCount + 1,
            },
        });
    }

    // Removes a comment from recent comments and decrements the comments count
    async removeRecentComment(climbId: string, commentId: string) {
        const climb = await this.prismaService.climb.findUnique({
            where: { id: climbId },
            select: { recentComments: true, commentsCount: true },
        });

        if (!climb) return;

        const updatedComments = climb.recentComments.filter(
            (id) => id !== commentId
        );

        await this.prismaService.climb.update({
            where: { id: climbId },
            data: {
                recentComments: updatedComments,
                commentsCount: Math.max(0, climb.commentsCount - 1),
            },
        });
    }
}
