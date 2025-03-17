import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common";

@Injectable()
export class AscensionService {
    constructor(private readonly prismaService: PrismaService) {}

    // Create an ascension
    async create(climbId: string, userId: string) {
        return this.prismaService.ascension.create({
            data: {
                climbId,
                userId,
            },
        });
    }
}
