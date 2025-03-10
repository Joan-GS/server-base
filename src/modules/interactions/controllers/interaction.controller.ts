import {
    Controller,
    Post,
    Delete,
    Param,
    Body,
    UseGuards,
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

@ApiTags("likes, ascensions, comments")
@Controller("climbs")
@Roles(Role.User)
@UseGuards(RolesGuard)
export class InteractionController {
    constructor(
        private readonly climbService: ClimbService,
        private readonly likeService: LikeService,
        private readonly ascensionService: AscensionService,
        private readonly commentService: CommentService
    ) {}

    // Like a Climb
    @Post(":climbId/like")
    @ApiOperation({ summary: "Like a climb" })
    async likeClimb(
        @Param("climbId") climbId: string,
        @Body() data: { userId: string }
    ): Promise<Like> {
        await this.climbService.ensureClimbExists(climbId);
        return this.likeService.create(climbId, data.userId);
    }

    // Remove Like from Climb
    @Delete(":climbId/like")
    @ApiOperation({ summary: "Remove like from a climb" })
    async removeLike(
        @Param("climbId") climbId: string,
        @Body() data: { userId: string }
    ): Promise<void> {
        await this.climbService.ensureClimbExists(climbId);
        return this.likeService.remove(climbId, data.userId);
    }

    // Ascend a Climb
    @Post(":climbId/ascend")
    @ApiOperation({ summary: "Ascend a climb" })
    async ascendClimb(
        @Param("climbId") climbId: string,
        @Body() data: { userId: string }
    ): Promise<Ascension> {
        await this.climbService.ensureClimbExists(climbId);
        return this.ascensionService.create(climbId, data.userId);
    }

    // Comment on a Climb
    @Post(":climbId/comment")
    @ApiOperation({ summary: "Comment on a climb" })
    async commentOnClimb(
        @Param("climbId") climbId: string,
        @Body() data: { userId: string; content: string }
    ): Promise<Comment> {
        await this.climbService.ensureClimbExists(climbId);
        return this.commentService.create(climbId, data.userId, data.content);
    }

    // Delete a comment from a Climb
    @Delete(":climbId/comment/:commentId")
    @ApiOperation({ summary: "Delete a comment from a climb" })
    async deleteComment(
        @Param("climbId") climbId: string,
        @Param("commentId") commentId: string
    ): Promise<void> {
        await this.climbService.ensureClimbExists(climbId);
        await this.commentService.remove(commentId);
    }
}
