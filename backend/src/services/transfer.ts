import { prisma } from "../lib/prisma";
import { getIdempotencyResult, setIdempotencyResult } from "../lib/redis";
import { assessRisk } from "../risk/scorer";
import { explainRiskWithAI } from "../risk/ai-explainer";
import { v4 as uuidv4 } from "uuid";

export interface CreateTransferInput {
  idempotencyKey: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export async function createTransfer(input: CreateTransferInput) {
  const { idempotencyKey, fromAccountId, toAccountId, amount, description, metadata } = input;

  // ── 1. Idempotency check ──────────────────────────────────────────────────
  const cached = await getIdempotencyResult(idempotencyKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // ── 2. Validate accounts ──────────────────────────────────────────────────
  const [fromAccount, toAccount] = await Promise.all([
    prisma.account.findUniqueOrThrow({ where: { id: fromAccountId } }),
    prisma.account.findUniqueOrThrow({ where: { id: toAccountId } }),
  ]);

  if (fromAccount.id === toAccount.id) {
    throw Object.assign(new Error("Cannot transfer to the same account"), { statusCode: 400 });
  }

  if (fromAccount.balance < amount) {
    throw Object.assign(new Error(`Insufficient balance. Account balance: ₹${fromAccount.balance}`), { statusCode: 422 });
  }

  // ── 3. Risk assessment (pre-flight) ──────────────────────────────────────
  const riskSignals = await assessRisk({
    fromAccountId,
    toAccountId,
    amount,
    metadata: metadata as Record<string, string> | undefined,
  });

  const initialStatus = riskSignals.riskScore >= 70 ? "REVIEW" : "PROCESSING";

  // ── 4. Execute atomic transfer with double-entry ledger ───────────────────
  const result = await prisma.$transaction(async (tx) => {
    const txnId = uuidv4();
    const newFromBalance = Math.round((fromAccount.balance - amount) * 100) / 100;
    const newToBalance = Math.round((toAccount.balance + amount) * 100) / 100;

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        id: txnId,
        idempotencyKey,
        fromAccountId,
        toAccountId,
        amount,
        description: description || "Account transfer",
        status: initialStatus,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Debit sender
    await tx.account.update({
      where: { id: fromAccountId },
      data: { balance: newFromBalance },
    });

    // Credit receiver
    await tx.account.update({
      where: { id: toAccountId },
      data: { balance: newToBalance },
    });

    // Ledger Entry 1: DEBIT sender
    await tx.ledgerEntry.create({
      data: {
        transactionId: transaction.id,
        accountId: fromAccountId,
        entryType: "DEBIT",
        amount,
        balanceAfter: newFromBalance,
        description: `Transfer to ${toAccount.name}`,
      },
    });

    // Ledger Entry 2: CREDIT receiver
    await tx.ledgerEntry.create({
      data: {
        transactionId: transaction.id,
        accountId: toAccountId,
        entryType: "CREDIT",
        amount,
        balanceAfter: newToBalance,
        description: `Transfer from ${fromAccount.name}`,
      },
    });

    // Save risk assessment
    await tx.riskAssessment.create({
      data: {
        transactionId: transaction.id,
        riskScore: riskSignals.riskScore,
        riskLevel: riskSignals.riskLevel,
        velocitySpike: riskSignals.velocitySpike,
        newDevice: riskSignals.newDevice,
        geoMismatch: riskSignals.geoMismatch,
        amountOutlier: riskSignals.amountOutlier,
        flaggedSignals: JSON.stringify(riskSignals.signals),
      },
    });

    // If not flagged for manual review, transition to SETTLED
    let finalStatus = initialStatus;
    if (initialStatus === "PROCESSING") {
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { status: "SETTLED" },
      });
      finalStatus = "SETTLED";
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        transactionId: transaction.id,
        action: "TRANSFER_CREATED",
        actorType: "API",
        after: JSON.stringify({
          status: finalStatus,
          amount,
          fromAccountId,
          toAccountId,
          riskScore: riskSignals.riskScore,
        }),
      },
    });

    return { ...transaction, status: finalStatus, riskScore: riskSignals.riskScore };
  });

  // ── 5. AI explanation for flagged transactions ────────────────────────────
  if (riskSignals.riskScore >= 40) {
    explainRiskWithAI(result.id, riskSignals).catch(console.error);
  }

  // ── 6. Cache idempotency result ───────────────────────────────────────────
  const response = {
    id: result.id,
    status: result.status,
    amount: result.amount,
    fromAccountId: result.fromAccountId,
    toAccountId: result.toAccountId,
    riskScore: riskSignals.riskScore,
    riskLevel: riskSignals.riskLevel,
    createdAt: result.createdAt,
    fromCache: false,
  };

  await setIdempotencyResult(idempotencyKey, response);
  return response;
}

export async function refundTransfer(transactionId: string, reason?: string) {
  const original = await prisma.transaction.findUniqueOrThrow({
    where: { id: transactionId },
    include: { fromAccount: true, toAccount: true },
  });

  if (original.status !== "SETTLED") {
    throw Object.assign(
      new Error(`Cannot refund transaction with status ${original.status}`),
      { statusCode: 422 }
    );
  }

  const refundKey = `refund_${transactionId}_${Date.now()}`;
  return createTransfer({
    idempotencyKey: refundKey,
    fromAccountId: original.toAccountId,
    toAccountId: original.fromAccountId,
    amount: original.amount,
    description: `Refund for TX-${transactionId.slice(0, 8)} - ${reason ?? "Requested refund"}`,
    metadata: { originalTransactionId: transactionId, isRefund: true },
  });
}

export async function getTransactionById(id: string) {
  const txn = await prisma.transaction.findUniqueOrThrow({
    where: { id },
    include: {
      fromAccount: { select: { id: true, name: true, accountNo: true } },
      toAccount: { select: { id: true, name: true, accountNo: true } },
      ledgerEntries: true,
      riskAssessment: true,
      auditLogs: { orderBy: { createdAt: "asc" } },
    },
  });

  return {
    ...txn,
    metadata: txn.metadata ? JSON.parse(txn.metadata) : null,
    riskAssessment: txn.riskAssessment
      ? {
          ...txn.riskAssessment,
          flaggedSignals: JSON.parse(txn.riskAssessment.flaggedSignals || "[]"),
        }
      : null,
  };
}

export async function listTransactions(params: {
  page?: number;
  limit?: number;
  status?: string;
  accountId?: string;
}) {
  const { page = 1, limit = 20, status, accountId } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status }),
    ...(accountId && {
      OR: [{ fromAccountId: accountId }, { toAccountId: accountId }],
    }),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        fromAccount: { select: { id: true, name: true, accountNo: true } },
        toAccount: { select: { id: true, name: true, accountNo: true } },
        riskAssessment: {
          select: {
            riskScore: true,
            riskLevel: true,
            flaggedSignals: true,
            aiExplanation: true,
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  const parsed = transactions.map((t) => ({
    ...t,
    metadata: t.metadata ? JSON.parse(t.metadata) : null,
    riskAssessment: t.riskAssessment
      ? {
          ...t.riskAssessment,
          flaggedSignals: JSON.parse(t.riskAssessment.flaggedSignals || "[]"),
        }
      : null,
  }));

  return {
    data: parsed,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}
