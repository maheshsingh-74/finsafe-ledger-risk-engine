import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const createAccountSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  type: z.enum(["SAVINGS", "CURRENT", "MERCHANT"]).default("SAVINGS"),
  initialBalance: z.number().nonnegative().max(10_000_000).default(0),
});

export const accountRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/accounts
  app.get("/", async () => {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        accountNo: true,
        type: true,
        currency: true,
        balance: true,
        createdAt: true,
      },
    });
    return { data: accounts };
  });

  // GET /api/accounts/:id
  app.get("/:id", async (req) => {
    const { id } = req.params as { id: string };
    const account = await prisma.account.findUniqueOrThrow({
      where: { id },
      include: {
        sentTransactions: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { toAccount: { select: { name: true } } },
        },
        receivedTransactions: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { fromAccount: { select: { name: true } } },
        },
      },
    });
    return { data: account };
  });

  // POST /api/accounts
  app.post("/", async (req, reply) => {
    const body = createAccountSchema.parse(req.body);
    const accountNo = `ACC${Date.now().toString().slice(-8)}`;

    const account = await prisma.account.create({
      data: {
        name: body.name,
        email: body.email,
        accountNo,
        type: body.type,
        balance: body.initialBalance,
      },
    });

    return reply.status(201).send({ data: account });
  });

  // GET /api/accounts/:id/balance
  app.get("/:id/balance", async (req) => {
    const { id } = req.params as { id: string };
    const account = await prisma.account.findUniqueOrThrow({
      where: { id },
      select: { id: true, name: true, balance: true, currency: true },
    });
    return { data: account };
  });
};

