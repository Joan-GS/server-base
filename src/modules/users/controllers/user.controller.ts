import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ParseIntPipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { UserService } from "../services/user.service";
import { UserPipe, UserUpdatePipe } from "../flow/user.pipe";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/utils/roles.guard";
import { PaginationResponse } from "../../../utils/generic.types.utils";
import { ROLE } from "@joan16/shared-base";
import { Prisma, User } from "@prisma/client";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";

@ApiTags("users")
@Controller("users")
@Roles(ROLE.USER)
@UseGuards(RolesGuard)
export class UserController {
    constructor(private readonly userService: UserService) { }

    /**
     * GET /users - List users with pagination and optional filters
     *
     * @param page - Page number (default: 1)
     * @param pageSize - Number of users per page (default: 10)
     * @param filters - Optional JSON string to filter users
     * @returns A paginated list of users
     * @throws HttpException for invalid input or unauthorized access
     */
    @Get()
    @ApiOperation({ summary: "List users" })
    @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async list(
        @CurrentUser() currentUser: { sub: string },
        @Query("page", new ParseIntPipe()) page: number = 1,  // ← Convierte a número
        @Query("pageSize", new ParseIntPipe()) pageSize: number = 10, // ← Convierte a número
        @Query("filters") filters?: string
    ): Promise<PaginationResponse<User>> {
        return this.userService.list(currentUser.sub, page, pageSize, filters);
    }

    /**
     * GET /users/:id - Retrieve a user by ID
     *
     * @param id - ID of the user to retrieve
     * @returns The requested User object
     * @throws HttpException if ID is invalid or user not found
     */
    @Get(":id")
    @ApiOperation({ summary: "Get a user by ID" })
    @ApiResponse({ status: 200, description: 'User retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Invalid ID format' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async findOne(@Param("id") id: string): Promise<User> {
        return this.userService.findById(id);
    }

    /**
     * POST /users - Create a new user
     *
     * @param data - User data for creation (validated by UserPipe)
     * @returns The created User object
     * @throws HttpException if input is invalid or user already exists
     */
    @Post()
    @ApiOperation({ summary: "Create a new user" })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid user data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async create(@Body(UserPipe) data: Prisma.UserCreateInput): Promise<User> {
        return this.userService.create(data);
    }

    /**
     * PUT /users/:id - Update an existing user by ID
     *
     * @param id - ID of the user to update
     * @param data - Partial user data to update (validated by UserUpdatePipe)
     * @returns The updated User object
     * @throws HttpException if user not found or input is invalid
     */
    @Put(":id")
    @ApiOperation({ summary: "Update an existing user by ID" })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid user data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async update(@Param("id") id: string, @Body(UserUpdatePipe) data: Prisma.UserUpdateInput): Promise<User> {
        return this.userService.update(id, data);
    }

    /**
     * DELETE /users/:id - Delete a user by ID
     *
     * @param id - ID of the user to delete
     * @returns The deleted User object
     * @throws HttpException if user not found
     */
    @Delete(":id")
    @ApiOperation({ summary: "Delete a user by ID" })
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async delete(@Param("id") id: string): Promise<User> {
        return this.userService.delete(id);
    }
}