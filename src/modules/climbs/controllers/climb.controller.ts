import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    NotFoundException,
    Query,
    UseGuards,
    Headers,
    UnauthorizedException,
} from "@nestjs/common";
import { Prisma, Climb } from "@prisma/client";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ClimbService } from "../services/climb.service";
import { ClimbPipe } from "../flow/climb.pipe";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/utils/roles.guard";
import { PaginationResponse } from "../../../utils/generic.types.utils";
import { AuthService } from "../../auth/services/auth.service";
import { ROLE } from "@joan16/shared-base";
import { AscensionService } from "../../interactions/services/ascension.service";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";

@ApiTags("climbs")
@Controller("climbs")
@Roles(ROLE.USER)
@UseGuards(RolesGuard)
export class ClimbController {
    constructor(
        private readonly authService: AuthService,
        private readonly climbService: ClimbService,
        private readonly ascensionService: AscensionService
    ) { }

    /************
     ** METHODS **
     *************/

    // Utility function to ensure that a climb exists
    public async ensureClimbExists(id: string, currentUserId?: string): Promise<Climb & { isAscended: boolean }> {
        const climb = await this.climbService.findOne(id);
        if (!climb) {
            throw new NotFoundException(`Climb with id ${id} not found`);
        }

        // Si no hay usuario autenticado, devolver false en isAscended
        if (!currentUserId) {
            return {
                ...climb,
                isAscended: false
            };
        }

        // Verificar si el usuario ha ascendido esta ruta
        const ascent = await this.ascensionService.hasUserAscended(id, currentUserId);

        return {
            ...climb,
            isAscended: ascent.hasAscended // Convertir a booleano (true si existe un ascent)
        };
    }

    /************
     ** ACTIONS **
     *************/

    /**
     * GET /climbs - List climbs with pagination and filters
     *
     * @param page - Page number (default: 1)
     * @param pageSize - Items per page (default: 10)
     * @param filters - Optional query filters
     * @returns Paginated list of climbs
     */
    @Get()
    @ApiOperation({ summary: "List climbs" })
    async list(
        @Query("page") page: number = 1,
        @Query("pageSize") pageSize: number = 10,
        @Query("filters") filters?: string,
        @Headers("authorization") authorization?: string
    ): Promise<PaginationResponse<Climb>> {
        if (!authorization) {
            throw new UnauthorizedException("Missing authorization header");
        }

        const token = authorization.split(" ")[1];

        const user = await this.authService.me(token);
        return this.climbService.list(page, pageSize, filters, user.id);
    }

    /**
     * GET /climbs/:id - Retrieve a climb by ID, with relationships
     *
     * @param id - Climb ID
     * @returns Climb data with relations
     * @throws NotFoundException if climb is not found
     */
    @Get(":id")
    @ApiOperation({ summary: "Get a climb by ID" })
    async findOne(@CurrentUser() currentUser: { sub: string }
    , @Param("id") id: string): Promise<Climb> {
        return this.ensureClimbExists(id, currentUser.sub);
    }

    /**
     * POST /climbs - Create a new climb
     *
     * @param data - Climb data
     * @returns Created climb
     */
    @Post()
    @ApiOperation({ summary: "Create a new climb" })
    async create(
        @Body(ClimbPipe) data: Prisma.ClimbCreateInput
    ): Promise<Climb> {
        return this.climbService.create(data);
    }

    /**
     * PUT /climbs/:id - Update an existing climb
     *
     * @param id - Climb ID
     * @param data - Updated climb data
     * @returns Updated climb
     * @throws NotFoundException if climb is not found
     */
    @Put(":id")
    @ApiOperation({ summary: "Update an existing climb by ID" })
    async update(
        @Param("id") id: string,
        @Body() data: Prisma.ClimbUpdateInput
    ): Promise<Climb> {
        await this.ensureClimbExists(id);
        return this.climbService.update(id, data);
    }

    /**
     * DELETE /climbs/:id - Delete a climb
     *
     * @param id - Climb ID
     * @returns Deleted climb
     * @throws NotFoundException if climb is not found
     */
    @Delete(":id")
    @ApiOperation({ summary: "Delete a climb by ID" })
    async delete(@Param("id") id: string): Promise<Climb> {
        await this.ensureClimbExists(id);
        return this.climbService.delete(id);
    }
}
