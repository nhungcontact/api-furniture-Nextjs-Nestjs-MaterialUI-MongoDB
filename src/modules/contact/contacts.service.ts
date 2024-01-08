import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ESortOrder } from 'src/shared/enum/sort.enum';
import { ListOptions, ListResponse } from 'src/shared/response/common-response';
import { Contact, ContactDocument } from './schemas/contacts.schemas';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
	constructor(
		@InjectModel(Contact.name)
		private contactModel: Model<ContactDocument>,
	) {}

	async findOne(filter: Partial<Contact>): Promise<Contact> {
		try {
			return await this.contactModel.findOne(filter);
		} catch (error) {
			throw new BadRequestException(
				'An error occurred while retrieving Contacts',
			);
		}
	}

	async findAll(filter: ListOptions<Contact>): Promise<ListResponse<Contact>> {
		try {
			const rgx = (pattern) => new RegExp(`.*${pattern}.*`, `i`);

			const sortQuery = {};
			sortQuery[filter.sortBy] = filter.sortOrder === ESortOrder.ASC ? 1 : -1;
			const limit = filter.limit || 10;
			const offset = filter.offset || 0;
			const result = await this.contactModel
				.find(filter.search ? { ...filter, name: rgx(filter.search) } : filter)
				.sort(sortQuery)
				.skip(offset)
				.limit(limit);

			return {
				items: result,
				total: result?.length,
				options: filter,
			};
		} catch (error) {
			throw new BadRequestException(
				'An error occurred while retrieving Contacts',
			);
		}
	}
	async create(input: CreateContactDto): Promise<Contact> {
		try {
			return await this.contactModel.create(input);
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	// async createOne(input: CreateContactDto): Promise<Contact> {
	// 	try {
	// 		const user = await this.contactModel.findOne({
	// 			name: input.name,
	// 			description: input.description,
	// 		});
	// 		if (!user) {
	// 			return this.contactModel.create(input);
	// 		}
	// 		throw new BadRequestException('Email has existed!');
	// 	} catch (err) {
	// 		return err;
	// 	}
	// }

	async updateStatus(input: UpdateContactDto, id: string): Promise<Contact> {
		try {
			if (input.status) {
				return await this.contactModel.findByIdAndUpdate(
					{
						_id: id,
					},
					{
						status: input.status,
					},
					{
						new: true,
					},
				);
			}
			throw new BadRequestException('Data invalid!');
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	// async deleteOne({ id }: any): Promise<SuccessResponse<Contact>> {
	// 	try {
	// 		if (!isValidObjectId(id)) throw new BadRequestException('ID invalid!');

	// 		await this.contactModel.findOneAndRemove({
	// 			_id: id,
	// 		});

	// 		return;
	// 	} catch (err) {
	// 		throw new BadRequestException(err);
	// 	}
	// }

	async delete(id: string): Promise<Contact> {
		const deletedContact = await this.contactModel.findOneAndDelete({
			_id: id,
		});
		if (deletedContact) {
			return deletedContact;
		} else {
			throw new BadRequestException('Remove not successfully!');
		}
	}
}
