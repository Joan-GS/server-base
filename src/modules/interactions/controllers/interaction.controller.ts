import {
    Controller,
    Post,
    Delete,
    Param,
    Body,
    UseGuards,
    HttpException,
    HttpStatus,
    Get,
    Query,
} from "@nestjs/common";
import { Like, Ascension, Comment } from "@prisma/client";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { LikeService } from "../services/like.service";
import { AscensionService } from "../services/ascension.service";
import { CommentService } from "../services/comment.service";
import { Roles } from "../../auth/decorators/roles.decorator";
import { Role } from "../../auth/utils/role.enum";
import { RolesGuard } from "../../auth/utils/roles.guard";
import { ClimbService } from "../../climbs/services/climb.service";
import { FollowService } from "../services/follow.service";

@ApiTags("likes, ascensions, comments, followers")
@Controller("interactions")
@Roles(Role.User)
@UseGuards(RolesGuard)
export class InteractionController {
    constructor(
        private readonly climbService: ClimbService,
        private readonly likeService: LikeService,
        private readonly ascensionService: AscensionService,
        private readonly commentService: CommentService,
        private readonly followService: FollowService
    ) {}

    /**
     * POST /climbs/:climbId/like - Like a climb
     *
     * @param climbId - ID of the climb to like
     * @param data - Object containing userId
     * @returns The created Like object
     * @throws HttpException if climb does not exist or user already liked it
     */
    @Post(":climbId/like")
    @ApiOperation({ summary: "Like a climb" })
    async likeClimb(
        @Param("climbId") climbId: string,
        @Body() data: { userId: string }
    ): Promise<Like> {
        try {
            await this.climbService.ensureClimbExists(climbId);
            return await this.likeService.create(climbId, data.userId);
        } catch (error) {
            throw new HttpException(
                error.message || "Error liking climb",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * DELETE /climbs/:climbId/like - Remove like from a climb
     *
     * @param climbId - ID of the climb
     * @param data - Object containing userId
     * @returns The removed Like object
     * @throws HttpException if climb does not exist or like was not found
     */
    @Delete(":climbId/like")
    @ApiOperation({ summary: "Remove like from a climb" })
    async removeLike(
        @Param("climbId") climbId: string,
        @Body() data: { userId: string }
    ): Promise<Like> {
        try {
            await this.climbService.ensureClimbExists(climbId);
            return await this.likeService.remove(climbId, data.userId);
        } catch (error) {
            throw new HttpException(
                error.message || "Error removing like",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * GET /climbs/:climbId/isLiked?userId=123
     *
     * @param climbId - ID del climb
     * @param userId - ID del usuario (desde query params)
     * @returns { isLiked: boolean }
     */
    @Get(":climbId/isLiked")
    @ApiOperation({ summary: "Check if user liked a climb" })
    async isLiked(
        @Param("climbId") climbId: string,
        @Query("userId") userId: string
    ): Promise<{ isLiked: boolean }> {
        try {
            console.log(climbId, userId);
    
            if (!userId) {
                throw new HttpException(
                    "User ID is required",
                    HttpStatus.BAD_REQUEST
                );
            }
    
            const isLiked = await this.likeService.isLiked(climbId, userId);
            return { isLiked };
        } catch (error) {
            throw new HttpException(
                error.message || "Error checking like status",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    

    /**
     * POST /climbs/:climbId/comment - Add a comment to a climb
     *
     * @param climbId - ID of the climb
     * @param data - Object containing userId and comment content
     * @returns The created Comment object
     * @throws HttpException if climb does not exist
     */
    @Post(":climbId/comment")
    @ApiOperation({ summary: "Comment on a climb" })
    async commentOnClimb(
        @Param("climbId") climbId: string,
        @Body() data: { userId: string; content: string }
    ): Promise<Comment> {
        try {
            await this.climbService.ensureClimbExists(climbId);
            return await this.commentService.create(
                climbId,
                data.userId,
                data.content
            );
        } catch (error) {
            throw new HttpException(
                error.message || "Error commenting on climb",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * DELETE /climbs/:climbId/comment/:commentId - Delete a comment from a climb
     *
     * @param climbId - ID of the climb
     * @param commentId - ID of the comment to be deleted
     * @returns The deleted Comment object
     * @throws HttpException if climb or comment does not exist
     */
    @Delete(":climbId/comment/:commentId")
    @ApiOperation({ summary: "Delete a comment from a climb" })
    async deleteComment(
        @Param("climbId") climbId: string,
        @Param("commentId") commentId: string
    ): Promise<Comment> {
        try {
            await this.climbService.ensureClimbExists(climbId);
            return await this.commentService.remove(climbId, commentId);
        } catch (error) {
            throw new HttpException(
                error.message || "Error deleting comment",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * POST /climbs/:climbId/ascend - Register an ascension for a climb
     *
     * @param climbId - ID of the climb
     * @param data - Object containing userId
     * @returns The created Ascension object
     * @throws HttpException if climb does not exist or user already ascended it
     */
    @Post(":climbId/ascend")
    @ApiOperation({ summary: "Ascend a climb" })
    async ascendClimb(
        @Param("climbId") climbId: string,
        @Body() data: { userId: string }
    ): Promise<Ascension> {
        try {
            await this.climbService.ensureClimbExists(climbId);
            return await this.ascensionService.create(climbId, data.userId);
        } catch (error) {
            throw new HttpException(
                error.message || "Error ascending climb",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post(":userId/follow")
    @ApiOperation({ summary: "Follow a user" })
    async followUser(
        @Param("userId") userId: string,
        @Body() data: { followerId: string }
    ) {
        try {
            return await this.followService.followUser(data.followerId, userId);
        } catch (error) {
            throw new HttpException(
                error.message || "Error following user",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Delete(":userId/unfollow")
    @ApiOperation({ summary: "Unfollow a user" })
    async unfollowUser(
        @Param("userId") userId: string,
        @Body() data: { followerId: string }
    ) {
        try {
            return await this.followService.unfollowUser(data.followerId, userId);
        } catch (error) {
            throw new HttpException(
                error.message || "Error unfollowing user",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get(":userId/followers")
    @ApiOperation({ summary: "Get a user's followers" })
    async getFollowers(@Param("userId") userId: string) {
        return this.followService.getFollowers(userId);
    }

    @Get(":userId/following")
    @ApiOperation({ summary: "Get a user's following list" })
    async getFollowing(@Param("userId") userId: string) {
        return this.followService.getFollowing(userId);
    }
}
