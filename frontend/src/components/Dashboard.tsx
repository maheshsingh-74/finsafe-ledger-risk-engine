import React from "react";
import {
  Wallet,
  Users,
  ShieldAlert,
  Scale,
  Send,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building,
} from "lucide-react";
import { Transaction, LedgerSummary, Account, RiskItem } from "../services/api";

interface DashboardProps {
  summary: LedgerSummary | null;
  accounts: Account[];
  riskQueue: RiskItem[];
  transactions: Transaction[];
  onNavigateTab: (tab: any) => void;
  onExecuteQuickTransfer: (from: string, to: string, amount: number) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  accounts,
  riskQueue,
  transactions,
  onNavigateTab,
  onExecuteQuickTransfer,
}) => {
  const [quickFrom, setQuickFrom] = React.useState(accounts[0]?.id || "");
  const [quickTo, setQuickTo] = React.useState(accounts[1]?.id || "");
  const [quickAmount, setQuickAmount] = React.useState(5000);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (accounts.length >= 2 && !quickFrom) {
      setQuickFrom(accounts[0].id);
      setQuickTo(accounts[1].id);
    }
  }, [accounts]);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFrom || !quickTo || quickFrom === quickTo) {
      alert("Please select distinct source and target accounts");
      return;
    }
    try {
      setSubmitting(true);
      await onExecuteQuickTransfer(quickFrom, quickTo, quickAmount);
    } finally {
      setSubmitting(false);
    }
  };

  const highSeverityCount = riskQueue.filter((r) => r.riskScore >= 75).length;

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Settled Volume */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-blue-600">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Settled Volume</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              ₹{summary?.totalDebits ? summary.totalDebits.toLocaleString("en-IN") : "0"}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mr-1" />
            Double-entry balanced
          </div>
        </div>

        {/* Customer Accounts */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Customer Accounts</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
              {accounts.length}
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Savings, Corporate & Merchant
          </div>
        </div>

        {/* Flagged AI Queue */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>AI Risk Queue</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-amber-600 tracking-tight">
              {riskQueue.length}
            </span>
            <span className="text-xs text-slate-500 font-medium">pending review</span>
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            {highSeverityCount} Critical severity alerts
          </div>
        </div>

        {/* Ledger Invariant */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Ledger Integrity</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-lg font-bold text-emerald-700 tracking-tight flex items-center space-x-1.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{summary?.isBalanced ? "100% IN-BALANCE" : "AUDIT DISCREPANCY"}</span>
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Debits = Credits (Δ = ₹0.00)
          </div>
        </div>
      </div>

      {/* Main 2-column section: Recent Transactions (Left) + Quick Transfer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Transactions Table */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
              <p className="text-xs text-slate-500">Real-time ledger journal events and risk assessments</p>
            </div>
            <button
              onClick={() => onNavigateTab("ledger")}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>Full Journal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">TX ID</th>
                  <th className="py-3 px-4">PARTICIPANTS</th>
                  <th className="py-3 px-4">AMOUNT</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">TIMESTAMP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {transactions.slice(0, 7).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-500">#{tx.id.slice(0, 8)}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {tx.fromAccount?.name || "Account"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        → {tx.toAccount?.name || "Account"}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ₹{tx.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === "SETTLED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : tx.status === "REVIEW"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-normal">
                      {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick Transfer Widget */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Quick Fund Transfer</h3>
                <p className="text-xs text-slate-500">Double-entry atomic ledger</p>
              </div>
            </div>

            <form onSubmit={handleQuickSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Source Account
                </label>
                <select
                  value={quickFrom}
                  onChange={(e) => setQuickFrom(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (₹{acc.balance.toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Target Account
                </label>
                <select
                  value={quickTo}
                  onChange={(e) => setQuickTo(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.accountNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Amount (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="1"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div className="flex gap-1 mt-2">
                  {[2000, 5000, 15000, 50000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQuickAmount(preset)}
                      className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono rounded"
                    >
                      ₹{preset.toLocaleString("en-IN")}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? "Processing..." : "Transfer Funds"}</span>
              </button>
            </form>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Protected by Idempotency Key</span>
            <span className="text-emerald-600 font-medium">● Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

