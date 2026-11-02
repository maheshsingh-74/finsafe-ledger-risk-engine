import React, { useState } from "react";
import { Send, Zap, Lock, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import { Account } from "../services/api";

interface TransferPageProps {
  accounts: Account[];
  onExecuteTransfer: (params: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    description: string;
    idempotencyKey: string;
    injectAnomaly: boolean;
    isRetry?: boolean;
  }) => Promise<void>;
}

export const TransferPage: React.FC<TransferPageProps> = ({
  accounts,
  onExecuteTransfer,
}) => {
  const [fromAcc, setFromAcc] = useState<string>(accounts[0]?.id || "");
  const [toAcc, setToAcc] = useState<string>(accounts[1]?.id || "");
  const [amount, setAmount] = useState<number>(10000);
  const [description, setDescription] = useState<string>("Corporate supplier payout");
  const [idempotencyKey, setIdempotencyKey] = useState<string>(`idemp_${Date.now()}`);
  const [injectAnomaly, setInjectAnomaly] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  React.useEffect(() => {
    if (accounts.length >= 2 && !fromAcc) {
      setFromAcc(accounts[0].id);
      setToAcc(accounts[1].id);
    }
  }, [accounts]);

  const selectedFrom = accounts.find((a) => a.id === fromAcc);

  const handleSubmit = async (isRetry = false) => {
    if (!fromAcc || !toAcc) {
      alert("Please select both debit and credit accounts.");
      return;
    }
    if (fromAcc === toAcc) {
      alert("Sender and recipient accounts cannot be the same.");
      return;
    }
    if (amount <= 0) {
      alert("Amount must be greater than zero.");
      return;
    }

    try {
      setSubmitting(true);
      await onExecuteTransfer({
        fromAccountId: fromAcc,
        toAccountId: toAcc,
        amount,
        description,
        idempotencyKey,
        injectAnomaly,
        isRetry,
      });
      if (!isRetry) {
        setIdempotencyKey(`idemp_${Date.now()}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Interbank Fund Transfer Portal</h2>
            <p className="text-xs text-slate-500">
              Double-entry atomic movement with distributed idempotency locks & automated risk assessment
            </p>
          </div>
        </div>
      </div>

      {/* Main Transfer Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* From Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Source Account (Debit)
            </label>
            <select
              value={fromAcc}
              onChange={(e) => setFromAcc(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — ₹{acc.balance.toLocaleString("en-IN")} ({acc.accountNo})
                </option>
              ))}
            </select>
            {selectedFrom && (
              <div className="mt-1.5 px-3 py-1.5 bg-slate-50 rounded-md border border-slate-200 flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Available Balance:</span>
                <span className="font-mono font-bold text-emerald-700">
                  ₹{selectedFrom.balance.toLocaleString("en-IN")}
                </span>
              </div>
            )}
          </div>

          {/* To Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Destination Account (Credit)
            </label>
            <select
              value={toAcc}
              onChange={(e) => setToAcc(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.accountNo})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Transfer Amount (INR)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-2.5 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
            />
          </div>
          <div className="flex gap-2 mt-2">
            {[2500, 10000, 50000, 200000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className="px-2.5 py-1 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-mono rounded-md"
              >
                ₹{preset.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Payment Purpose / Reference Notes
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Vendor settlement, Inter-company transfer"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
          />
        </div>

        {/* Idempotency Protection Box */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Idempotency Key (Double-Debit Protection)</span>
            </span>
            <button
              type="button"
              onClick={() => setIdempotencyKey(`idemp_${Date.now()}`)}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
            >
              Generate New
            </button>
          </div>
          <input
            type="text"
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md text-slate-800"
          />
          <p className="text-[11px] text-slate-500">
            Network drop protection: Submitting this form multiple times with this exact key guarantees zero duplicate debits.
          </p>
        </div>

        {/* Simulated Fraud Injection Switch */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Simulate Suspicious Activity</span>
            </div>
            <p className="text-[11px] text-amber-800">
              Injects unknown device hardware fingerprint + IP geo mismatch to trigger the AI risk engine.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={injectAnomaly}
              onChange={(e) => setInjectAnomaly(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? "Authorizing Transfer..." : "Execute & Settle Transfer"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition"
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Test Replay / Retry</span>
          </button>
        </div>
      </div>
    </div>
  );
};

