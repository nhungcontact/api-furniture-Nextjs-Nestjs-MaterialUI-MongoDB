// email.module.ts
import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';

@Module({
	// imports: [ConfigModule],
	providers: [EmailsService],
	exports: [EmailsService],
})
export class EmailModule {}
