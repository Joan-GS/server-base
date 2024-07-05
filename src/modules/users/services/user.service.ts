import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../common";

@Injectable()
export class UserService {
    public constructor(private readonly prismaService: PrismaService) {}
    async findAll() {
        return this.prismaService.user.findMany();
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
