import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ESortOrder } from 'src/shared/enum/sort.enum';
import { ListOptions, ListResponse } from 'src/shared/response/common-response';
import { SuccessResponse } from 'src/shared/response/success-response';
import { BillItemsService } from '../bill-items/bill-items.service';
import { EmailsService } from '../emails/emails.service';
import { PromotionsService } from '../promotions/promotions.service';
import { RequestCancelsService } from '../request-cancel/request-cancels.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { UpdateBillDto } from './dto/update-bill.dto';
import {
	Bill,
	BillDocument,
	BillPaymentMethod,
	BillStatus,
} from './schemas/bills.schema';
import { ProcessingStatus } from '../request-cancel/schemas/request-cancels.schema';
import { ProductSkusService } from '../product-skus/product-skus.service';
@Injectable()
export class BillsService {
	constructor(
		@InjectModel(Bill.name)
		private billModel: Model<BillDocument>,
		private readonly billItemService: BillItemsService,
		private readonly promotionService: PromotionsService,
		private readonly emailService: EmailsService,
		private readonly requestCancelService: RequestCancelsService,
		private readonly productSkuService: ProductSkusService,
	) {}

	async findOne(filter: Partial<Bill>): Promise<Bill> {
		try {
			return await this.billModel.findOne(filter).populate([
				'user',
				'requestCancel',
				{
					path: 'billItems',
					populate: {
						path: 'productSkuId',
						populate: [
							{ path: 'optionValues', populate: 'optionSku' },
							{ path: 'reviews', populate: ['bill', 'user'] },
						],
					}, // Populate the 'user' field in each comment
				},
			]);
		} catch (error) {
			throw new BadRequestException('An error occurred while retrieving Bills');
		}
	}

	async findAll(filter: ListOptions<Bill>): Promise<ListResponse<Bill>> {
		try {
			const sortQuery = {};
			sortQuery[filter.sortBy] = filter.sortOrder === ESortOrder.ASC ? 1 : -1;
			const limit = filter.limit || 10;
			const offset = filter.offset || 0;

			const rgx = (pattern) => new RegExp(`.*${pattern}.*`, `i`);

			const query: any = filter.search
				? { ...filter, number: rgx(filter.search) }
				: { ...filter };

			if (filter.status) {
				query['status'] = filter.status;
			}

			if (filter.request) {
				query['requestCancel'] = { $exists: true };
			}
			const result = await this.billModel
				.find(query)
				.sort(sortQuery)
				.skip(offset)
				.limit(limit)
				.populate([
					'user',
					'requestCancel',
					{
						path: 'billItems',
						populate: {
							path: 'productSkuId',
							populate: [
								{ path: 'optionValues', populate: 'optionSku' },
								{ path: 'reviews', populate: ['bill', 'user'] },
							],
						}, // Populate the 'user' field in each comment
					},
				]);

			return {
				items: result,
				total: result?.length,
				options: filter,
			};
		} catch (error) {
			throw new BadRequestException('An error occurred while retrieving Bills');
		}
	}

	async create(input: CreateBillDto): Promise<Bill> {
		try {
			if (input.user) {
				const createBill = await this.billModel.create(input);
				if (createBill) {
					return createBill;
				} else {
					throw new BadRequestException('Create Bill failed!');
				}
			}

			throw new BadRequestException('Bill has existed!');
		} catch (err) {
			return err;
		}
	}

