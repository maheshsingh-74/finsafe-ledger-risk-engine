import { prisma } from "../lib/prisma";

export async function createAuditLog(data: {
  transactionId?: string;
  action: string;
  actorId?: string;
  actorType?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      transactionId: data.transactionId,
      action: data.action,
      actorId: data.actorId,
      actorType: data.actorType ?? "SYSTEM",
      before: data.before ? JSON.stringify(data.before) : null,
      after: data.after ? JSON.stringify(data.after) : null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    },
  });
}

export async function getAuditLogs(params: {
  transactionId?: string;
  page?: number;
  limit?: number;
}) {
  const { transactionId, page = 1, limit = 50 } = params;
  const skip = (page - 1) * limit;

  const where = transactionId ? { transactionId } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        transaction: {
          select: { id: true, amount: true, status: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const parsed = logs.map((l) => ({
    ...l,
    before: l.before ? JSON.parse(l.before) : null,
    after: l.after ? JSON.parse(l.after) : null,
    metadata: l.metadata ? JSON.parse(l.metadata) : null,
  }));

  return {
    data: parsed,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}
