import type { FastifyPluginAsync } from "fastify";
import { getAuditLogs } from "../services/audit";

export const auditRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async (req) => {
    const q = req.query as Record<string, string>;
    return getAuditLogs({
      transactionId: q.transactionId,
      page: Number(q.page) || 1,
      limit: Number(q.limit) || 50,
    });
  });
};

