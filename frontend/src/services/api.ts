const API_BASE = "http://localhost:3001/api";

export interface Transaction {
  id: string;
  idempotencyKey: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  description?: string;
  status: "INITIATED" | "PROCESSING" | "SETTLED" | "FAILED" | "REVIEW" | "REVERSED";
  metadata?: Record<string, string>;
  createdAt: string;
  fromAccount?: { id: string; name: string; accountNo: string };
  toAccount?: { id: string; name: string; accountNo: string };
  riskAssessment?: {
    riskScore: number;
    riskLevel: string;
    flaggedSignals: string[];
    aiExplanation?: string;
  };
}

export interface LedgerSummary {
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  entryCount: number;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  entryType: "DEBIT" | "CREDIT";
  amount: number;
  currency: string;
  balanceAfter: number;
  description?: string;
  createdAt: string;
  account?: { name: string; accountNo: string };
  transaction?: { status: string; description?: string };
}

export interface RiskItem {
  id: string;
  transactionId: string;
  riskScore: number;
  riskLevel: string;
  velocitySpike: boolean;
  newDevice: boolean;
  geoMismatch: boolean;
  amountOutlier: boolean;
  flaggedSignals: string[];
  aiExplanation?: string;
  createdAt: string;
  transaction: Transaction;
}

export interface Account {
  id: string;
  name: string;
  email: string;
  accountNo: string;
  type: string;
  currency: string;
  balance: number;
  createdAt: string;
}

export interface ReconciliationReport {
  id: string;
  reportDate: string;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  discrepancyAmount: number;
  flaggedCount: number;
  settledCount: number;
  pendingCount: number;
  reviewCount: number;
  createdAt: string;
  reportData?: any;
}

export interface AuditLogItem {
  id: string;
  transactionId?: string;
  action: string;
  actorId?: string;
  actorType: string;
  before?: any;
  after?: any;
  createdAt: string;
}

// ── API Methods ─────────────────────────────────────────────────────────────

export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch(`${API_BASE}/transfers?limit=50`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  const data = await res.json();
  return data.data;
}

export async function fetchLedgerSummary(): Promise<LedgerSummary> {
  const res = await fetch(`${API_BASE}/ledger/summary`);
  if (!res.ok) throw new Error("Failed to fetch ledger summary");
  const data = await res.json();
  return data.data;
}

export async function fetchLedgerEntries(): Promise<LedgerEntry[]> {
  const res = await fetch(`${API_BASE}/ledger/entries?limit=50`);
  if (!res.ok) throw new Error("Failed to fetch ledger entries");
  const data = await res.json();
  return data.data;
}

export async function fetchRiskQueue(): Promise<{ data: RiskItem[]; meta: { total: number } }> {
  const res = await fetch(`${API_BASE}/risk/queue?limit=50`);
  if (!res.ok) throw new Error("Failed to fetch risk queue");
  return res.json();
}

export async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch(`${API_BASE}/accounts`);
  if (!res.ok) throw new Error("Failed to fetch accounts");
  const data = await res.json();
  return data.data;
}

export async function createAccount(data: { name: string; email: string; type: string; initialBalance: number }) {
  const res = await fetch(`${API_BASE}/accounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create account");
  return res.json();
}

export async function createTransfer(input: {
  idempotencyKey: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  metadata?: Record<string, string>;
}) {
  const res = await fetch(`${API_BASE}/transfers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Transfer failed");
  }
  return res.json();
}

export async function approveReview(transactionId: string, notes?: string) {
  const res = await fetch(`${API_BASE}/risk/${transactionId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewedBy: "Compliance Officer", notes }),
  });
  return res.json();
}

export async function rejectReview(transactionId: string, notes?: string) {
  const res = await fetch(`${API_BASE}/risk/${transactionId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewedBy: "Compliance Officer", notes }),
  });
  return res.json();
}

export async function runReconciliation() {
  const res = await fetch(`${API_BASE}/reconciliation/run`, {
    method: "POST",
  });
  return res.json();
}

export async function fetchReconciliationHistory(): Promise<ReconciliationReport[]> {
  const res = await fetch(`${API_BASE}/reconciliation/history`);
  if (!res.ok) throw new Error("Failed to fetch reconciliation history");
  const data = await res.json();
  return data.data;
}

export async function fetchAuditLogs(): Promise<AuditLogItem[]> {
  const res = await fetch(`${API_BASE}/audit?limit=50`);
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  const data = await res.json();
  return data.data;
}
