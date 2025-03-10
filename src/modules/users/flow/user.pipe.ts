import * as Joi from "joi";

import { Prisma } from "@prisma/client";
import { JoiValidationPipe } from "../../common";

export class UserPipe extends JoiValidationPipe {
    public buildSchema(): Joi.Schema {
        return Joi.object<Prisma.UserCreateInput>({
            username: Joi.string().trim().required().min(2).max(50),
            email: Joi.string().trim().email().required(),
            password: Joi.string().required().min(8), 
            birthDate: Joi.date().iso(),
            gender: Joi.string().valid('male', 'female', 'other').optional(),
            profileImage: Joi.string().uri().optional(),
            roles: Joi.string().valid('admin', 'user').required(),
        });
    }
}
