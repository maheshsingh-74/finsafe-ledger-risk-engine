import React from "react";
import { BookOpen, CheckCircle2, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { LedgerEntry, LedgerSummary } from "../services/api";

interface LedgerPageProps {
  summary: LedgerSummary | null;
  entries: LedgerEntry[];
}

export const LedgerPage: React.FC<LedgerPageProps> = ({ summary, entries }) => {
  return (
    <div className="space-y-6">
      {/* Header & Balance Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Double-Entry General Ledger</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable T-account journal: every transaction atomicity guarantees Σ Debits ≡ Σ Credits.
          </p>
        </div>

        {summary && (
          <div className="flex items-center space-x-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Debits</span>
              <span className="font-mono text-xs font-bold text-slate-900">
                ₹{summary.totalDebits.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-slate-300">|</div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Total Credits</span>
              <span className="font-mono text-xs font-bold text-slate-900">
                ₹{summary.totalCredits.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-slate-300">|</div>
            <div className="flex items-center space-x-1 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Balanced</span>
            </div>
          </div>
        )}
      </div>

      {/* Ledger Journal Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Journal Entries ({entries.length} recent postings)
          </h3>
          <span className="text-xs text-slate-400">Chronological order</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">ENTRY ID</th>
                <th className="py-3 px-4">TRANSACTION</th>
                <th className="py-3 px-4">ACCOUNT</th>
                <th className="py-3 px-4">ENTRY TYPE</th>
                <th className="py-3 px-4">POSTING AMOUNT</th>
                <th className="py-3 px-4">BALANCE AFTER</th>
                <th className="py-3 px-4 text-right">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {entries.map((entry) => {
                const isDebit = entry.entryType === "DEBIT";
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-400">{entry.id.slice(0, 8)}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                      #{entry.transactionId.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {entry.account?.name || "Account"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {entry.account?.accountNo || entry.accountId.slice(0, 8)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isDebit
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {isDebit ? (
                          <ArrowDownLeft className="w-3 h-3 text-rose-600" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                        )}
                        <span>{entry.entryType}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ₹{entry.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      ₹{entry.balanceAfter.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {new Date(entry.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

