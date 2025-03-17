import { Module } from "@nestjs/common";
import { CommonModule } from "../common";
import { ClimbService } from "./services/climb.service";
import { ClimbController } from "./controllers/climb.controller";

@Module({
    imports: [CommonModule],
    providers: [ClimbService],
    controllers: [ClimbController],
    exports: [ClimbService],
})
export class ClimbModule {}
