import * as Joi from "joi";
import { JoiValidationPipe } from "../../common";

export class ClimbPipe extends JoiValidationPipe {
    public buildSchema() {
        return Joi.object({
            title: Joi.string().trim().required().min(2).max(100),
            description: Joi.string().optional().max(500),
            ratingAverage: Joi.number().optional().min(0).max(5),
            grade: Joi.string().required(),
            gradeAverage: Joi.number().optional().min(0).max(5),
            tags: Joi.array().items(Joi.string()).optional(),
            status: Joi.string().valid("open", "closed").optional(),
            createdBy: Joi.string().required(),
        });
    }
}
