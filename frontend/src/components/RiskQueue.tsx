import React from "react";
import { ShieldAlert, CheckCircle2, AlertOctagon, Bot, Check, X, Info } from "lucide-react";
import { RiskItem } from "../services/api";

interface RiskQueueProps {
  riskQueue: RiskItem[];
  onApprove: (txId: string) => Promise<void>;
  onReject: (txId: string) => Promise<void>;
}

export const RiskQueue: React.FC<RiskQueueProps> = ({
  riskQueue,
  onApprove,
  onReject,
}) => {
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const handleApprove = async (txId: string) => {
    try {
      setProcessingId(txId);
      await onApprove(txId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (txId: string) => {
    try {
      setProcessingId(txId);
      await onReject(txId);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">AI Fraud Risk & Compliance Queue</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time inference pipeline scoring velocity spikes, unknown device IDs, and geographic anomalies.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800">
            {riskQueue.length} Pending Compliance Reviews
          </div>
        </div>
      </div>

      {/* Main List */}
      {riskQueue.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Risk Queue Is Clear</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            All recent transactions are low risk. Suspicious transactions scoring ≥70 will appear here for manual override.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {riskQueue.map((item) => {
            const isProcessing = processingId === item.transactionId;
            const isCritical = item.riskLevel === "CRITICAL" || item.riskScore >= 75;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      TX #{item.transactionId.slice(0, 8)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isCritical
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {item.riskLevel} SEVERITY
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Risk Score</div>
                      <div
                        className={`text-lg font-bold font-mono ${
                          isCritical ? "text-rose-600" : "text-amber-600"
                        }`}
                      >
                        {item.riskScore} / 100
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details row: Sender, Amount, Receiver */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sender</span>
                    <span className="font-semibold text-slate-800">
                      {item.transaction?.fromAccount?.name || "Sender Account"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Recipient</span>
                    <span className="font-semibold text-slate-800">
                      {item.transaction?.toAccount?.name || "Recipient Account"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Transfer Amount</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ₹{item.transaction?.amount ? item.transaction.amount.toLocaleString("en-IN") : "0"}
                    </span>
                  </div>
                </div>

                {/* Flagged Signals */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700">Triggered Fraud Indicators:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.flaggedSignals.map((signal, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 flex items-center space-x-1"
                      >
                        <span>•</span>
                        <span>{signal}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Explanation Box */}
                {item.aiExplanation && (
                  <div className="bg-blue-50/60 border border-blue-200/80 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 text-blue-900 font-semibold">
                      <Bot className="w-3.5 h-3.5 text-blue-600" />
                      <span>Gemini AI Risk Assessment Rationale</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px]">
                      {item.aiExplanation}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => handleReject(item.transactionId)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject & Reverse Debit</span>
                  </button>

                  <button
                    onClick={() => handleApprove(item.transactionId)}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-1.5 transition disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Settle Funds</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

