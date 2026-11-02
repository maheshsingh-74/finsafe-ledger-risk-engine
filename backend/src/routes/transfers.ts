import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { createTransfer, refundTransfer, getTransactionById, listTransactions } from "../services/transfer";

const createTransferSchema = z.object({
  idempotencyKey: z.string().min(1).max(128),
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive().max(10_000_000),
  description: z.string().max(255).optional(),
  metadata: z.record(z.string()).optional(),
});

export const transferRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/transfers — create transfer
  app.post("/", async (req, reply) => {
    const body = createTransferSchema.parse(req.body);
    const result = await createTransfer(body);
    const statusCode = result.fromCache ? 200 : 201;
    return reply.status(statusCode).send({ data: result });
  });

  // GET /api/transfers — list transactions
  app.get("/", async (req) => {
    const query = req.query as Record<string, string>;
    return listTransactions({
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      status: query.status,
      accountId: query.accountId,
    });
  });

  // GET /api/transfers/:id — get single transaction
  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const txn = await getTransactionById(id);
    return { data: txn };
  });

  // POST /api/transfers/:id/refund — refund
  app.post("/:id/refund", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as { reason?: string };
    const result = await refundTransfer(id, body?.reason);
    return reply.status(201).send({ data: result });
  });
};

