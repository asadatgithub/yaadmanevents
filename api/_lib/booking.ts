import crypto from "node:crypto";

export type PaymentMethod = "card" | "cash";

export interface TicketInput {
  name: string;
}

export function parseTicketHolders(value: unknown): TicketInput[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) =>
      typeof item === "string"
        ? { name: item.trim() }
        : { name: String((item as { name?: string }).name || "").trim() },
    )
    .filter((x) => x.name.length > 0);
}

export function normalizePaymentMethod(value: unknown): PaymentMethod {
  return value === "cash" ? "cash" : "card";
}

export function createBookingReference() {
  return `BKG-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
}

export function createQrToken() {
  return crypto.randomBytes(18).toString("base64url");
}

export async function insertBookingTickets(
  admin: any,
  args: {
    bookingId: string;
    eventId: string;
    ticketHolders: TicketInput[];
    appOrigin: string;
  },
) {
  const rows = args.ticketHolders.map((holder, index) => {
    const qrToken = createQrToken();
    return {
      booking_id: args.bookingId,
      event_id: args.eventId,
      ticket_holder_name: holder.name,
      ticket_index: index + 1,
      qr_token: qrToken,
      qr_payload: `${args.appOrigin}/scan-ticket?token=${encodeURIComponent(qrToken)}`,
      ticket_status: "issued",
    };
  });

  const { data, error } = await admin
    .from("booking_tickets")
    .insert(rows as any)
    .select("*")
    .order("ticket_index", { ascending: true });

  if (error) {
    throw new Error("Failed to create booking tickets");
  }

  return data || [];
}

