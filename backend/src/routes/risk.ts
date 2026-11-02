import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma";
import { approveReview, rejectReview } from "../risk/ai-explainer";

export const riskRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/risk/queue — manual review queue
  app.get("/queue", async (req) => {
    const q = req.query as Record<string, string>;
    const page = Number(q.page) || 1;
    const limit = Number(q.limit) || 20;

    const [items, total] = await Promise.all([
      prisma.riskAssessment.findMany({
        where: {
          reviewedAt: null,
          transaction: { status: "REVIEW" },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { riskScore: "desc" },
        include: {
          transaction: {
            include: {
              fromAccount: { select: { id: true, name: true, accountNo: true } },
              toAccount: { select: { id: true, name: true, accountNo: true } },
            },
          },
        },
      }),
      prisma.riskAssessment.count({
        where: { reviewedAt: null, transaction: { status: "REVIEW" } },
      }),
    ]);

    const parsed = items.map((item) => ({
      ...item,
      flaggedSignals: JSON.parse(item.flaggedSignals || "[]"),
    }));

    return {
      data: parsed,
      meta: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  });

  // GET /api/risk/stats
  app.get("/stats", async () => {
    const [byLevel, recentFlagged, avgScore] = await Promise.all([
      prisma.riskAssessment.groupBy({
        by: ["riskLevel"],
        _count: { id: true },
      }),
      prisma.riskAssessment.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          riskScore: { gte: 50 },
        },
      }),
      prisma.riskAssessment.aggregate({ _avg: { riskScore: true } }),
    ]);

    return {
      data: {
        byLevel,
        recentFlagged,
        avgScore: Math.round(avgScore._avg.riskScore ?? 0),
      },
    };
  });

  // GET /api/risk/:transactionId
  app.get("/:transactionId", async (req) => {
    const { transactionId } = req.params as { transactionId: string };
    const assessment = await prisma.riskAssessment.findUniqueOrThrow({
      where: { transactionId },
      include: {
        transaction: {
          include: {
            fromAccount: { select: { name: true, accountNo: true } },
            toAccount: { select: { name: true, accountNo: true } },
          },
        },
      },
    });
    return {
      data: {
        ...assessment,
        flaggedSignals: JSON.parse(assessment.flaggedSignals || "[]"),
      },
    };
  });

  // POST /api/risk/:transactionId/approve
  app.post("/:transactionId/approve", async (req, reply) => {
    const { transactionId } = req.params as { transactionId: string };
    const body = (req.body as { reviewedBy?: string; notes?: string }) || {};
    await approveReview(transactionId, body.reviewedBy ?? "compliance_analyst", body.notes);
    return reply.send({ data: { approved: true, transactionId } });
  });

  // POST /api/risk/:transactionId/reject
  app.post("/:transactionId/reject", async (req, reply) => {
    const { transactionId } = req.params as { transactionId: string };
    const body = (req.body as { reviewedBy?: string; notes?: string }) || {};
    await rejectReview(transactionId, body.reviewedBy ?? "compliance_analyst", body.notes);
    return reply.send({ data: { rejected: true, transactionId } });
  });
};
