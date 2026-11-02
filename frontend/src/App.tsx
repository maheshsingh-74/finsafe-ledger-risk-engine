import React, { useEffect, useState } from "react";
import {
  fetchTransactions,
  fetchLedgerSummary,
  fetchLedgerEntries,
  fetchRiskQueue,
  fetchAccounts,
  createAccount,
  createTransfer,
  approveReview,
  rejectReview,
  runReconciliation,
  fetchReconciliationHistory,
  fetchAuditLogs,
  Transaction,
  LedgerSummary,
  LedgerEntry,
  RiskItem,
  Account,
  ReconciliationReport,
  AuditLogItem,
} from "./services/api";

import { Navbar, TabType } from "./components/Navbar";
import { StatusBanner } from "./components/StatusBanner";
import { Dashboard } from "./components/Dashboard";
import { TransferPage } from "./components/TransferPage";
import { RiskQueue } from "./components/RiskQueue";
import { LedgerPage } from "./components/LedgerPage";
import { ReconciliationPage } from "./components/ReconciliationPage";
import { AccountsPage } from "./components/AccountsPage";
import { CreateAccountModal } from "./components/CreateAccountModal";

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Core Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [riskQueue, setRiskQueue] = useState<RiskItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [txs, sum, lEntries, rQueue, accs, recHistory, aLogs] =
        await Promise.all([
          fetchTransactions().catch(() => []),
          fetchLedgerSummary().catch(() => null),
          fetchLedgerEntries().catch(() => []),
          fetchRiskQueue().catch(() => ({ data: [], meta: { total: 0 } })),
          fetchAccounts().catch(() => []),
          fetchReconciliationHistory().catch(() => []),
          fetchAuditLogs().catch(() => []),
        ]);

      setTransactions(txs);
      setSummary(sum);
      setLedgerEntries(lEntries);
      setRiskQueue(rQueue.data);
      setAccounts(accs);
      setReconciliations(recHistory);
      setAuditLogs(aLogs);
    } catch (err: any) {
      console.error(err);
      setBanner({
        type: "error",
        message: "Failed to connect to backend on port 3001. Ensure backend service is running.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers
  const handleExecuteTransfer = async ({
    fromAccountId,
    toAccountId,
    amount,
    description,
    idempotencyKey,
    injectAnomaly,
    isRetry = false,
  }: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description: string;
    idempotencyKey: string;
    injectAnomaly: boolean;
    isRetry?: boolean;
  }) => {
    try {
      const metadata = injectAnomaly
        ? {
            deviceId: `dev_anom_${Date.now()}`,
            location: "Mumbai Branch",
            ipLocation: "Frankfurt, DE",
          }
        : {
            deviceId: "dev_terminal_icici_01",
            location: "Mumbai Branch",
            ipLocation: "Mumbai Branch",
          };

      const res = await createTransfer({
        idempotencyKey,
        fromAccountId,
        toAccountId,
        amount,
        description,
        metadata,
      });

      if (res.data?.fromCache) {
        setBanner({
          type: "info",
          message: `🎯 IDEMPOTENCY HIT: Replay with key "${idempotencyKey}" returned cached outcome with 0 duplicate debits.`,
        });
      } else if (res.data?.status === "REVIEW") {
        setBanner({
          type: "error",
          message: `⚠️ TRANSACTION HELD: Risk score ${res.data.riskScore}/100. Routed to AI Risk Queue for compliance officer review.`,
        });
      } else {
        setBanner({
          type: "success",
          message: `✅ Transfer of ₹${amount.toLocaleString("en-IN")} successfully settled into double-entry ledger.`,
        });
      }

      await loadAllData();
    } catch (err: any) {
      setBanner({ type: "error", message: `Transfer failed: ${err.message}` });
    }
  };

  const handleQuickTransfer = async (from: string, to: string, amount: number) => {
    await handleExecuteTransfer({
      fromAccountId: from,
      toAccountId: to,
      amount,
      description: "Quick portal transfer",
      idempotencyKey: `idemp_${Date.now()}`,
      injectAnomaly: false,
    });
  };

  const handleApproveTx = async (txId: string) => {
    try {
      await approveReview(txId, "Compliance cleared after manual review");
      setBanner({
        type: "success",
        message: `TX #${txId.slice(0, 8)} approved and settled to ledger.`,
      });
      await loadAllData();
    } catch (err: any) {
      setBanner({ type: "error", message: err.message });
    }
  };

  const handleRejectTx = async (txId: string) => {
    try {
      await rejectReview(txId, "Fraud flag confirmed - reversed funds");
      setBanner({
        type: "info",
        message: `TX #${txId.slice(0, 8)} rejected. Debit reversed to sender account.`,
      });
      await loadAllData();
    } catch (err: any) {
      setBanner({ type: "error", message: err.message });
    }
  };

  const handleRunReconciliation = async () => {
    try {
      const res = await runReconciliation();
      setBanner({
        type: res.data?.isBalanced ? "success" : "error",
        message: `📊 System Audit Completed: Ledger is ${
          res.data?.isBalanced
            ? "100% BALANCED (Debits = Credits)"
            : "DISCREPANCY DETECTED"
        }`,
      });
      await loadAllData();
    } catch (err: any) {
      setBanner({ type: "error", message: err.message });
    }
  };

  const handleCreateAccount = async (data: {
    name: string;
    email: string;
    type: string;
    initialBalance: number;
  }) => {
    try {
      await createAccount(data);
      setBanner({
        type: "success",
        message: `Account for ${data.name} opened successfully.`,
      });
      await loadAllData();
    } catch (err: any) {
      setBanner({ type: "error", message: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased pb-16">
      {/* Top Professional Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        riskCount={riskQueue.length}
        loading={loading}
        onRefresh={loadAllData}
        onOpenNewAccountModal={() => setIsAccountModalOpen(true)}
      />

      {/* Global Status Notification */}
      <StatusBanner banner={banner} onDismiss={() => setBanner(null)} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab === "overview" && (
          <Dashboard
            summary={summary}
            accounts={accounts}
            riskQueue={riskQueue}
            transactions={transactions}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onExecuteQuickTransfer={handleQuickTransfer}
          />
        )}

        {activeTab === "transfers" && (
          <TransferPage
            accounts={accounts}
            onExecuteTransfer={handleExecuteTransfer}
          />
        )}

        {activeTab === "risk" && (
          <RiskQueue
            riskQueue={riskQueue}
            onApprove={handleApproveTx}
            onReject={handleRejectTx}
          />
        )}

        {activeTab === "ledger" && (
          <LedgerPage summary={summary} entries={ledgerEntries} />
        )}

        {activeTab === "reconciliation" && (
          <ReconciliationPage
            summary={summary}
            history={reconciliations}
            onRunAudit={handleRunReconciliation}
          />
        )}

        {activeTab === "accounts" && (
          <AccountsPage
            accounts={accounts}
            onOpenNewAccountModal={() => setIsAccountModalOpen(true)}
          />
        )}
      </main>

      {/* Account Creation Modal */}
      <CreateAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSubmit={handleCreateAccount}
      />
    </div>
  );
}
