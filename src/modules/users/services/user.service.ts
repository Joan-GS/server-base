import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common";

@Injectable()
export class UserService {
    public constructor(private readonly prismaService: PrismaService) {}
    async list(page: number, pageSize: number, filters?: string) {
        // Calculate skip and take for pagination
        const skip = (page - 1) * pageSize;
        const take = Number(pageSize);
        let where: Prisma.UserWhereInput = {};

        // Parse filters if present
        if (filters) {
            try {
                where = JSON.parse(filters);
            } catch (error) {
                throw new BadRequestException(
                    "Invalid JSON format for filters"
                );
            }
        }

        // Perform transaction to fetch users and total count
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

        // Return paginated results
        return {
            data: users,
            total,
            page,
            pageSize,
        };
    }

    async findOne(id: string) {
        return this.prismaService.user.findUnique({
            where: { id },
        });
    }

    async create(data: Prisma.UserCreateInput) {
        return this.prismaService.user.create({
            data,
        });
    }

    async update(id: string, data: Prisma.UserUpdateInput) {
        return this.prismaService.user.update({
            where: { id },
            data,
        });
    }

    async delete(id: string) {
        return this.prismaService.user.delete({
            where: { id },
        });
    }
}
