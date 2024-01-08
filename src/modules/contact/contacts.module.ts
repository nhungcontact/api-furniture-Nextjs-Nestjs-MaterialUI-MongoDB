import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { Contact, ContactSchema } from './schemas/contacts.schemas';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Contact.name, schema: ContactSchema }]),
	],
	providers: [ContactsService],
	exports: [ContactsService],
	controllers: [ContactsController],
})
export class ContactsModule {}
