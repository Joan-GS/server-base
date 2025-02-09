import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) {}

    async sendUserConfirmation(user: User, verificationCode: string) {
        const url = `${process.env.FRONTEND_URL}/auth/confirm?token=${verificationCode}`;

        await this.mailerService.sendMail({
            to: user.email,
            from: '"Support Team" <support@example.com>',
            subject: "Welcome to Nice App! Confirm your Email",
            template: "./confirmation",
            context: {
                name: user.userName,
                url,
            },
        });
    }
}
