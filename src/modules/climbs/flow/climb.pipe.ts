import * as Joi from "joi";
import { JoiValidationPipe } from "../../common";
import { CLIMBING_GRADE, KILTER_TAGS, STATUS } from "@joan16/shared-base";

export class ClimbPipe extends JoiValidationPipe {
    public buildSchema() {
        return Joi.object({
            title: Joi.string().trim().required().min(2).max(100),
            description: Joi.string().optional().max(500),
            ratingAverage: Joi.number().optional().min(0).max(5).precision(2),
            grade: Joi.string().required().valid(...Object.values(CLIMBING_GRADE)),
            gradeAverage: Joi.string().optional().valid(...Object.values(CLIMBING_GRADE)),
            tags: Joi.array().items(Joi.string().valid(...Object.values(KILTER_TAGS))).optional(),
            status: Joi.string().valid(...Object.values(STATUS)).optional().default(STATUS.PUBLIC),
            likesCount: Joi.number().integer().min(0).default(0),
            commentsCount: Joi.number().integer().min(0).default(0),
            recentLikes: Joi.array().items(Joi.string().pattern(/^[a-fA-F0-9]{24}$/)).max(5).default([]),
            recentComments: Joi.array().items(Joi.string().pattern(/^[a-fA-F0-9]{24}$/)).max(5).default([]),
            createdBy: Joi.string().required().pattern(/^[a-fA-F0-9]{24}$/),
        });
    }
}
