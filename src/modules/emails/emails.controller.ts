// your.controller.ts or your.service.ts

import { Body, Controller, Post } from '@nestjs/common';
import { Bill, BillPaymentMethod } from '../bills/schemas/bills.schema';
import { EmailsService } from './emails.service';

@Controller('your')
export class EmailsController {
	constructor(private readonly emailService: EmailsService) {}

	@Post('send-email/buy-success')
	async sendEmail(@Body() input: Bill) {
		const to = 'nhungyenhuynh@gmail.com';
		const subject =
			'Successful Purchase Notification (Thông báo giao hàng thành công)';
		const currentDate = new Date();
		const tomorrow = new Date(currentDate);
		tomorrow.setDate(currentDate.getDate() + 3);

		const text = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Successful Purchase Notification (Thông báo giao hàng thành công)</title>
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
        
                h2 {
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
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Successful Purchase Notification (Thông báo giao hàng thành công)</h2>
                <p>Hello ${
									input.user.firstName +
									' ' +
									input.user.lastName +
									' (' +
									input.user.username +
									')'
								},</p>
                <p>Thank you for making a purchase at our store. Below are the details of your order:</p>
        
                <div class="order-details">
                    <table>
                        <tr>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Price</th>
                        </tr>
                       ${input.billItems.map(
													(item) =>
														`                            <tr>
                        <td>
                            <img src="${
															item.productSku.photos[0].imageURL
														}" alt="${item.productSku.photos[0].name}">
                            ${item.product.name}
                        </td>
                        <td>${item.quantity}</td>
                        <td>${new Intl.NumberFormat('vi-VN', {
													style: 'currency',
													currency: 'VND',
												}).format(item.price)}</td>
                    </tr>`,
												)}
                        
                    </table>
                </div>
        
                <p><strong>Total Order Value:</strong>${new Intl.NumberFormat(
									'vi-VN',
									{
										style: 'currency',
										currency: 'VND',
									},
								).format(input.grandTotal)}</p>
        
                <p><strong>Payment Method:</strong> ${
									input.paymentMethod === BillPaymentMethod.Cod
										? 'Cash On Delivery (Thanh toán khi nhận hàng)'
										: input.cardName
								}</p>
                <p><strong>Shipping Address:</strong> ${
									input.address.addressDetail +
									' ' +
									input.address.commune +
									' ' +
									input.address.district +
									' ' +
									input.address.province
								}</p>
        
                <p><strong>Shipping Method:</strong> Standard Shipping ${new Intl.NumberFormat(
									'vi-VN',
									{
										style: 'currency',
										currency: 'VND',
									},
								).format(input.shipping)}</p>
                <p><strong>Estimated Delivery Date(Dự kiến ​​giao hàng ngày):</strong> ${tomorrow.toLocaleDateString()}</p>
        
                <p class="thank-you">Thank you for choosing us! We look forward to serving you again.</p>
            </div>
        </body>
        </html>
        `;

		await this.emailService.sendEmail(to, subject, text);

		return 'Email sent successfully!';
	}
}
