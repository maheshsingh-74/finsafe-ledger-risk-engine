import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma";
import { createTransfer, listTransactions } from "../services/transfer";
import { runReconciliation, getLedgerSummary } from "../services/reconciliation";
import { assessRisk } from "../risk/scorer";
import { v4 as uuidv4 } from "uuid";

describe("FinSafe Core Infrastructure & Ledger Invariants", () => {
  let senderId: string;
  let receiverId: string;

  beforeAll(async () => {
    // Fetch two test accounts
    const accounts = await prisma.account.findMany({ take: 2 });
    senderId = accounts[0].id;
    receiverId = accounts[1].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("Invariant: Debits must equal Credits on every transfer (Double-Entry)", async () => {
    const transferAmount = 5000;
    const testKey = `test_idemp_${uuidv4()}`;

    const beforeSender = await prisma.account.findUniqueOrThrow({ where: { id: senderId } });
    const beforeReceiver = await prisma.account.findUniqueOrThrow({ where: { id: receiverId } });

    const result = await createTransfer({
      idempotencyKey: testKey,
      fromAccountId: senderId,
      toAccountId: receiverId,
      amount: transferAmount,
      description: "Automated ledger test",
    });

    expect((result as any).id).toBeDefined();

    // Verify balance movement
    const afterSender = await prisma.account.findUniqueOrThrow({ where: { id: senderId } });
    const afterReceiver = await prisma.account.findUniqueOrThrow({ where: { id: receiverId } });

    expect(afterSender.balance).toBeCloseTo(beforeSender.balance - transferAmount);
    expect(afterReceiver.balance).toBeCloseTo(beforeReceiver.balance + transferAmount);

    // Verify ledger entries
    const entries = await prisma.ledgerEntry.findMany({
      where: { transactionId: (result as any).id },
    });

    expect(entries).toHaveLength(2);
    const debit = entries.find((e) => e.entryType === "DEBIT");
    const credit = entries.find((e) => e.entryType === "CREDIT");

    expect(debit?.amount).toBe(transferAmount);
    expect(credit?.amount).toBe(transferAmount);
    expect(debit?.accountId).toBe(senderId);
    expect(credit?.accountId).toBe(receiverId);
  });

  it("Idempotency: Replaying with identical key returns cached result without moving money twice", async () => {
    const idempotentKey = `idemp_replay_test_${uuidv4()}`;
    const amount = 1500;

    const initialSender = await prisma.account.findUniqueOrThrow({ where: { id: senderId } });

    // First call
    const res1 = await createTransfer({
      idempotencyKey: idempotentKey,
      fromAccountId: senderId,
      toAccountId: receiverId,
      amount,
    });
    expect(res1.fromCache).toBe(false);

    // Second call with same idempotencyKey
    const res2 = await createTransfer({
      idempotencyKey: idempotentKey,
      fromAccountId: senderId,
      toAccountId: receiverId,
      amount,
    });

    expect(res2.fromCache).toBe(true);
    expect((res2 as any).id).toBe((res1 as any).id);

    // Ensure money only moved ONCE
    const postSender = await prisma.account.findUniqueOrThrow({ where: { id: senderId } });
    expect(postSender.balance).toBeCloseTo(initialSender.balance - amount);
  });

  it("Safety: Prevents overdraft when account balance is insufficient", async () => {
    const hugeAmount = 999_999_999;
    const key = `insufficient_${uuidv4()}`;

    await expect(
      createTransfer({
        idempotencyKey: key,
        fromAccountId: senderId,
        toAccountId: receiverId,
        amount: hugeAmount,
      })
    ).rejects.toThrow("Insufficient balance");
  });

  it("AI Risk Engine: Flags anomalous transactions based on multi-signal indicators", async () => {
    const freshDeviceId = `dev_brand_new_${uuidv4().slice(0, 8)}`;
    const risk = await assessRisk({
      fromAccountId: senderId,
      toAccountId: receiverId,
      amount: 450000,
      metadata: {
        deviceId: freshDeviceId,
        location: "Mumbai",
        ipLocation: "Delhi",
      },
    });

    expect(risk.riskScore).toBeGreaterThanOrEqual(50);
    expect(risk.newDevice).toBe(true);
    expect(risk.geoMismatch).toBe(true);
    expect(risk.signals.length).toBeGreaterThanOrEqual(2);
  });

  it("Reconciliation: Accurately checks overall system ledger balance", async () => {
    const report = await runReconciliation();
    expect(report.isBalanced).toBe(true);
    expect(report.discrepancyAmount).toBe(0);
    expect(report.totalDebits).toBe(report.totalCredits);

    const summary = await getLedgerSummary();
    expect(summary.isBalanced).toBe(true);
  });
});

