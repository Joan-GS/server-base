import * as Joi from "joi";

import { Prisma } from "@prisma/client";
import { JoiValidationPipe } from "../../common";

export class UserPipe extends JoiValidationPipe {
    public buildSchema(): Joi.Schema {
        return Joi.object<Prisma.UserCreateInput>({
            givenName: Joi.string().trim().required().min(2).max(50),
            familyName: Joi.string().trim().required().min(2).max(50),
            email: Joi.string().trim().email().required(),
            password: Joi.string().required().min(8), 
            birthDate: Joi.date().iso(), // Validate as ISO-8601 format
            gender: Joi.string().valid('male', 'female', 'other').optional(),
            image: Joi.string().uri().optional(),
        });
    }
}
