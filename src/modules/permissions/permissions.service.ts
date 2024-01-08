import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GroupPermissionsService } from '../group-permissions/group-permissions.service';
import { Permission, PermissionDocument } from './schemas/permissions.schema';
// import { DefaultListDto } from 'src/shared/dto/default-list-dto';
// import { SuccessResponse } from 'src/shared/response/success-response';
// import { ESortOrder } from 'src/shared/enum/sort.enum';
import { ListOptions, ListResponse } from 'src/shared/response/common-response';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
	constructor(
		@InjectModel(Permission.name)
		private permissionModel: Model<PermissionDocument>,
		private groupPermissionService: GroupPermissionsService,
	) {}

	async findOneById(id: string): Promise<Permission> {
		try {
			console.log(id);
			const permission = await this.permissionModel.findById(id);
			if (permission) {
				await permission.populate('groupPermission');
				return permission;
			}
			throw new BadRequestException(id);
		} catch (error) {
			throw new BadRequestException(
				'An error occurred while retrieving Categorys',
			);
		}
	}

	async findOneByCode(filter: ListOptions<Permission>): Promise<Permission> {
		try {
			const permission = await this.permissionModel.findOne({
				code: filter.code,
			});
			if (permission) {
				await permission.populate('groupPermission');
				return permission;
			}
			throw new BadRequestException(filter.code);
		} catch (error) {
			throw new BadRequestException(
				'An error occurred while retrieving Permission',
			);
		}
	}

	async findAll(
		filter: ListOptions<Permission>,
	): Promise<ListResponse<Permission>> {
		try {
			const rgx = (pattern) => new RegExp(`.*${pattern}.*`, `i`);
			const sortQuery = {};
			sortQuery[filter.sortBy] = filter.sortOrder === 'asc' ? 1 : -1;
			const limit = filter.limit || 10;
			const offset = filter.offset || 0;
			const result = await this.permissionModel
				.find(filter.search ? { ...filter, name: rgx(filter.search) } : filter)
				.sort(sortQuery)
				.skip(offset)
				.limit(limit)
				.populate('groupPermission');

			return {
				items: result,
				total: result?.length || 0,
				options: filter,
			};
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	async create(input: CreatePermissionDto): Promise<Permission> {
		try {
			const permission = await this.permissionModel.findOne({
				code: input.code,
			});
			if (!permission) {
				if (input.groupPermission) {
					const groupPermission = await this.groupPermissionService.findOne({
						_id: input.groupPermission,
					});
					input.groupPermission = groupPermission._id;
					if (groupPermission) {
						return await this.permissionModel.create(input);
					}
				}
				throw new BadRequestException('Group permission has existed!');
			}
			throw new BadRequestException('Permission has existed!');
		} catch (err) {
			return err;
		}
	}

	async updateOne(input: UpdatePermissionDto, id: string): Promise<Permission> {
		try {
			console.log('dfasdfds', input);
			return await this.permissionModel.findByIdAndUpdate(id, input, {
				new: true,
				runValidators: true,
			});
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	async updateStatusPermission(
		input: UpdatePermissionDto,
		id: string,
	): Promise<Permission> {
		try {
			return await this.permissionModel.findByIdAndUpdate(
				id,
				{
					status: input.status,
				},
				{
					new: true,
				},
			);
		} catch (err) {
			throw new BadRequestException(err);
		}
	}
}
