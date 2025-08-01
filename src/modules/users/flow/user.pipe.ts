import * as Joi from "joi";

import { Prisma } from "@prisma/client";
import { JoiValidationPipe } from "../../common";
import { GENDER, LANGUAGE, ROLE } from "@joan16/shared-base";

export class UserPipe extends JoiValidationPipe {
    public buildSchema(): Joi.Schema {
        return Joi.object<Prisma.UserCreateInput>({
            username: Joi.string().trim().required().min(2).max(50),
            email: Joi.string().trim().email().required(),
            password: Joi.string().required().min(8),
            birthDate: Joi.date().iso(),
            gender: Joi.string()
                .valid(...Object.values(GENDER)) // Aplica el enum GENDER
                .optional(),
            profileImage: Joi.string().uri().optional(),
            roles: Joi.string()
                .valid(...Object.values(ROLE))
                .required(),
            language: Joi.string()
                .valid(...Object.values(LANGUAGE))
                .optional(),
        });
    }
}

export class UserUpdatePipe extends JoiValidationPipe {
    public buildSchema(): Joi.Schema {
        return Joi.object<Prisma.UserUpdateInput>({
            username: Joi.string().trim().min(2).max(50).optional(),
            email: Joi.string().trim().email().optional(),
            password: Joi.string().min(8).optional(),
            birthDate: Joi.date().iso().optional(),
            gender: Joi.string()
                .valid(...Object.values(GENDER))
                .optional(),
            profileImage: Joi.string().uri().optional(),
            roles: Joi.string()
                .valid(...Object.values(ROLE))
                .optional(),
            language: Joi.string()
                .valid(...Object.values(LANGUAGE))
                .optional(),
        });
    }
}