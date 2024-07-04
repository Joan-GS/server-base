// user.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { Prisma } from "@prisma/client";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { UserPipe } from "./user.pipe";

@ApiTags("users")
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET /users
  @Get()
  @ApiOperation({ summary: "Get all users" })
  async findAll() {
      return this.userService.findAll(); // Retrieves all users from the database
  }

  // GET /users/:id
  @Get(":id")
  @ApiOperation({ summary: "Get a user by ID" })
  async findOne(@Param("id") id: string) {
      const user = await this.userService.findOne(id);
      if (!user) {
          throw new NotFoundException(`User with id ${id} not found`);
      }
      return user; // Returns a specific user by ID
  }

  // POST /users
  @Post()
  @ApiOperation({ summary: "Create a new user" })
  async create(@Body(UserPipe) data: Prisma.UserCreateInput) {
      return this.userService.create(data); // Creates a new user with the provided data
  }

  // PUT /users/:id
  @Put(":id")
  @ApiOperation({ summary: "Update an existing user by ID" })
  async update(
      @Param("id") id: string,
      @Body() data: Prisma.UserUpdateInput
  ) {
      const user = await this.userService.update(id, data);
      if (!user) {
          throw new NotFoundException(`User with id ${id} not found`);
      }
      return user; // Updates an existing user by ID with the provided data
  }

  // DELETE /users/:id
  @Delete(":id")
  @ApiOperation({ summary: "Delete a user by ID" })
  async delete(@Param("id") id: string) {
      const deletedUser = await this.userService.delete(id);
      if (!deletedUser) {
          throw new NotFoundException(`User with id ${id} not found`);
      }
      return deletedUser; // Deletes a user by ID
  }
}
