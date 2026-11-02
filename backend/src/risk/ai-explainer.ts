import { prisma } from "../lib/prisma";
import { env } from "../lib/env";
import type { RiskResult } from "./scorer";

let genAI: any = null;

async function getGenAI() {
  if (!genAI && env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }
  return genAI;
}

export async function explainRiskWithAI(
  transactionId: string,
  risk: RiskResult
): Promise<string | null> {
  if (!risk.signals.length) return null;

  let explanation: string;
  const ai = await getGenAI();

  if (ai) {
    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = buildPrompt(transactionId, risk);
      const result = await model.generateContent(prompt);
      explanation = result.response.text().trim();
    } catch (err) {
      console.warn("Gemini API call failed, using fallback explanation:", err);
      explanation = buildFallbackExplanation(risk);
    }
  } else {
    explanation = buildFallbackExplanation(risk);
  }

  await prisma.riskAssessment.update({
    where: { transactionId },
    data: { aiExplanation: explanation },
  });

  return explanation;
}

function buildPrompt(transactionId: string, risk: RiskResult): string {
  return `You are a bank fraud analyst at a major Indian bank. Analyze this transaction and write a concise 2-sentence risk summary for the compliance team.

Transaction ID: ${transactionId.slice(0, 8).toUpperCase()}
Risk Score: ${risk.riskScore}/100 (${risk.riskLevel})
Flagged Signals:
${risk.signals.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Write a professional 2-sentence explanation suitable for a bank's risk dashboard.
Start with "This transaction was flagged because...".
Do NOT use markdown formatting. Be specific about the signals.`;
}

function buildFallbackExplanation(risk: RiskResult): string {
  if (!risk.signals.length) {
    return "Transaction passed all risk checks successfully.";
  }

  const primary = risk.signals[0];
  const additional =
    risk.signals.length > 1
      ? ` Additionally, ${risk.signals.slice(1).join("; ").toLowerCase()}.`
      : "";

  return `This transaction was flagged because ${primary.toLowerCase()}.${additional} Manual review is recommended before processing.`;
}

export async function approveReview(
  transactionId: string,
  reviewedBy: string,
  notes?: string
) {
  const assessment = await prisma.riskAssessment.findUniqueOrThrow({
    where: { transactionId },
  });

  await prisma.$transaction(async (tx) => {
    await tx.riskAssessment.update({
      where: { transactionId },
      data: { reviewedBy, reviewedAt: new Date(), reviewNotes: notes },
    });

    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: "SETTLED" },
    });

    await tx.auditLog.create({
      data: {
        transactionId,
        action: "RISK_REVIEW_APPROVED",
        actorId: reviewedBy,
        actorType: "HUMAN",
        before: JSON.stringify({ status: "REVIEW", riskScore: assessment.riskScore }),
        after: JSON.stringify({ status: "SETTLED", reviewedBy }),
        metadata: JSON.stringify({ notes: notes ?? "" }),
      },
    });
  });
}

export async function rejectReview(
  transactionId: string,
  reviewedBy: string,
  notes?: string
) {
  await prisma.$transaction(async (tx) => {
    await tx.riskAssessment.update({
      where: { transactionId },
      data: { reviewedBy, reviewedAt: new Date(), reviewNotes: notes },
    });

    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: "FAILED" },
    });

    // Reverse ledger: return funds to sender
    const txn = await tx.transaction.findUniqueOrThrow({
      where: { id: transactionId },
      include: { fromAccount: true, toAccount: true },
    });

    const fromNewBalance = txn.fromAccount.balance + txn.amount;
    const toNewBalance = txn.toAccount.balance - txn.amount;

    await tx.account.update({
      where: { id: txn.fromAccountId },
      data: { balance: fromNewBalance },
    });

    await tx.account.update({
      where: { id: txn.toAccountId },
      data: { balance: toNewBalance },
    });

    await tx.auditLog.create({
      data: {
        transactionId,
        action: "RISK_REVIEW_REJECTED",
        actorId: reviewedBy,
        actorType: "HUMAN",
        after: JSON.stringify({ status: "FAILED", reviewedBy }),
        metadata: JSON.stringify({ notes: notes ?? "" }),
      },
    });
  });
}
