import { Module } from "@nestjs/common";
import { CommonModule } from "../common";
import { LikeService } from "./services/like.service";
import { AscensionService } from "./services/ascension.service";
import { CommentService } from "./services/comment.service";
import { InteractionController } from "./controllers/interaction.controller";
import { ClimbModule } from "../climbs/climb.module";

@Module({
    imports: [CommonModule, ClimbModule],
    providers: [LikeService, AscensionService, CommentService],
    controllers: [InteractionController],
    exports: [LikeService, AscensionService, CommentService],
})
export class InteractionModule {}