	async addBillItem(input: UpdateBillDto): Promise<Bill> {
		try {
			const findBill = await this.billModel
				.findOne({
					_id: input.billId,
				})
				.populate('billItems', 'promotion');
			if (findBill && input.billItems.length > 0) {
				const billItemIds = [] as any;
				for (const val of input.billItems) {
					const createBillItem = await this.billItemService.create(val);
					if (createBillItem && createBillItem._id) {
						billItemIds.push(createBillItem._id);
					} else {
						await this.delete(input.billId);
					}
				}
				if (billItemIds.length > 0) {
					input.billItems = billItemIds;

					const updateBill = await this.updateOne(findBill._id, input);
					const findBillUpdate = await this.billModel
						.findOne({
							_id: input.billId,
						})
						.populate('promotion');

					// cap nhat so luong phieu giam gia
					if (updateBill) {
						console.log('findBillUpdate.promotion', findBillUpdate.promotion);
						if (
							findBillUpdate.promotion &&
							findBillUpdate.promotion.quantity > 0
						) {
							console.log(
								'findBillUpdate.promotion',
								findBillUpdate.promotion.quantity,
							);
							await this.promotionService.updateOne(
								{
									quantity: findBillUpdate.promotion.quantity - 1,
								},
								findBillUpdate.promotion._id.toString(),
							);
						}
						await this.sendEmail(
							input.billId,
							'Successful Purchase Notification',
							'(Thông báo mua hàng thành công)',
						);
						return updateBill;
					}
					throw new BadRequestException('Update bill not success!');
				} else {
					throw new BadRequestException('Create bill item not success!');
				}
			}

			throw new BadRequestException('Bill not found');
		} catch (err) {
			throw new BadRequestException(err);
		}
	}
	async sendEmail(
		billId: string,
		title: string,
		titleEN: string,
	): Promise<string> {
		const findBill = await this.billModel
			.findOne({
				_id: billId,
			})
			.populate(['billItems', 'user']);
		const to = 'nhungyenhuynh@gmail.com';
		const currentDate = new Date();
		const tomorrow = new Date(currentDate);
		tomorrow.setDate(currentDate.getDate() + 3);
		const text = `<!DOCTYPE html>
								<html lang="en">
								<head>
									<meta charset="UTF-8">
									<meta name="viewport" content="width=device-width, initial-scale=1.0">
									<title>${title + titleEN}</title>
									<style>
										body {
											font-family: 'Arial', sans-serif;
											background-color: #f4f4f4;
											margin: 0;
											padding: 0;
										}

										.container {
											max-width: 600px;
											margin: 20px auto;
											background-color: #fff;
											padding: 20px;
											border-radius: 8px;
											box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
										}

										h1, h2 {
											color: #333;
										}

										p {
											color: #666;
										}

										.order-details {
											margin-top: 20px;
										}

										table {
											width: 100%;
											border-collapse: collapse;
											margin-top: 10px;
										}

										table, th, td {
											border: 1px solid #ddd;
										}

										th, td {
											padding: 12px;
											text-align: left;
										}

										th {
											background-color: #f2f2f2;
										}

										.thank-you {
											margin-top: 20px;
											color: #555;
										}

										.display-start {
											display:flex;
											justify-content:"start";
											align-items:center;
										}
									</style>
								</head>
								<body>
									<div class="container">
										<h1>Shopping for furniture with <b>Furnit.</b></h1>
										<h2>${title} <i>${titleEN}</i></h2>
										<p>Hello <b>${
											findBill.user.firstName +
											' ' +
											findBill.user.lastName +
											' (' +
											findBill.user.username +
											')'
										}</b>,</p>
										<p>Thank you for making a purchase at our store. Below are the details of your order <b>#${
											findBill.number
										}</b>:</p>
										<i>(Cảm ơn bạn đã mua hàng tại cửa hàng của chúng tôi. Dưới đây là chi tiết đơn hàng của bạn #${
											findBill.number
										})</i>
												
										<h5>Information Customer <i>(Thông tin khách hàng)</i></h5>
										<div class="order-details">
											<table>
												<tr>
													<th>Product</th>
													<th>Quantity</th>
													<th>Price</th>
													<th>Total Price</th>
												</tr>
											   ${
														!!findBill.billItems &&
														!!findBill.billItems.length &&
														findBill.billItems
															.map(
																(item) =>
																	`<tr>
																<td>
																	<p>${item.product.name}</p>
																</td>
																
																<td>${item.quantity}</td>
																<td>
																${new Intl.NumberFormat('vi-VN', {
																	style: 'currency',
																	currency: 'VND',
																}).format(item.price)}
																</td>
																<td>
																${new Intl.NumberFormat('vi-VN', {
																	style: 'currency',
																	currency: 'VND',
																}).format(item.totalPrice)}
																</td>
															</tr>`,
															)
															.join('')
													}

											</table>
										</div>

										${
											!!findBill.promotion && !!findBill.promotionPrice
												? `<p><strong>Promotion</strong><i> (Mã giảm giá): </i>${new Intl.NumberFormat(
														'vi-VN',
														{
															style: 'currency',
															currency: 'VND',
														},
												  ).format(findBill.promotionPrice)}${
														!!findBill.promotion.percentDiscount &&
														`(${findBill.promotion.percentDiscount})%`
												  })</p>`
												: ''
										}
										<h5><strong>Total Order Value</strong> <i>(Tổng tiền): </i> 
											<b>${new Intl.NumberFormat('vi-VN', {
												style: 'currency',
												currency: 'VND',
											}).format(findBill.grandTotal)}</b>
										</h5>
										

										<h5>Information Customer <i>(Thông tin khách hàng)</i></h5>
										<div style="margin-bottom:"10px">
											<p><strong>Phone number</strong><i> (Số điện thoại liên hệ): </i> <b> 
											${findBill.user.phoneNumber}</b></p>
											<p><strong>Shipping Address</strong><i> (Đại chỉ nhận hàng):</i> <b>${
												findBill.address.addressDetail +
												', ' +
												findBill.address.commune +
												', ' +
												findBill.address.district +
												', ' +
												findBill.address.province
											}</b></p>
											<p><strong>Message</strong><i> (Lời nhắn): </i> <b> ${
												findBill.message ?? `No message (Không có lời nhắn.)`
											}</b></p>
										</div>

										<p><strong>Payment Method</strong><i> (phương thức thanh toán):</i> ${
											findBill.paymentMethod === BillPaymentMethod.Cod
												? 'Cash On Delivery <i>(Thanh toán khi nhận hàng)</i>'
												: findBill.cardName
										}</p>
										<p><strong>Shipping Price</strong><i> (Phí vận chuyển):</i> <b>${new Intl.NumberFormat(
											'vi-VN',
											{
												style: 'currency',
												currency: 'VND',
											},
										).format(findBill.shipping)}</b></p>
										<p><strong>${
											findBill.status === BillStatus.Success
												? 'Delivery'
												: 'Order Date'
										}</strong><i> ${
			findBill.status === BillStatus.Success
				? '(Ngày nhận hàng)'
				: '(Ngày đặt hàng)'
		}:</i> <b> ${new Date(findBill.updatedAt).toLocaleDateString()}</b></p>
													${
														findBill.status === BillStatus.Waiting
															? `<p><strong>Estimated Delivery Date</strong><i> (Dự kiến ​​giao hàng ngày):</i> <b> ${tomorrow.toLocaleDateString()}</b></p>`
															: ''
													}
										<p>Click on the link to continue purchasing <a href="http://localhost:3001/vi/furniture">Website</a></p>
										<i>(Nhấp vào liên kết để tiếp tục mua sắm trên trang web <a href="http://localhost:3001/vi/furniture">Website</a>)</i>

										<p class="thank-you">Thank you for choosing us! We look forward to serving you again.</p>
										<i style="font-size:12px">(Cảm ơn bạn đã lựa chọn chúng tôi, chúng tôi mong được phục vụ bạn thêm một lần nữa.)</i>
									</div>
								</body>
								</html>
								`;

