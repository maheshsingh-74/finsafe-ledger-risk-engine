import { runReconciliation } from "../services/reconciliation";

export async function startWorkers() {
  console.log("⏰ Scheduling automated reconciliation job (every 30 mins)...");

  // Run once on startup after 3 seconds
  setTimeout(async () => {
    try {
      console.log("[Worker] Running initial reconciliation check...");
      const report = await runReconciliation();
      console.log(
        `[Worker] Initial reconciliation complete: ${
          report.isBalanced ? "✅ BALANCED" : "⚠️ DISCREPANCY FOUND"
        } (Flagged: ${report.flaggedCount})`
      );
    } catch (err) {
      console.error("[Worker] Initial reconciliation error:", err);
    }
  }, 3000);

  // Periodic reconciliation job
  setInterval(async () => {
    try {
      console.log("[Worker] Periodic reconciliation running...");
      const report = await runReconciliation();
      console.log(
        `[Worker] Scheduled reconciliation complete: ${
          report.isBalanced ? "✅ BALANCED" : "⚠️ DISCREPANCY"
        }`
      );
    } catch (err) {
      console.error("[Worker] Scheduled reconciliation error:", err);
    }
  }, 30 * 60 * 1000); // 30 minutes

  console.log("✅ Worker scheduler initialized");
}
