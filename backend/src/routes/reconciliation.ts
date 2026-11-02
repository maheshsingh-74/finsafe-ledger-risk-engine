import type { FastifyPluginAsync } from "fastify";
import { runReconciliation, getLatestReconciliationReport } from "../services/reconciliation";
import { prisma } from "../lib/prisma";

export const reconciliationRoutes: FastifyPluginAsync = async (app) => {
  // POST /api/reconciliation/run
  app.post("/run", async (req, reply) => {
    const report = await runReconciliation();
    return reply.status(201).send({ data: report });
  });

  // GET /api/reconciliation/latest
  app.get("/latest", async () => {
    const report = await getLatestReconciliationReport();
    return { data: report };
  });

  // GET /api/reconciliation/history
  app.get("/history", async (req) => {
    const q = req.query as Record<string, string>;
    const reports = await prisma.reconciliationReport.findMany({
      take: Number(q.limit) || 10,
      orderBy: { createdAt: "desc" },
    });
    return { data: reports };
  });
};

