import * as Joi from "joi";

import { JoiValidationPipe } from "../common";
import { Prisma } from "@prisma/client";

export class UserPipe extends JoiValidationPipe {
    public buildSchema(): Joi.Schema {
        return Joi.object<Prisma.UserCreateInput>({
            firstName: Joi.string().trim().required().min(2).max(50),
            lastName: Joi.string().trim().required().min(2).max(50),
        });
    }
}