		await this.emailService.sendEmail(to, title, undefined, text);
		return 'Send successfull';
	}

	async sendCancelEmail(
		billId: string,
		title: string,
		titleEN: string,
	): Promise<string> {
		console.log('billId', billId);
		const findBill = await this.billModel
			.findOne({
				_id: billId,
			})
			.populate(['billItems', 'user', 'requestCancel']);
		const to = 'nhungyenhuynh@gmail.com';
		const text = `<!DOCTYPE html>
								<html lang="en">
								<head>
									<meta charset="UTF-8">
									<meta name="viewport" content="width=device-width, initial-scale=1.0">
									<title>${title + titleEN}</title>
									<style>
										body {
											font-family: 'Arial', sans-serif;
											background-color: #f4f4f4;
											margin: 0;
											padding: 0;
										}

										.container {
											max-width: 600px;
											margin: 20px auto;
											background-color: #fff;
											padding: 20px;
											border-radius: 8px;
											box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
										}

										h1, h2 {
											color: #333;
										}

										p {
											color: #666;
										}

										.order-details {
											margin-top: 20px;
										}

										table {
											width: 100%;
											border-collapse: collapse;
											margin-top: 10px;
										}

										table, th, td {
											border: 1px solid #ddd;
										}

										th, td {
											padding: 12px;
											text-align: left;
										}

										th {
											background-color: #f2f2f2;
										}

										.thank-you {
											margin-top: 20px;
											color: #555;
										}

										.display-start {
											display:flex;
											justify-content:"start";
											align-items:center;
										}
									</style>
								</head>
								<body>
									<div class="container">
										<h1>Shopping for furniture with <b>Furnit.</b></h1>
										<h2>${title} <i>${titleEN}</i></h2>
										<p>Hello <b>${
											findBill.user.firstName +
											' ' +
											findBill.user.lastName +
											' (' +
											findBill.user.username +
											')'
										}</b>,</p>
										
												
										<h5>Information Order <i>(Thông tin đơn hàng)</i></h5>
										<div class="order-details">
											<table>
												<tr>
													<th>Product</th>
													<th>Quantity</th>
													<th>Price</th>
													<th>Total Price</th>
												</tr>
											   ${
														!!findBill.billItems &&
														!!findBill.billItems.length &&
														findBill.billItems
															.map(
																(item) =>
																	`<tr>
																<td>
																	<p>${item.product.name}</p>
																</td>
																
																<td>${item.quantity}</td>
																<td>
																${new Intl.NumberFormat('vi-VN', {
																	style: 'currency',
																	currency: 'VND',
																}).format(item.price)}
																</td>
																<td>
																${new Intl.NumberFormat('vi-VN', {
																	style: 'currency',
																	currency: 'VND',
																}).format(item.totalPrice)}
																</td>
															</tr>`,
															)
															.join('')
													}

											</table>
										</div>

										${
											!!findBill.promotion && !!findBill.promotionPrice
												? `<p><strong>Promotion</strong><i> (Mã giảm giá): </i>${new Intl.NumberFormat(
														'vi-VN',
														{
															style: 'currency',
															currency: 'VND',
														},
												  ).format(findBill.promotionPrice)}${
														!!findBill.promotion.percentDiscount &&
														`(${findBill.promotion.percentDiscount})%`
												  })</p>`
												: ''
										}
										<h5><strong>Total Order Value</strong> <i>(Tổng tiền): </i> 
											<b>${new Intl.NumberFormat('vi-VN', {
												style: 'currency',
												currency: 'VND',
											}).format(findBill.grandTotal)}</b>
										</h5>
										<p><strong>Payment Method</strong><i> (phương thức thanh toán):</i> ${
											findBill.paymentMethod === BillPaymentMethod.Cod
												? 'Cash On Delivery <i>(Thanh toán khi nhận hàng)</i>'
												: findBill.cardName
										}</p>
										<p><strong>Shipping Price</strong><i> (Phí vận chuyển):</i> <b>${new Intl.NumberFormat(
											'vi-VN',
											{
												style: 'currency',
												currency: 'VND',
											},
										).format(findBill.shipping)}</b></p>
										

										
										<div style="margin-bottom:"10px">
											<p><strong>Reason Cancel</strong><i> (Lí do hủy đơn): </i> <b> ${
												findBill.requestCancel.reason ?? '-'
											}</b></p>
										</div>

										
										<p><strong>
												
												Request Cancel Date
										</strong><i> 
												(Ngày yêu cầu hủy đơn hàng)
										:</i> <b> ${new Date(
											findBill.requestCancel.createdAt,
										).toLocaleDateString()}</b></p>

										<p><strong>
												${
													findBill.requestCancel.processingStatus ===
													ProcessingStatus.Approved
														? 'Approved Date'
														: 'Dennied Date'
												}
												Request Cancel Date
										</strong><i> 
												(${
													findBill.requestCancel.processingStatus ===
													ProcessingStatus.Approved
														? 'Ngày chấp nhận hủy'
														: 'Ngày từ chối hủy'
												})
										:</i> <b> ${new Date(
											findBill.requestCancel.updatedAt,
										).toLocaleDateString()}</b></p>
													
										<p>Click on the link to continue purchasing <a href="http://localhost:3001/vi/furniture">Website</a></p>
										<i>(Nhấp vào liên kết để nếu muốn tiếp tục mua sắm trên trang web <a href="http://localhost:3001/vi/furniture">Website</a>)</i>

										<p class="thank-you">Thank you for choosing us! We look forward to serving you again.</p>
										<i style="font-size:12px">(Cảm ơn bạn đã lựa chọn chúng tôi, chúng tôi mong được phục vụ bạn thêm một lần nữa.)</i>
									</div>
								</body>
								</html>
								`;

		await this.emailService.sendEmail(to, title, undefined, text);
		return 'Send successfull';
	}
	async updateRequestCancel(id: string, input: UpdateBillDto): Promise<Bill> {
		try {
			const findBill = await this.findOne({
				_id: id,
			});
			if (findBill && findBill._id) {
				if (findBill.status === BillStatus.Waiting) {
					if (input.requestCancel) {
						if (findBill.requestCancel && findBill.requestCancel._id) {
							if (
								input.requestCancel.processingStatus ===
								ProcessingStatus.Approved
							) {
								console.log('Đồng ý');
								const updateBill = await this.updateStatus(findBill._id, {
									status: BillStatus.Cancel,
								});

								if (updateBill) {
									const findBillUpdate = await this.billModel
										.findOne({
											_id: input.billId,
										})
										.populate('promotion');
									// cập nhật phiếu giảm giá
									if (
										findBillUpdate.promotion &&
										findBillUpdate.promotionPrice
									) {
										await this.promotionService.updateOne(
											{
												quantity: findBillUpdate.promotion.quantity + 1,
											},
											id,
										);
									}
									// cập nhập số lượng sản phẩm
									for (const val of findBill.billItems) {
										const findPS = await this.productSkuService.findOne({
											_id: val.productSku._id,
										});

										if (findPS && findPS._id) {
											console.log('findPS', findPS._id);
											await this.productSkuService.updateOne(
												{
													quantitySold: findPS.quantitySold - val.quantity,
													quantityInStock:
														findPS.quantityInStock + val.quantity,
												},
												findPS._id,
											);
										}
									}
									await this.sendCancelEmail(
										findBill._id.toString(),
										'Apprived Cancel Order Notification',
										'(Thông báo chấp nhận hủy đơn hàng)',
									);
									return updateBill;
								}
							} else {
								console.log('Từ chối');
								const updateRequestCancel =
									await this.requestCancelService.updateOne(
										input.requestCancel,
										findBill.requestCancel._id,
									);
								if (updateRequestCancel) {
									await this.sendCancelEmail(
										findBill._id,
										'Dennied Cancel Order Notification',
										'(Thông báo từ chối hủy đơn hàng)',
									);
									return findBill;
								}
							}
						} else {
							// yêu cầu hủy
							const createRequesCancel =
								await this.requestCancelService.createOrderRequest(
									input.requestCancel,
								);
							const bill = await this.billModel.findByIdAndUpdate(
								{
									_id: id,
								},
								{
									requestCancel: createRequesCancel._id,
								},
								{
									new: true,
								},
							);
							if (!bill) throw new NotFoundException('Update bill failed!');
							return bill;
						}
					}
				} else {
					throw new NotFoundException('Bill Status not in Waiting');
				}
			} else {
				throw new BadRequestException('Bill not found Request!');
			}
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	async updateStatus(id: string, input: UpdateBillDto): Promise<Bill> {
		try {
			const findBill = await this.billModel.findOne({
				_id: id,
			});
			if (findBill) {
				const bill = await this.billModel.findByIdAndUpdate(
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
				if (!bill) throw new NotFoundException('Update bill failed!');
				if (input.status === BillStatus.Success) {
					await this.sendEmail(
						findBill._id,
						'Successful delivery notification',
						'(Thông báo nhận hàng thành công)',
					);
				}
				return bill;
			}
			throw new BadRequestException('Bill not found updateStatus!');
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	async updateOne(id: string, input: UpdateBillDto): Promise<Bill> {
		try {
			const bill = await this.billModel.findByIdAndUpdate(
				{
					_id: id,
				},
				input,
				{
					new: true,
				},
			);
			if (!bill) throw new NotFoundException('Product not found');
			return bill;
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	async delete(id: string): Promise<Bill> {
		const deletedReview = await this.billModel.findOneAndDelete({ _id: id });
		return deletedReview;
	}

	async deleteMany(): Promise<SuccessResponse<Bill>> {
		try {
			await this.billModel.deleteMany();
			return;
		} catch (err) {
			throw new BadRequestException(err);
		}
	}

	async getQuantityBillsStats(): Promise<object> {
		const numBills = await this.billModel
			.find({ status: BillStatus.Success })
			.count();
		return { numBills };
	}

	async getWeeklyBillStats(
		month: number,
		year: number,
		week: number,
	): Promise<Array<object>> {
		const getFirstDayOfMonth = (year, month) => {
			return new Date(year, month - 1, 1); // Adjusted to get the first day of the specified month
		};

		const firstDayOfMonth = getFirstDayOfMonth(year, month);
		const startDate = new Date(firstDayOfMonth);
		startDate.setDate(startDate.getDate() + (week - 1) * 7); // Adjusted to get the start date of the specified week

		const endDate = new Date(startDate);
		endDate.setDate(endDate.getDate() + 6); // Adjusted to get the end date of the specified week

		const stats = await this.billModel.aggregate([
			{
				$match: {
					updatedAt: {
						$gte: startDate,
						$lte: endDate,
					},
					status: BillStatus.Success,
				},
			},
			{
				$group: {
					_id: {
						dayOfWeek: { $dayOfWeek: '$createdAt' },
					},
					numBills: { $sum: 1 },
					grandTotal: { $sum: '$grandTotal' },
					avgGrandTotal: { $avg: '$grandTotal' },
					minPrice: { $min: '$grandTotal' },
					maxPrice: { $max: '$grandTotal' },
				},
			},
			{
				$addFields: {
					weekDayName: {
						$let: {
							vars: {
								daysOfWeek: [
									'',
									'Sunday',
									'Monday',
									'Tuesday',
									'Wednesday',
									'Thursday',
									'Friday',
									'Saturday',
								],
							},
							in: {
								$arrayElemAt: ['$$daysOfWeek', '$_id.dayOfWeek'],
							},
						},
					},
				},
			},
			{
				$project: {
					_id: 0,
				},
			},
			{
				$sort: { '_id.dayOfWeek': 1 },
			},
		]);

		return stats;
	}

	async getMonthlyBillStats(year: number): Promise<Array<object>> {
		const stats = await this.billModel.aggregate([
			{
				$match: {
					updatedAt: {
						$gte: new Date(`${year}-01-01T00:00:00.000Z`),
						$lte: new Date(`${year}-12-31T00:00:00.000Z`),
					},
					status: BillStatus.Success,
				},
			},
			{
				$group: {
					_id: { $month: '$createdAt' },
					numBills: { $sum: 1 },
					grandTotal: { $sum: '$grandTotal' },
					avgGrandTotal: { $avg: '$grandTotal' },
					minPrice: { $min: '$grandTotal' },
					maxPrice: { $max: '$grandTotal' },
				},
			},
			{
				$addFields: { month: '$_id' },
			},
			{
				$project: {
					_id: 0,
				},
			},
			{
				$sort: { month: -1 },
			},
		]);

		return stats;
	}

	// async getYearlyBillStats(): Promise<Array<object>> {
	// 	const stats = await this.billModel.aggregate([
	// 		{
	// 			$group: {
	// 				_id: { $year: '$createdAt' },
	// 				numBills: { $sum: 1 },
	// 				grandTotal: { $sum: '$grandTotal' },
	// 				avgGrandTotal: { $avg: '$grandTotal' },
	// 				minPrice: { $min: '$grandTotal' },
	// 				maxPrice: { $max: '$grandTotal' },
	// 			},
	// 		},
	// 		{
	// 			$addFields: { year: '$_id' },
	// 		},
	// 		{
	// 			$project: {
	// 				_id: 0,
	// 			},
	// 		},
	// 		{
	// 			$sort: { year: -1 },
	// 		},
	// 	]);

	// 	return stats;
	// }

	// Dữ liệu này có thể chứa thông tin như ngày tạo hóa đơn, tổng doanh số, sản phẩm bán được, v.v.
	async getSalesPerformance(year: number): Promise<number> {
		// Lấy doanh số bán hàng cho năm hiện tại
		const currentYearSales = await this.getYearlySales(year);

		// Lấy doanh số bán hàng cho năm trước
		const previousYearSales = await this.getYearlySales(year - 1);

		// Tính phần trăm thay đổi
		const percentageChange = this.calculatePercentageChange(
			currentYearSales,
			previousYearSales,
		);

		return percentageChange;
	}

	private async getYearlySales(year: number): Promise<number> {
		const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
		const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

		const sales = await this.billModel
			.find({
				updatedAt: {
					$gte: startDate,
					$lte: endDate,
				},
				status: BillStatus.Success,
			})
			.exec();

		// Tính tổng doanh số bán hàng
		const totalSales = sales.reduce(
			(total, order) => total + order.grandTotal,
			0,
		);

		return totalSales;
	}

	// Hieu saut ban hang so voi nam truoc
	private calculatePercentageChange(
		currentYear: number,
		previousYear: number,
	): number {
		if (previousYear === 0) {
			return 100; // Nếu năm trước không có doanh số, hiệu suất là 100%
		}

		const percentageChange =
			((currentYear - previousYear) / previousYear) * 100;

		return percentageChange;
	}

	// doanh thu so với tháng trước
	async getSalesPerformancePercentage(
		currentMonth: number,
		currentYear: number,
	): Promise<number> {
		try {
			// Calculate the start and end dates for the current month
			const startDate = new Date(
				`${currentYear}-${currentMonth}-01T00:00:00.000Z`,
			);
			const endDate = new Date(startDate);
			endDate.setUTCMonth(endDate.getUTCMonth() + 1);

			// Calculate the start and end dates for the previous month
			const lastMonthStartDate = new Date(startDate);
			lastMonthStartDate.setUTCMonth(lastMonthStartDate.getUTCMonth() - 1);
			const lastMonthEndDate = new Date(startDate);

			// Get the total sales for the current month
			const currentMonthTotalSales = await this.billModel
				.find({
					updatedAt: {
						$gte: startDate,
						$lt: endDate,
					},
					status: BillStatus.Success,
				})
				.select('grandTotal')
				.then((bills) =>
					bills.reduce((total, bill) => total + bill.grandTotal, 0),
				);

			console.log('currentMonthTotalSales', currentMonthTotalSales);

			// Get the total sales for the previous month
			const lastMonthTotalSales = await this.billModel
				.find({
					updatedAt: {
						$gte: lastMonthStartDate,
						$lt: lastMonthEndDate,
					},
					status: BillStatus.Success,
				})
				.select('grandTotal')
				.then((bills) =>
					bills.reduce((total, bill) => total + bill.grandTotal, 0),
				);
			console.log('lastMonthTotalSales', lastMonthTotalSales);

			// Calculate the sales performance percentage
			if (lastMonthTotalSales === 0) {
				return 0; // Avoid division by zero
			}

			const performancePercentage =
				((currentMonthTotalSales - lastMonthTotalSales) / lastMonthTotalSales) *
				100;
			console.log(performancePercentage);
			return performancePercentage;
		} catch (error) {
			console.error('Error calculating sales performance:', error);
			throw error;
		}
	}

	async getTopCustomerOfMonth(month: number, year: number): Promise<any> {
		try {
			const result = await this.billModel.aggregate([
				{
					$match: {
						updatedAt: {
							$gte: new Date(`${year}-${month}-01T00:00:00.000Z`),
							$lte: new Date(`${year}-${month}-31T00:00:00.000Z`),
						},
						status: BillStatus.Success,
					},
				},
				{
					$group: {
						_id: '$user',
						totalAmount: { $sum: '$grandTotal' },
					},
				},
				{
					$sort: { totalAmount: -1 },
				},
				{
					$limit: 1,
				},
				{
					$project: {
						_id: 0,
						user: '$_id',
						totalAmount: 1,
					},
				},
			]);
			return result[0]; // Return the top customer of the month
		} catch (error) {
			console.error('Error retrieving top customer:', error);
			throw error;
		}
	}

	async getMetricsBetweenDates(
		startDate: Date,
		endDate: Date,
	): Promise<
		Array<{
			date: Date;
			totalRevenue: number;
			totalProfit: number;
			totalOrders: number;
			totalProducts: number;
		}>
	> {
		try {
			const result = await this.billModel.aggregate([
				{
					$match: {
						createdAt: {
							$gte: startDate,
							$lte: endDate,
						},
						status: BillStatus.Success,
					},
				},
				{
					$group: {
						_id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
						totalRevenue: { $sum: '$grandTotal' },
						totalCost: { $sum: '$cost' },
						totalOrders: { $sum: 1 },
						totalProducts: { $sum: { $size: '$billItems' } },
					},
				},
				{
					$project: {
						_id: 0,
						date: { $dateFromString: { dateString: '$_id' } },
						totalProfit: { $subtract: ['$totalRevenue', '$totalCost'] },
						totalOrders: 1,
						totalProducts: 1,
						totalRevenue: 1,
					},
				},
			]);

			return result.map((metrics) => ({
				date: metrics.date,
				totalRevenue: metrics.totalRevenue || 0,
				totalProfit: metrics.totalProfit || 0,
				totalOrders: metrics.totalOrders || 0,
				totalProducts: metrics.totalProducts || 0,
			}));
		} catch (error) {
			throw new BadRequestException('Error calculating metrics between dates');
		}
	}

	// Tính tổng khách hàng đã nhận hàng thành công
	// async getTotalCustomersWithSuccessfulDeliveries(): Promise<number> {
	// 	try {
	// 		const result = await this.billModel.aggregate([
	// 			{
	// 				$match: {
	// 					status: BillStatus.Success,
	// 				},
	// 			},
	// 			{
	// 				$group: {
	// 					_id: '$user', // Group the documents by the user field
	// 				},
	// 			},
	// 			{
	// 				$group: {
	// 					_id: null, // Group to get the total count
	// 					totalCustomers: { $sum: 1 },
	// 				},
	// 			},
	// 		]);

	// 		const totalCustomers = result.length > 0 ? result[0].totalCustomers : 0;

	// 		console.log(
	// 			'Total customers with successful deliveries:',
	// 			totalCustomers,
	// 		);
	// 		return totalCustomers;
	// 	} catch (error) {
	// 		console.error(
	// 			'Error calculating total customers with successful deliveries:',
	// 			error,
	// 		);
	// 		throw error;
	// 	}
	// }
}
