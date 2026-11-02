import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

const DEVICE_IDS = [
  "dev_iphone_001",
  "dev_android_002",
  "dev_web_003",
  "dev_tablet_004",
  "dev_unknown_999",
];

const LOCATIONS = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad"];

async function main() {
  console.log("🌱 Seeding FinSafe database...");

  // ── Clean existing data ────────────────────────────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.riskAssessment.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.deviceHistory.deleteMany();
  await prisma.reconciliationReport.deleteMany();
  await prisma.account.deleteMany();
  console.log("🗑️  Cleared existing tables");

  // ── 1. Create Accounts ─────────────────────────────────────────────────────
  const accountsData = [
    { name: "Alice Sharma", email: "alice@finsafe.dev", type: "SAVINGS", balance: 850000 },
    { name: "Bob Mehta", email: "bob@finsafe.dev", type: "SAVINGS", balance: 320000 },
    { name: "CorpXYZ Technologies", email: "corp@finsafe.dev", type: "CURRENT", balance: 5000000 },
    { name: "Priya Nair", email: "priya@finsafe.dev", type: "SAVINGS", balance: 120000 },
    { name: "Raj Patel", email: "raj@finsafe.dev", type: "SAVINGS", balance: 450000 },
    { name: "TechMart Solutions", email: "techmart@finsafe.dev", type: "MERCHANT", balance: 2100000 },
    { name: "Sunita Verma", email: "sunita@finsafe.dev", type: "SAVINGS", balance: 75000 },
    { name: "Dev Kumar", email: "dev@finsafe.dev", type: "SAVINGS", balance: 930000 },
    { name: "PayHub Gateway", email: "payhub@finsafe.dev", type: "MERCHANT", balance: 3400000 },
    { name: "Meera Reddy", email: "meera@finsafe.dev", type: "SAVINGS", balance: 210000 },
  ];

  const accounts = [];
  for (let i = 0; i < accountsData.length; i++) {
    const a = accountsData[i];
    const acc = await prisma.account.create({
      data: {
        name: a.name,
        email: a.email,
        accountNo: `ACC${(10000001 + i).toString()}`,
        type: a.type,
        currency: "INR",
        balance: a.balance,
      },
    });
    accounts.push(acc);
  }
  console.log(`✅ Created ${accounts.length} bank accounts`);

  // ── 2. Create Normal Settled Transactions ──────────────────────────────────
  for (let i = 0; i < 45; i++) {
    const fromIdx = Math.floor(Math.random() * accounts.length);
    let toIdx = Math.floor(Math.random() * accounts.length);
    while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * accounts.length);

    const amount = faker.number.int({ min: 500, max: 25000 });
    const deviceId = DEVICE_IDS[Math.floor(Math.random() * 4)];
    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];

    const daysAgo = faker.number.int({ min: 0, max: 20 });
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const txn = await prisma.transaction.create({
      data: {
        id: uuidv4(),
        idempotencyKey: `seed_normal_${i}_${uuidv4().slice(0, 8)}`,
        fromAccountId: accounts[fromIdx].id,
        toAccountId: accounts[toIdx].id,
        amount,
        status: "SETTLED",
        description: faker.helpers.arrayElement([
          "Vendor payment",
          "Utility bill payment",
          "Monthly rent transfer",
          "Software subscription",
          "Consulting fee",
          "Office supplies",
        ]),
        metadata: JSON.stringify({ deviceId, location, ipAddress: "192.168.1.45" }),
        createdAt,
        updatedAt: createdAt,
      },
    });

    // Ledger double-entry
    await prisma.ledgerEntry.create({
      data: {
        transactionId: txn.id,
        accountId: accounts[fromIdx].id,
        entryType: "DEBIT",
        amount,
        balanceAfter: accounts[fromIdx].balance - amount,
        description: `Debit: Transfer to ${accounts[toIdx].name}`,
        createdAt,
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        transactionId: txn.id,
        accountId: accounts[toIdx].id,
        entryType: "CREDIT",
        amount,
        balanceAfter: accounts[toIdx].balance + amount,
        description: `Credit: Transfer from ${accounts[fromIdx].name}`,
        createdAt,
      },
    });

    // Low risk score
    await prisma.riskAssessment.create({
      data: {
        transactionId: txn.id,
        riskScore: faker.number.int({ min: 5, max: 28 }),
        riskLevel: "LOW",
        velocitySpike: false,
        newDevice: false,
        geoMismatch: false,
        amountOutlier: false,
        flaggedSignals: JSON.stringify([]),
        aiExplanation: "Transaction verified. Normal user pattern within standard risk parameters.",
        createdAt,
        updatedAt: createdAt,
      },
    });
  }
  console.log("✅ Created 45 settled transactions with balanced ledger entries");

  // ── 3. Create Suspicious Transactions (Flagged for Review) ─────────────────
  const scenarios = [
    {
      score: 88,
      level: "CRITICAL",
      amount: 78000,
      signals: ["Transaction from an unrecognized device", "Velocity spike in last 7 minutes", "Location differs from account pattern"],
      aiExplanation: "This transaction was flagged because it originated from an unrecognized device with a sudden velocity spike (5+ transfers in 7 minutes) from an unfamiliar IP location. Immediate compliance verification required.",
      velocitySpike: true,
      newDevice: true,
      geoMismatch: true,
      amountOutlier: false,
    },
    {
      score: 82,
      level: "HIGH",
      amount: 250000,
      signals: ["Transfer amount ₹250,000 is significantly above account historical average", "Transaction from an unrecognized device"],
      aiExplanation: "This transaction was flagged because the transfer amount is 4.8x higher than the account's 30-day average and initiated from a new hardware signature.",
      velocitySpike: false,
      newDevice: true,
      geoMismatch: false,
      amountOutlier: true,
    },
    {
      score: 75,
      level: "HIGH",
      amount: 100000,
      signals: ["Location mismatch: account in Mumbai, IP detected from Chennai", "Large round-number transaction (structuring risk)"],
      aiExplanation: "This transaction was flagged because the origin IP geo-location deviates from the primary registration hub and exhibits structuring characteristics.",
      velocitySpike: false,
      newDevice: false,
      geoMismatch: true,
      amountOutlier: false,
    },
    {
      score: 92,
      level: "CRITICAL",
      amount: 450000,
      signals: ["5+ transactions in last 7 minutes from this account", "Transaction from an unrecognized device", "Large round-number transaction"],
      aiExplanation: "This transaction was flagged due to multiple high-severity signals: rapid transaction velocity, an unknown device ID, and a high-value round sum.",
      velocitySpike: true,
      newDevice: true,
      geoMismatch: false,
      amountOutlier: true,
    },
  ];

  for (let i = 0; i < 17; i++) {
    const sc = scenarios[i % scenarios.length];
    const fromIdx = Math.floor(Math.random() * accounts.length);
    let toIdx = Math.floor(Math.random() * accounts.length);
    while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * accounts.length);

    const hoursAgo = faker.number.int({ min: 1, max: 36 });
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const txn = await prisma.transaction.create({
      data: {
        id: uuidv4(),
        idempotencyKey: `seed_suspicious_${i}_${uuidv4().slice(0, 8)}`,
        fromAccountId: accounts[fromIdx].id,
        toAccountId: accounts[toIdx].id,
        amount: sc.amount,
        status: "REVIEW",
        description: "High-value external remittance",
        metadata: JSON.stringify({ deviceId: "dev_unknown_999", location: "Unknown" }),
        createdAt,
        updatedAt: createdAt,
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        transactionId: txn.id,
        accountId: accounts[fromIdx].id,
        entryType: "DEBIT",
        amount: sc.amount,
        balanceAfter: accounts[fromIdx].balance - sc.amount,
        description: `Pending Review: Debit to ${accounts[toIdx].name}`,
        createdAt,
      },
    });

    await prisma.ledgerEntry.create({
      data: {
        transactionId: txn.id,
        accountId: accounts[toIdx].id,
        entryType: "CREDIT",
        amount: sc.amount,
        balanceAfter: accounts[toIdx].balance + sc.amount,
        description: `Pending Review: Credit from ${accounts[fromIdx].name}`,
        createdAt,
      },
    });

    await prisma.riskAssessment.create({
      data: {
        transactionId: txn.id,
        riskScore: sc.score,
        riskLevel: sc.level,
        velocitySpike: sc.velocitySpike,
        newDevice: sc.newDevice,
        geoMismatch: sc.geoMismatch,
        amountOutlier: sc.amountOutlier,
        flaggedSignals: JSON.stringify(sc.signals),
        aiExplanation: sc.aiExplanation,
        createdAt,
        updatedAt: createdAt,
      },
    });
  }
  console.log("✅ Created 17 flagged transactions in the manual review queue");

  // ── 4. Initial Reconciliation Report ───────────────────────────────────────
  const debits = await prisma.ledgerEntry.aggregate({
    where: { entryType: "DEBIT" },
    _sum: { amount: true },
  });
  const credits = await prisma.ledgerEntry.aggregate({
    where: { entryType: "CREDIT" },
    _sum: { amount: true },
  });

  const totDeb = debits._sum.amount ?? 0;
  const totCred = credits._sum.amount ?? 0;

  await prisma.reconciliationReport.create({
    data: {
      reportDate: new Date(),
      totalDebits: totDeb,
      totalCredits: totCred,
      isBalanced: totDeb === totCred,
      discrepancyAmount: 0,
      flaggedCount: 17,
      settledCount: 45,
      pendingCount: 0,
      reviewCount: 17,
      reportData: JSON.stringify({
        status: "BALANCED",
        auditSequence: "#88422",
        lastReconciledAt: new Date().toISOString(),
      }),
    },
  });

  console.log("\n🚀 FINSAFE SEED SUCCESSFUL!");
  console.log("==========================================");
  console.log(` Ledger State:  BALANCED (Debits = Credits = ₹${totDeb.toLocaleString()})`);
  console.log(` Risk Queue:    17 Flagged for Review`);
  console.log(` Bank Accounts: 10 Active`);
  console.log("==========================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
