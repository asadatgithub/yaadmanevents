import type { IncomingMessage, ServerResponse } from "node:http";

import confirmBookingHandler from "./api/confirm-booking";
import createCheckoutSessionHandler from "./api/create-checkout-session";
import getBookingDetailsHandler from "./api/get-booking-details";
import scanTicketHandler from "./api/scan-ticket";
import scanHistoryHandler from "./api/scan-history";
import adminCreateUserHandler from "./api/admin-create-user";

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

function enhanceRes(res: ServerResponse) {
  const r = res as ServerResponse & {
    status(code: number): typeof r;
    json(body: unknown): void;
  };
  r.status = (code: number) => {
    res.statusCode = code;
    return r;
  };
  r.json = (body: unknown) => {
    if (!res.headersSent) {
      res.setHeader("Content-Type", "application/json");
    }
    res.end(JSON.stringify(body));
  };
  return r;
}

export function createCheckoutDevMiddleware() {
  const handlers: Record<string, (req: never, res: never) => Promise<unknown>> =
    {
      "/api/create-checkout-session": createCheckoutSessionHandler as (
        req: never,
        res: never,
      ) => Promise<unknown>,
      "/api/confirm-booking": confirmBookingHandler as (
        req: never,
        res: never,
      ) => Promise<unknown>,
      "/api/get-booking-details": getBookingDetailsHandler as (
        req: never,
        res: never,
      ) => Promise<unknown>,
      "/api/scan-ticket": scanTicketHandler as (
        req: never,
        res: never,
      ) => Promise<unknown>,
      "/api/scan-history": scanHistoryHandler as (
        req: never,
        res: never,
      ) => Promise<unknown>,
      "/api/admin-create-user": adminCreateUserHandler as (
        req: never,
        res: never,
      ) => Promise<unknown>,
    };
  return (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const pathOnly = (req.url || "").split("?")[0];
    const handlerPath = handlers[pathOnly];
    if (!handlerPath) {
      next();
      return;
    }
    void (async () => {
      try {
        const handler = handlerPath;
        const enhanced = enhanceRes(res);
        if (req.method === "POST") {
          const raw = await readBody(req);
          let parsed: unknown = {};
          try {
            parsed = raw ? JSON.parse(raw) : {};
          } catch {
            enhanced.status(400).json({ error: "Invalid JSON" });
            return;
          }
          Object.assign(req, { body: parsed });
        }
        const url = new URL(req.url || "", "http://localhost");
        Object.assign(req, { query: Object.fromEntries(url.searchParams.entries()) });
        await handler(req as never, enhanced as never);
      } catch (e) {
        console.error(e);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      }
    })();
  };
}
