import { Controller, Post, Delete, Param, Body, UseGuards, Get, Query, DefaultValuePipe } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Like, Ascension, Comment } from "@prisma/client";
import { LikeService } from "../services/like.service";
import { AscensionService } from "../services/ascension.service";
import { CommentService } from "../services/comment.service";
import { Roles } from "../../auth/decorators/roles.decorator";
import { RolesGuard } from "../../auth/utils/roles.guard";
import { FollowService } from "../services/follow.service";
import { ASCENSION_TYPE, ROLE } from "@joan16/shared-base";
import { CurrentUser } from "../../auth/decorators/current-user.decorator";
import { ParseIntPipe } from "@nestjs/common";
import { PaginationResponse } from "../../../utils/generic.types.utils";

@ApiTags("Interactions")
@Controller("interactions")
@Roles(ROLE.USER)
@UseGuards(RolesGuard)
export class InteractionController {
    constructor(
        private readonly likeService: LikeService,
        private readonly ascensionService: AscensionService,
        private readonly commentService: CommentService,
        private readonly followService: FollowService
    ) { }


    /**
     * POST /interactions/:climbId/like - Like a climb
     *
     * @param climbId - ID of the climb to like
     * @returns The created Like object
     * @throws HttpException if climb does not exist or user already liked it
     */
    @Post(":climbId/like")
    @ApiOperation({ summary: "Like a climb" })
    @ApiResponse({ status: 201, description: 'Like created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 404, description: 'Climb not found' })
    @ApiResponse({ status: 409, description: 'Invalid input or already liked' })
    async likeClimb(
        @CurrentUser() currentUser: { sub: string },
        @Param("climbId") climbId: string
    ): Promise<Like> {
        return this.likeService.create(climbId, currentUser.sub);
    }


    /**
     * DELETE /interactions/:climbId/like - Remove like from a climb
     *
     * @param climbId - ID of the climb to remove like from
     * @returns The removed Like object
     * @throws HttpException if climb or like does not exist
     */
    @Delete(":climbId/like")
    @ApiOperation({ summary: "Remove like from a climb" })
    @ApiResponse({ status: 200, description: 'Like removed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 404, description: 'Like or climb not found' })
    async removeLike(
        @CurrentUser() currentUser: { sub: string },
        @Param("climbId") climbId: string
    ): Promise<Like> {
        return this.likeService.remove(climbId, currentUser.sub);
    }

    /**
    * GET /interactions/:climbId/isLiked - Check if user liked a climb
    *
    * @param climbId - ID of the climb
    * @returns An object with boolean value { isLiked }
    * @throws HttpException for invalid input
    */
    @Get(":climbId/isLiked")
    @ApiOperation({ summary: "Check if user liked a climb" })
    @ApiResponse({ status: 200, description: 'Like status retrieved' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    async isLiked(
        @CurrentUser() currentUser: { sub: string },
        @Param("climbId") climbId: string
    ): Promise<{ isLiked: boolean }> {
        return { isLiked: await this.likeService.isLiked(climbId, currentUser.sub) };
    }

    /**
     * POST /interactions/:climbId/comment - Comment on a climb
     *
     * @param climbId - ID of the climb
     * @param content - Comment text
     * @returns The created Comment object
     * @throws HttpException if climb does not exist or input is invalid
     */
    @Post(":climbId/comment")
    @ApiOperation({ summary: "Comment on a climb" })
    @ApiResponse({ status: 201, description: 'Comment created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 404, description: 'Climb not found' })
    async commentOnClimb(
        @CurrentUser() currentUser: { sub: string },
        @Param("climbId") climbId: string,
        @Body("content") content: string
    ): Promise<Comment> {
        return this.commentService.create(climbId, currentUser.sub, content);
    }


    /**
     * DELETE /interactions/:commentId/comment - Delete a comment
     *
     * @param commentId - ID of the comment to delete
     * @returns The deleted Comment object
     * @throws HttpException if comment does not exist
     */
    @Delete(":commentId/comment")
    @ApiOperation({ summary: "Delete a comment" })
    @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 404, description: 'Comment not found' })
    async deleteComment(
        @Param("commentId") commentId: string
    ): Promise<Comment> {
        return this.commentService.remove(commentId);
    }


    /**
     * POST /interactions/:climbId/ascend - Ascend a climb
     *
     * @param climbId - ID of the climb
     * @param ascensionType - Type of ascension (e.g. REDPOINT, FLASH, etc.)
     * @returns The created Ascension object
     * @throws HttpException if climb does not exist or already ascended
     */
    @Post(":climbId/ascend")
    @ApiOperation({ summary: "Ascend a climb" })
    @ApiResponse({ status: 201, description: 'Ascension recorded successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input or already ascended' })
    @ApiResponse({ status: 404, description: 'Climb not found' })
    async ascendClimb(
        @CurrentUser() currentUser: { sub: string },
        @Param("climbId") climbId: string,
        @Body("ascensionType") ascensionType: ASCENSION_TYPE
    ): Promise<Ascension> {
        return this.ascensionService.create(climbId, currentUser.sub, ascensionType);
    }


    /**
     * POST /interactions/:userId/follow - Follow a user
     *
     * @param userId - ID of the user to follow
     * @returns Follow relationship object or confirmation
     * @throws HttpException if user does not exist or already followed
     */
    @Post(":userId/follow")
    @ApiOperation({ summary: "Follow a user" })
    @ApiResponse({ status: 201, description: 'Followed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input or already following' })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 409, description: 'Already following this user' })
    async followUser(
        @CurrentUser() currentUser: { sub: string },
        @Param("userId") userId: string
    ) {
        return this.followService.followUser(currentUser.sub, userId);
    }


    /**
     * DELETE /interactions/:userId/follow - Unfollow a user
     *
     * @param userId - ID of the user to unfollow
     * @returns Confirmation of unfollow
     * @throws HttpException if follow relationship does not exist
     */
    @Delete(":userId/follow")
    @ApiOperation({ summary: "Unfollow a user" })
    @ApiResponse({ status: 200, description: 'Unfollowed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 404, description: 'Follow relationship not found' })
    async unfollowUser(
        @CurrentUser() currentUser: { sub: string },
        @Param("userId") userId: string
    ) {
        return this.followService.unfollowUser(currentUser.sub, userId);
    }

    /**
     * DELETE /interactions/:userId/remove-follower - Remove a follower
     *
     * @param userId - ID of the follower to remove
     * @returns Confirmation of removal
     * @throws HttpException if follow relationship does not exist
     */
    @Delete(":userId/remove-follower")
    @ApiOperation({ summary: "Remove a follower" })
    @ApiResponse({ status: 200, description: 'Follower removed successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 404, description: 'Follow relationship not found' })
    async removeFollower(
        @CurrentUser() currentUser: { sub: string },
        @Param("userId") userId: string
    ) {
        return this.followService.removeFollower(userId, currentUser.sub);
    }




    /**
     * GET /interactions/:userId/followers - Get followers of a user
     *
     * @param userId - ID of the user
     * @param page - Page number for pagination
     * @param pageSize - Number of results per page
     * @returns Paginated list of followers
     * @throws HttpException if user does not exist
     */
    @Get(":userId/followers")
    @ApiOperation({ summary: "Get user followers" })
    @ApiResponse({ status: 200, description: 'Followers list retrieved' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getFollowers(
        @CurrentUser() currentUser: { sub: string },
        @Param("userId") userId: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(10), ParseIntPipe) pageSize: number
    ): Promise<PaginationResponse<any>> {
        return this.followService.getFollowers(userId, currentUser.sub, page, pageSize);
    }

    /**
     * GET /interactions/:userId/following - Get users followed by a user
     *
     * @param userId - ID of the user
     * @param page - Page number for pagination
     * @param pageSize - Number of results per page
     * @returns Paginated list of followed users
     * @throws HttpException if user does not exist
     */
    @Get(":userId/following")
    @ApiOperation({ summary: "Get user following list" })
    @ApiResponse({ status: 200, description: 'Following list retrieved' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getFollowing(
        @CurrentUser() currentUser: { sub: string },
        @Param("userId") userId: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(10), ParseIntPipe) pageSize: number
    ): Promise<PaginationResponse<any>> {
        return this.followService.getFollowing(userId, currentUser.sub, page, pageSize);
    }

    /**
     * GET /interactions/:userId/ascensions - Get user ascensions
     *
     * @param userId - ID of the user
     * @param page - Page number for pagination
     * @param pageSize - Number of results per page
     * @returns Paginated list of Ascension objects
     * @throws HttpException if user does not exist
     */
    @Get(":userId/ascensions")
    @ApiOperation({ summary: "Get user ascensions" })
    @ApiResponse({ status: 200, description: 'Ascensions list retrieved' })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getAscensions(
        @Param("userId") userId: string,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query("pageSize", new DefaultValuePipe(10), ParseIntPipe) pageSize: number
    ): Promise<PaginationResponse<Ascension>> {
        return this.ascensionService.getAscensions(userId, page, pageSize);
    }
}