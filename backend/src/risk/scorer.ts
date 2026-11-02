import { prisma } from "../lib/prisma";

export interface RiskInput {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  metadata?: Record<string, string>;
}

export interface RiskResult {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  velocitySpike: boolean;
  newDevice: boolean;
  geoMismatch: boolean;
  amountOutlier: boolean;
  signals: string[];
}

const VELOCITY_WINDOW_MINUTES = 7;
const VELOCITY_THRESHOLD = 5;
const OUTLIER_SIGMA_THRESHOLD = 2.5;

export async function assessRisk(input: RiskInput): Promise<RiskResult> {
  const { fromAccountId, amount, metadata } = input;
  const signals: string[] = [];
  let score = 0;

  // ── Signal 1: Velocity spike ──────────────────────────────────────────────
  const velocitySpike = await checkVelocitySpike(fromAccountId);
  if (velocitySpike) {
    score += 35;
    signals.push(
      `${VELOCITY_THRESHOLD}+ transactions in last ${VELOCITY_WINDOW_MINUTES} minutes from this account`
    );
  }

  // ── Signal 2: New device ──────────────────────────────────────────────────
  const deviceId = metadata?.deviceId;
  const newDevice = deviceId ? await checkNewDevice(fromAccountId, deviceId) : false;
  if (newDevice) {
    score += 25;
    signals.push("Transaction from an unrecognized device");
  }

  // ── Signal 3: Geo mismatch ────────────────────────────────────────────────
  const location = metadata?.location;
  const ipLocation = metadata?.ipLocation;
  const geoMismatch = !!(location && ipLocation && location !== ipLocation);
  if (geoMismatch) {
    score += 20;
    signals.push(`Location mismatch: account in ${location}, IP detected from ${ipLocation}`);
  }

  // ── Signal 4: Amount outlier ──────────────────────────────────────────────
  const amountOutlier = await checkAmountOutlier(fromAccountId, amount);
  if (amountOutlier) {
    score += 30;
    signals.push(
      `Transfer amount ₹${amount.toLocaleString()} is significantly above account historical average`
    );
  }

  // ── Signal 5: Large round number ─────────────────────────────────────────
  if (amount >= 50000 && amount % 10000 === 0) {
    score += 10;
    signals.push("Large round-number transaction (structuring risk)");
  }

  score = Math.min(score, 100);

  // Record device if provided
  if (deviceId) {
    await upsertDeviceHistory(fromAccountId, deviceId, metadata);
  }

  return {
    riskScore: score,
    riskLevel: getRiskLevel(score),
    velocitySpike,
    newDevice,
    geoMismatch,
    amountOutlier,
    signals,
  };
}

async function checkVelocitySpike(accountId: string): Promise<boolean> {
  const windowStart = new Date(
    Date.now() - VELOCITY_WINDOW_MINUTES * 60 * 1000
  );
  const count = await prisma.transaction.count({
    where: {
      fromAccountId: accountId,
      createdAt: { gte: windowStart },
    },
  });
  return count >= VELOCITY_THRESHOLD;
}

async function checkNewDevice(accountId: string, deviceId: string): Promise<boolean> {
  const existing = await prisma.deviceHistory.findUnique({
    where: { accountId_deviceId: { accountId, deviceId } },
  });
  return !existing;
}

async function checkAmountOutlier(accountId: string, amount: number): Promise<boolean> {
  const history = await prisma.transaction.findMany({
    where: {
      fromAccountId: accountId,
      status: { in: ["SETTLED", "PROCESSING"] },
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
      },
    },
    select: { amount: true },
  });

  if (history.length < 3) return false;

  const amounts = history.map((t) => t.amount);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((a, b) => a + (b - mean) ** 2, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return false;

  const zScore = Math.abs(amount - mean) / stdDev;
  return zScore > OUTLIER_SIGMA_THRESHOLD;
}

async function upsertDeviceHistory(
  accountId: string,
  deviceId: string,
  metadata?: Record<string, string>
) {
  try {
    await prisma.deviceHistory.upsert({
      where: { accountId_deviceId: { accountId, deviceId } },
      create: {
        accountId,
        deviceId,
        ipAddress: metadata?.ipAddress,
        location: metadata?.location,
      },
      update: {
        seenAt: new Date(),
        ipAddress: metadata?.ipAddress,
      },
    });
  } catch {
    // Ignore concurrency conflicts
  }
}

function getRiskLevel(score: number): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
  if (score < 30) return "LOW";
  if (score < 55) return "MEDIUM";
  if (score < 75) return "HIGH";
  return "CRITICAL";
}
