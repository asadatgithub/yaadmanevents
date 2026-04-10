import nodemailer from "nodemailer";
import QRCode from "qrcode";

interface BookingEmailInput {
  to: string;
  bookingReference: string;
  eventName: string;
  eventDate?: string | null;
  venue?: string | null;
  paymentMethod: "card" | "cash";
  paymentStatus: string;
  totalAmount: number;
  ticketRows: Array<{
    ticket_holder_name: string;
    ticket_index: number;
    qr_payload: string;
  }>;
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendBookingConfirmationEmail(input: BookingEmailInput) {
  const from = process.env.SMTP_FROM;
  const transporter = getTransport();
  if (!transporter || !from) {
    return;
  }

  const qrDataUrls = await Promise.all(
    input.ticketRows.map(async (ticket) => {
      const dataUrl = await QRCode.toDataURL(ticket.qr_payload, { margin: 1, width: 200 });
      return {
        ticket,
        dataUrl,
      };
    }),
  );

  const ticketListHtml = qrDataUrls
    .map(
      ({ ticket, dataUrl }) =>
        `<li style="margin-bottom:16px;"><strong>Ticket ${ticket.ticket_index}</strong> - ${ticket.ticket_holder_name}<br/><img src="${dataUrl}" alt="QR code for ${ticket.ticket_holder_name}" width="160" height="160" style="display:block;margin-top:8px;border:1px solid #e5e7eb;border-radius:8px;padding:6px;background:#fff;"/></li>`,
    )
    .join("");

  const html = `
    <div>
      <h2>Ticket Confirmation</h2>
      <p>Booking reference: <strong>${input.bookingReference}</strong></p>
      <p>Event: <strong>${input.eventName}</strong></p>
      <p>Date: ${input.eventDate || "N/A"}</p>
      <p>Venue: ${input.venue || "N/A"}</p>
      <p>Payment method: <strong>${input.paymentMethod.toUpperCase()}</strong></p>
      <p>Payment status: <strong>${input.paymentStatus}</strong></p>
      <p>Total: <strong>J$${input.totalAmount.toFixed(2)}</strong></p>
      <h3>Tickets</h3>
      <ol>${ticketListHtml}</ol>
    </div>
  `;

  const text = [
    `Ticket Confirmation`,
    `Booking reference: ${input.bookingReference}`,
    `Event: ${input.eventName}`,
    `Date: ${input.eventDate || "N/A"}`,
    `Venue: ${input.venue || "N/A"}`,
    `Payment method: ${input.paymentMethod.toUpperCase()}`,
    `Payment status: ${input.paymentStatus}`,
    `Total: J$${input.totalAmount.toFixed(2)}`,
    ...input.ticketRows.map(
      (ticket) =>
        `Ticket ${ticket.ticket_index} - ${ticket.ticket_holder_name} - QR code attached in HTML version`,
    ),
  ].join("\n");

  await transporter.sendMail({
    from,
    to: input.to,
    subject: `Booking Confirmed: ${input.eventName}`,
    html,
    text,
  });
}

