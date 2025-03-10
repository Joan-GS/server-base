import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";

@Injectable()
export class MailService {
    constructor(private mailerService: MailerService) {}

    async sendUserConfirmation(user: User, code: string) {
        const url = `http://localhost:8081/auth/verify-mail?email=${user.email}&code=${code}`;

        await this.mailerService.sendMail({
            to: user.email,
            from: '"Support Team" <support@example.com>',
            subject: "Welcome to Nice App! Confirm your Email",
            template: "./confirmation",
            context: {
                name: user.username,
                url,
            },
        });
    }
}
