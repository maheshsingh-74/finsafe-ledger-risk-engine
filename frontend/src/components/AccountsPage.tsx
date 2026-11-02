import React from "react";
import { Users, PlusCircle, Building2, CreditCard, ShieldCheck } from "lucide-react";
import { Account } from "../services/api";

interface AccountsPageProps {
  accounts: Account[];
  onOpenNewAccountModal: () => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts,
  onOpenNewAccountModal,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Customer Bank Accounts</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Core banking account directory managing retail savings, corporate current accounts, and merchant settlement pools.
          </p>
        </div>

        <button
          onClick={onOpenNewAccountModal}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center space-x-2 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Open New Account</span>
        </button>
      </div>

      {/* Grid of Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const typeBadgeColor = {
            SAVINGS: "bg-blue-50 text-blue-700 border-blue-200",
            CURRENT: "bg-purple-50 text-purple-700 border-purple-200",
            MERCHANT: "bg-emerald-50 text-emerald-700 border-emerald-200",
          }[acc.type] || "bg-slate-50 text-slate-700 border-slate-200";

          return (
            <div
              key={acc.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900">{acc.name}</h3>
                    <p className="text-xs text-slate-400">{acc.email}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${typeBadgeColor}`}
                  >
                    {acc.type}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Account No</span>
                  <span className="font-mono font-semibold text-slate-700 tracking-wider">
                    {acc.accountNo}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Available Balance</span>
                  <span className="text-lg font-bold font-mono text-slate-900">
                    ₹{acc.balance.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-[10px] font-medium text-emerald-600 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  Verified Active
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

