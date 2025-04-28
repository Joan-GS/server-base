import { Injectable, NotFoundException } from "@nestjs/common";
import { FollowService } from "../../interactions/services/follow.service";
import { UserService } from "../../users/services/user.service";
import { AscensionService } from "../../interactions/services/ascension.service";
import { ClimbService } from "../../climbs/services/climb.service";

@Injectable()
export class ProfileService {
    public constructor(
        private readonly usersService: UserService,
        private readonly followService: FollowService,
        private readonly ascensionService: AscensionService,
        private readonly climbService: ClimbService
    ) {}

    async findProfile(currentUserId: string, profileUserId: string) {
        const [user, followers, following, ascensions, myClimbs, isFollowing] =
            await Promise.all([
                this.usersService.findById(profileUserId),
                this.followService.getFollowers(profileUserId),
                this.followService.getFollowing(profileUserId),
                this.ascensionService.getAscensions(profileUserId),
                this.climbService.list(
                    1,
                    10,
                    `{"createdBy": "${profileUserId}"}`,
                    profileUserId
                ),
                this.followService.isFollowing(currentUserId, profileUserId),
            ]);

        if (!user) {
            throw new NotFoundException("User not found");
        }

        return {
            id: user.id,
            email: user.email,
            username: user.username,
            followers,
            following,
            ascensions,
            myClimbs,
            isFollowing,
        };
    }
}
