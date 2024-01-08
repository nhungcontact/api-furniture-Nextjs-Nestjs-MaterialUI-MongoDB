import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	NotFoundException,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiNotFoundResponse,
	ApiOperation,
	ApiParam,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { ApiDocsPagination } from 'src/decorators/swagger-form-data.decorator';
import { ListOptions } from 'src/shared/response/common-response';
import { Public } from '../auth/decorators/public.decorator';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Contact } from './schemas/contacts.schemas';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiTags('contacts')
@Controller('contacts')
export class ContactsController {
	constructor(private readonly contactService: ContactsService) {}

	@Public()
	@Post()
	@ApiOperation({
		summary: 'Create a new Contact',
	})
	@ApiBadRequestResponse({
		type: BadRequestException,
		status: 400,
		description: '[Input] invalid!',
	})
	async createContact(@Body() input: CreateContactDto) {
		console.log('dasdasd', input);
		return await this.contactService.create(input);
	}

	@Public()
	@Delete(':ContactID')
	// @ApiBearerAuth()
	@ApiOperation({
		summary: '(NOTE: API NÀY TẠM THỜI KHÔNG DÙNG) Delete Contact by id',
	})
	@ApiParam({ name: 'ContactID', type: String, description: 'Contact ID' })
	@ApiResponse({
		status: 200,
		schema: {
			example: {
				code: 200,
				message: 'Success',
				data: null,
			},
		},
	})
	@ApiBadRequestResponse({
		type: BadRequestException,
		status: 400,
		description: '[Input] invalid!',
	})
	@ApiNotFoundResponse({
		type: NotFoundException,
		status: 404,
		description: 'Contact not found!',
	})
	deleteContactById(@Param('ContactID') ContactID: any) {
		return this.contactService.delete(ContactID);
	}

	@Public()
	@Get()
	@ApiOperation({
		summary: 'Get many Contact',
	})
	@ApiDocsPagination('ContactSchema')
	findMany(@Query() filter: ListOptions<Contact>) {
		return this.contactService.findAll(filter);
	}

	// @Public()
	// findOne(@Param(':id') id) {
	// 	return this.contactService.findOneByID(id);
	// }

	@Public()
	@Get(':ContactID')
	@ApiOperation({
		summary: 'Get many Contact',
	})
	@ApiParam({ name: 'ContactID', type: String, description: 'Contact ID' })
	findOneByID(@Param('ContactID') ContactID) {
		return this.contactService.findOne({
			_id: ContactID,
		});
	}

	@Public()
	@Patch(':id')
	@ApiOperation({
		summary: 'Get many Contact',
	})
	@ApiParam({ name: 'id', type: String, description: 'Contact ID' })
	updateStatus(@Param('id') id, @Body() input: UpdateContactDto) {
		return this.contactService.updateStatus(input, id);
	}
}
