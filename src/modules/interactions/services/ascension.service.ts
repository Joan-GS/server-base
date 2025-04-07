import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common";
import { ASCENSION_TYPE } from "@joan16/shared-base";

@Injectable()
export class AscensionService {
    constructor(private readonly prismaService: PrismaService) {}

    // Create an ascension
    async create(
        climbId: string,
        userId: string,
        ascensionType: ASCENSION_TYPE
    ) {
        return this.prismaService.ascension.create({
            data: {
                climbId,
                userId,
                ascensionType,
            },
        });
    }

    async getAscensions(userId: string) {
        return this.prismaService.ascension.findMany({
            where: { userId: userId },
        });
    }
}
