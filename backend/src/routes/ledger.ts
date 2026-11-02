import type { FastifyPluginAsync } from "fastify";
import { getLedgerSummary } from "../services/reconciliation";
import { prisma } from "../lib/prisma";

export const ledgerRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/ledger/summary
  app.get("/summary", async () => {
    const summary = await getLedgerSummary();
    return { data: summary };
  });

  // GET /api/ledger/entries
  app.get("/entries", async (req) => {
    const q = req.query as Record<string, string>;
    const page = Number(q.page) || 1;
    const limit = Number(q.limit) || 50;

    const [entries, total] = await Promise.all([
      prisma.ledgerEntry.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        where: q.accountId ? { accountId: q.accountId } : undefined,
        include: {
          account: { select: { name: true, accountNo: true } },
          transaction: { select: { status: true, description: true } },
        },
      }),
      prisma.ledgerEntry.count(
        q.accountId ? { where: { accountId: q.accountId } } : undefined
      ),
    ]);

    return {
      data: entries,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  });

  // GET /api/ledger/entries/:transactionId
  app.get("/entries/:transactionId", async (req) => {
    const { transactionId } = req.params as { transactionId: string };
    const entries = await prisma.ledgerEntry.findMany({
      where: { transactionId },
      include: { account: { select: { name: true, accountNo: true } } },
    });
    return { data: entries };
  });
};

