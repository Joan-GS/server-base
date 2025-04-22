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
} from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { UserService } from "../services/user.service";
import { UserPipe } from "../flow/user.pipe";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/utils/roles.guard";
import { PaginationResponse } from "../../../utils/generic.types.utils";
import { ROLE } from "@joan16/shared-base";

@ApiTags("users")
@Controller("users")
@Roles(ROLE.ADMIN)
@UseGuards(RolesGuard)
export class UserController {
    constructor(private readonly userService: UserService) {}

    /************
     ** METHODS **
     *************/

    public async ensureUserExists(id: string): Promise<User> {
        const user = await this.userService.findOne(id);
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }

    /************
     ** ACTIONS **
     *************/

    /**
     * GET /users - List users with pagination and filters
     *
     * @param page - Page number (default: 1)
     * @param pageSize - Items per page (default: 10)
     * @param filters - Optional query filters
     * @returns Paginated list of users
     */
    @Roles(ROLE.USER)
    @Get()
    @ApiOperation({ summary: "List users" })
    async list(
        @Query("page") page: number = 1,
        @Query("pageSize") pageSize: number = 10,
        @Query("filters") filters?: string
    ): Promise<PaginationResponse<User>> {
        return this.userService.list(page, pageSize, filters);
    }

    /**
     * GET /users/:id - Retrieve a user by ID
     *
     * @param id - User ID
     * @returns User data
     * @throws NotFoundException if user is not found
     */
    @Get(":id")
    @ApiOperation({ summary: "Get a user by ID" })
    async findOne(@Param("id") id: string): Promise<User> {
        return this.ensureUserExists(id);
    }

    /**
     * POST /users - Create a new user
     *
     * @param data - User data
     * @returns Created user
     */
    @Post()
    @ApiOperation({ summary: "Create a new user" })
    async create(@Body(UserPipe) data: Prisma.UserCreateInput): Promise<User> {
        return this.userService.create(data);
    }

    /**
     * PUT /users/:id - Update an existing user
     *
     * @param id - User ID
     * @param data - Updated user data
     * @returns Updated user
     * @throws NotFoundException if user is not found
     */
    @Roles(ROLE.USER)
    @Put(":id")
    @ApiOperation({ summary: "Update an existing user by ID" })
    async update(
        @Param("id") id: string,
        @Body() data: Prisma.UserUpdateInput
    ): Promise<User> {
        await this.ensureUserExists(id);
        return this.userService.update(id, data);
    }

    /**
     * DELETE /users/:id - Delete a user
     *
     * @param id - User ID
     * @returns Deleted user
     * @throws NotFoundException if user is not found
     */
    @Delete(":id")
    @ApiOperation({ summary: "Delete a user by ID" })
    async delete(@Param("id") id: string): Promise<User> {
        await this.ensureUserExists(id);
        return this.userService.delete(id);
    }
}
