import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/utils/roles.guard";
import { ROLE } from "@joan16/shared-base";
import { ProfileService } from "../services/profile.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";

const PROFILE_RESPONSES = {
    200: 'Successfully retrieved profile information',
    400: 'Invalid user ID format',
    401: 'Unauthorized - Missing or invalid token',
    404: 'User not found'
};

@ApiTags("profile")
@Controller("profile")
@Roles(ROLE.USER)
@UseGuards(RolesGuard, JwtAuthGuard)
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    /**
     * GET /profile/:id - Get the profile of another user
     *
     * @param currentUser - Automatically injected current user object from JWT token
     * @param id - ID of the user profile to retrieve
     * @returns Complete profile information with relationship context
     */
    @Get(":id")
    @ApiBearerAuth()
    @ApiOperation({ summary: "Get user profile", description: "Retrieves public profile information for a user including relationship context with the current user" })
    @ApiResponse({ status: 200, description: PROFILE_RESPONSES[200] })
    @ApiResponse({ status: 400, description: PROFILE_RESPONSES[400] })
    @ApiResponse({ status: 401, description: PROFILE_RESPONSES[401] })
    @ApiResponse({ status: 404, description: PROFILE_RESPONSES[404] })
    async getProfile(
        @CurrentUser() currentUser: { sub: string },
        @Param("id") id: string
    ) {
        return this.profileService.findProfile(currentUser.sub, id);
    }
}