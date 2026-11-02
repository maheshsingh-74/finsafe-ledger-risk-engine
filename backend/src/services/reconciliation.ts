import { prisma } from "../lib/prisma";

export async function runReconciliation() {
  const now = new Date();

  // ── 1. Aggregate ledger entries ───────────────────────────────────────────
  const [debits, credits] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: { entryType: "DEBIT" },
      _sum: { amount: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: { entryType: "CREDIT" },
      _sum: { amount: true },
    }),
  ]);

  const totalDebits = debits._sum.amount ?? 0;
  const totalCredits = credits._sum.amount ?? 0;
  const discrepancy = Math.abs(Math.round((totalDebits - totalCredits) * 100) / 100);
  const isBalanced = discrepancy === 0;

  // ── 2. Count by status ────────────────────────────────────────────────────
  const statusCounts = await prisma.transaction.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const counts: Record<string, number> = {
    SETTLED: 0,
    PENDING: 0,
    REVIEW: 0,
    FAILED: 0,
    INITIATED: 0,
    PROCESSING: 0,
    REVERSED: 0,
  };
  statusCounts.forEach((s) => {
    counts[s.status] = s._count.id;
  });

  // ── 3. Save report ────────────────────────────────────────────────────────
  const report = await prisma.reconciliationReport.create({
    data: {
      reportDate: now,
      totalDebits,
      totalCredits,
      isBalanced,
      discrepancyAmount: discrepancy,
      flaggedCount: counts.REVIEW ?? 0,
      settledCount: counts.SETTLED ?? 0,
      pendingCount: (counts.INITIATED ?? 0) + (counts.PROCESSING ?? 0),
      reviewCount: counts.REVIEW ?? 0,
      reportData: JSON.stringify({
        statusBreakdown: counts,
        runAt: now.toISOString(),
      }),
    },
  });

  return {
    reportId: report.id,
    reportDate: report.reportDate,
    totalDebits,
    totalCredits,
    isBalanced,
    discrepancyAmount: discrepancy,
    flaggedCount: counts.REVIEW ?? 0,
    statusBreakdown: counts,
  };
}

export async function getLatestReconciliationReport() {
  const report = await prisma.reconciliationReport.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!report) return null;
  return {
    ...report,
    reportData: JSON.parse(report.reportData),
  };
}

export async function getLedgerSummary() {
  const [totalDebits, totalCredits, entryCount] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: { entryType: "DEBIT" },
      _sum: { amount: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: { entryType: "CREDIT" },
      _sum: { amount: true },
    }),
    prisma.ledgerEntry.count(),
  ]);

  const d = totalDebits._sum.amount ?? 0;
  const c = totalCredits._sum.amount ?? 0;

  return {
    totalDebits: d,
    totalCredits: c,
    isBalanced: Math.abs(d - c) === 0,
    entryCount,
  };
}
