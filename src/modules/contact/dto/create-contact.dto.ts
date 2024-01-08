import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ContactStatus } from '../schemas/contacts.schemas';

export class CreateContactDto {
	@IsOptional()
	@IsNotEmpty()
	@IsString()
	username: string;

	@IsOptional()
	@IsNotEmpty()
	@IsString()
	email: string;

	@IsOptional()
	@IsNotEmpty()
	@IsString()
	phoneNumber: string;

	@IsOptional()
	@IsString()
	@IsNotEmpty()
	contact: string;

	@IsOptional()
	status: ContactStatus;
}
