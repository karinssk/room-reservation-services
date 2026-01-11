const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

// Helper function to format date
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking, room, individualRoom = null) => {
    try {
        const transporter = createTransporter();

        // Calculate nights
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

        // Extract room name (handle multi-language)
        const roomName = typeof room.name === 'string' ? room.name : room.name.en || room.name.th || 'Room';

        // Build email HTML
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
        }
        .booking-number {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .booking-number .label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .booking-number .number {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-top: 5px;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f3f4f6;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            color: #6b7280;
            font-weight: 500;
        }
        .detail-value {
            color: #111827;
            font-weight: 600;
        }
        .price-breakdown {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .price-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }
        .total-row {
            border-top: 2px solid #e5e7eb;
            margin-top: 10px;
            padding-top: 10px;
            font-size: 18px;
            font-weight: bold;
        }
        .total-row .amount {
            color: #2563eb;
        }
        .info-box {
            background: #eff6ff;
            border-left: 4px solid #2563eb;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            border-radius: 0 0 10px 10px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1> Booking Confirmed!</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for choosing The Wang Yaowarat Hotel</p>
    </div>

    <div class="content">
        <p>Dear ${booking.guestName},</p>

        <p>We're delighted to confirm your reservation at The Wang Yaowarat Hotel. Your booking details are below:</p>

        <div class="booking-number">
            <div class="label">Booking Number</div>
            <div class="number">${booking.bookingNumber}</div>
        </div>

        <h2 style="color: #111827; margin-top: 30px;">Room Details</h2>
        <div class="detail-row">
            <span class="detail-label">Room Type</span>
            <span class="detail-value">${roomName}</span>
        </div>
        ${individualRoom ? `
        <div class="detail-row">
            <span class="detail-label">Room Number</span>
            <span class="detail-value">${individualRoom.roomNumber}${individualRoom.floor ? ` (Floor ${individualRoom.floor})` : ''}</span>
        </div>
        ` : ''}
        <div class="detail-row">
            <span class="detail-label">Number of Guests</span>
            <span class="detail-value">${booking.numberOfGuests} ${booking.numberOfGuests === 1 ? 'guest' : 'guests'}</span>
        </div>

        <h2 style="color: #111827; margin-top: 30px;">Stay Details</h2>
        <div class="detail-row">
            <span class="detail-label">Check-in</span>
            <span class="detail-value">${formatDate(booking.checkInDate)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Check-out</span>
            <span class="detail-value">${formatDate(booking.checkOutDate)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Length of Stay</span>
            <span class="detail-value">${nights} ${nights === 1 ? 'night' : 'nights'}</span>
        </div>

        <h2 style="color: #111827; margin-top: 30px;">Price Breakdown</h2>
        <div class="price-breakdown">
            <div class="price-row">
                <span>Room price × ${nights} night${nights > 1 ? 's' : ''}</span>
                <span>฿${booking.roomPrice.toLocaleString()}</span>
            </div>
            ${booking.discount > 0 ? `
            <div class="price-row" style="color: #059669;">
                <span>Discount${booking.promoCode ? ` (${booking.promoCode})` : ''}</span>
                <span>-฿${booking.discount.toLocaleString()}</span>
            </div>
            ` : ''}
            <div class="price-row total-row">
                <span>Total</span>
                <span class="amount">฿${booking.totalPrice.toLocaleString()}</span>
            </div>
        </div>

        ${booking.specialRequests ? `
        <div class="info-box">
            <strong>Special Requests:</strong><br>
            ${booking.specialRequests}
        </div>
        ` : ''}

        <div class="info-box">
            <strong>📍 Check-in Information:</strong><br>
            • Check-in time: 2:00 PM<br>
            • Check-out time: 12:00 PM (noon)<br>
            • Please present your booking number upon arrival<br>
            • Early check-in and late check-out may be available upon request
        </div>

        <div style="text-align: center;">
            <a href="${process.env.FRONTEND_DEVELOPMENT_URL}/en/my-booking?bookingNumber=${booking.bookingNumber}" class="button">
                View Booking Details
            </a>
        </div>

        <p style="margin-top: 30px;">If you have any questions or need to modify your reservation, please don't hesitate to contact us.</p>

        <p style="margin-top: 20px;">We look forward to welcoming you!</p>

        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Best regards,<br>
            <strong>The Wang Yaowarat Hotel Team</strong>
        </p>
    </div>

    <div class="footer">
        <p style="margin: 0 0 10px 0;">The Wang Yaowarat Hotel</p>
        <p style="margin: 0; font-size: 12px;">
            This is an automated email. Please do not reply to this message.<br>
            For inquiries, contact us at info@fastforwardssl.com
        </p>
    </div>
</body>
</html>
        `;

        // Email options
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
            to: booking.guestEmail,
            subject: `Booking Confirmation - ${booking.bookingNumber} - The Wang Yaowarat Hotel`,
            html: emailHtml,
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Booking confirmation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending booking confirmation email:', error);
        return { success: false, error: error.message };
    }
};

// Send booking cancellation email
const sendBookingCancellation = async (booking, room, cancellationReason = '') => {
    try {
        const transporter = createTransporter();

        const roomName = typeof room.name === 'string' ? room.name : room.name.en || room.name.th || 'Room';

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #dc2626;
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
        }
        .booking-number {
            background: #fee2e2;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            border-radius: 0 0 10px 10px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Booking Cancelled</h1>
    </div>

    <div class="content">
        <p>Dear ${booking.guestName},</p>

        <p>This email confirms that your booking has been cancelled.</p>

        <div class="booking-number">
            <strong>Booking Number: ${booking.bookingNumber}</strong>
        </div>

        <p><strong>Room:</strong> ${roomName}<br>
        <strong>Check-in:</strong> ${formatDate(booking.checkInDate)}<br>
        <strong>Check-out:</strong> ${formatDate(booking.checkOutDate)}</p>

        ${cancellationReason ? `<p><strong>Cancellation Reason:</strong> ${cancellationReason}</p>` : ''}

        <p>If you did not request this cancellation or have any questions, please contact us immediately.</p>

        <p>We hope to serve you in the future.</p>

        <p>Best regards,<br>
        The Wang Yaowarat Hotel Team</p>
    </div>

    <div class="footer">
        <p style="margin: 0;">The Wang Yaowarat Hotel</p>
    </div>
</body>
</html>
        `;

        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
            to: booking.guestEmail,
            subject: `Booking Cancelled - ${booking.bookingNumber}`,
            html: emailHtml,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Cancellation email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending cancellation email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendBookingConfirmation,
    sendBookingCancellation,
};
