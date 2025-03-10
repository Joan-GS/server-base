import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
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
                throw new BadRequestException("Invalid JSON format for filters");
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
                likes: true,      // Include likes in the response
                comments: true,   // Include comments in the response
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
}
