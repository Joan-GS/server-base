import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common";

@Injectable()
export class UserService {
    public constructor(private readonly prismaService: PrismaService) {}

    /**
     * Utility function to handle common pagination and filtering logic
     */
    private parseFilters(filters?: string): Prisma.UserWhereInput {
        let where: Prisma.UserWhereInput = {};

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

    /**
     * List users with pagination and filters
     */
    async list(page: number, pageSize: number, filters?: string) {
        const skip = (page - 1) * pageSize;
        const take = Number(pageSize);
        const where = this.parseFilters(filters);

        // Use transaction to perform both queries simultaneously
        const [users, total] = await this.prismaService.$transaction([
            this.prismaService.user.findMany({
                where,
                skip,
                take,
            }),
            this.prismaService.user.count({
                where,
            }),
        ]);

        return {
            data: users,
            total,
            page,
            pageSize,
        };
    }

    /**
     * Find a user by their email
     */
    async findOne(email: string) {
        return this.prismaService.user.findUnique({
            where: { email: email },
        });
    }

    /**
     * Create a new user
     */
    async create(data: Prisma.UserCreateInput) {
        return this.prismaService.user.create({
            data,
        });
    }

    /**
     * Update an existing user by ID
     */
    async update(id: string, data: Prisma.UserUpdateInput) {
        return this.prismaService.user.update({
            where: { email: id },
            data,
        });
    }

    /**
     * Delete a user by ID
     */
    async delete(id: string) {
        return this.prismaService.user.delete({
            where: { id },
        });
    }

    /**
     * Find a user by their verification code
     */
    async findByVerificationToken(code: string) {
        return this.prismaService.user.findUnique({
            where: { verificationCode: code },
        });
    }
}
