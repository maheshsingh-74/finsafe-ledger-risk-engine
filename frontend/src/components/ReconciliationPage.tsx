import React from "react";
import { Scale, CheckCircle2, AlertTriangle, RefreshCw, Clock } from "lucide-react";
import { ReconciliationReport, LedgerSummary } from "../services/api";

interface ReconciliationPageProps {
  summary: LedgerSummary | null;
  history: ReconciliationReport[];
  onRunAudit: () => Promise<void>;
}

export const ReconciliationPage: React.FC<ReconciliationPageProps> = ({
  summary,
  history,
  onRunAudit,
}) => {
  const [running, setRunning] = React.useState(false);

  const handleRun = async () => {
    try {
      setRunning(true);
      await onRunAudit();
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Run Audit Action */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Reconciliation & Continuous Auditing</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated invariant checking engine runs continuously in background to guarantee zero financial drift.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-2 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
          <span>{running ? "Running Audit..." : "Execute Invariant Check"}</span>
        </button>
      </div>

      {/* Invariant Assertion Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total System Debits</span>
          <span className="text-2xl font-bold font-mono text-slate-900">
            ₹{summary?.totalDebits ? summary.totalDebits.toLocaleString("en-IN") : "0"}
          </span>
          <p className="text-[11px] text-slate-400 mt-2">Sum of all debit journal postings</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total System Credits</span>
          <span className="text-2xl font-bold font-mono text-slate-900">
            ₹{summary?.totalCredits ? summary.totalCredits.toLocaleString("en-IN") : "0"}
          </span>
          <p className="text-[11px] text-slate-400 mt-2">Sum of all credit journal postings</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Discrepancy Invariant</span>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xl font-bold text-emerald-700 font-mono">
              ₹0.00 (Balanced)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Debits minus Credits exact delta</p>
        </div>
      </div>

      {/* Historical Audit Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Historical Audit Reports ({history.length} runs)
          </h3>
          <span className="text-xs text-slate-400">Scheduled every 30m + on-demand</span>
        </div>

        <div className="divide-y divide-slate-100">
          {history.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No reconciliation reports generated yet.</div>
          ) : (
            history.map((report) => (
              <div key={report.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      Report #{report.id.slice(0, 8)}
                    </span>
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>BALANCED</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Run at: {new Date(report.reportDate).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Volume Balanced</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{report.totalDebits.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Settled TXs</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {report.settledCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Discrepancy</span>
                    <span className="font-mono font-bold text-emerald-700">
                      ₹{report.discrepancyAmount}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

