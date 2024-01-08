import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { appConfig } from 'src/app.config';

@Injectable()
export class EmailsService {
	private readonly transporter;

	constructor() {
		this.transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				user: `${appConfig.nameEmail}`,
				pass: `${appConfig.passEmail}`,
			},
		});
	}

	async sendEmail(
		to: string,
		subject: string,
		text?: string,
		html?: string,
	): Promise<void> {
		console.log('Email', `${appConfig.passEmail}`, `${appConfig.nameEmail}`);
		const mailOptions = {
			from: `${appConfig.nameEmail}`,
			to,
			subject,
			text,
			html,
		};

		await this.transporter.sendMail(mailOptions);
	}
}
