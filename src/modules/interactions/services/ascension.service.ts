import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "../../common";
import { Prisma } from "@prisma/client";
import { ASCENSION_TYPE } from "@joan16/shared-base";
import { GenericHelpers } from "../../common/flow/helpers";
import { PaginationResponse } from "../../../utils/generic.types.utils";

@Injectable()
export class AscensionService {
    constructor(private readonly prisma: PrismaService) { }

    /**
    * Creates a new ascension for a user on a specific climb.
    *
    * @param climbId - The ID of the climb being ascended
    * @param userId - The ID of the user making the ascension
    * @param ascensionType - The type of ascension (e.g., REDPOINT, FLASH)
    * @returns The created Ascension record
    */
    async create(
        climbId: string,
        userId: string,
        ascensionType: ASCENSION_TYPE
    ): Promise<Prisma.AscensionGetPayload<any>> {
        await GenericHelpers.verifyEntityExists(
            (id) => this.prisma.climb.findUnique({ where: { id } }),
            'Climb',
            climbId
        );

        const existing = await this.prisma.ascension.findFirst({
            where: { climbId, userId },
        });

        if (existing) {
            throw new ConflictException('User already ascended this climb');
        }

        return this.prisma.ascension.create({
            data: { climbId, userId, ascensionType },
        });
    }

    /**
     * Retrieves a paginated list of a user's ascensions with optional filters.
     *
     * @param userId - The ID of the user whose ascensions are being retrieved
     * @param page - The page number for pagination (default: 1)
     * @param pageSize - The number of results per page (default: 10)
     * @param filters - Optional filter string to refine the results
     * @returns A paginated response containing ascensions and metadata
     */
    async getAscensions(
        userId: string,
        page: number = 1,
        pageSize: number = 10,
        filters?: string
    ): Promise<PaginationResponse<Prisma.AscensionGetPayload<any>>> {
        await GenericHelpers.verifyEntityExists(
            (id) => this.prisma.user.findUnique({ where: { id } }),
            'User',
            userId
        );

        const where = GenericHelpers.parseFilters<Prisma.AscensionWhereInput>(filters);

        where.userId = userId;

        const [data, total] = await this.prisma.$transaction([
            this.prisma.ascension.findMany({
                where,
                include: { climb: true },
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.ascension.count({ where }),
        ]);

        return { data, total, page, pageSize };
    }

}