import React from "react";
import {
  Building2,
  RefreshCw,
  PlusCircle,
  ShieldAlert,
  LayoutDashboard,
  Send,
  BookOpen,
  Scale,
  Users,
} from "lucide-react";

export type TabType =
  | "overview"
  | "transfers"
  | "risk"
  | "ledger"
  | "reconciliation"
  | "accounts";

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  riskCount: number;
  loading: boolean;
  onRefresh: () => void;
  onOpenNewAccountModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  riskCount,
  loading,
  onRefresh,
  onOpenNewAccountModal,
}) => {
  const tabs = [
    { id: "overview", label: "Dashboard", icon: LayoutDashboard },
    { id: "transfers", label: "Fund Transfer", icon: Send },
    {
      id: "risk",
      label: "AI Risk Engine",
      icon: ShieldAlert,
      badge: riskCount > 0 ? riskCount : null,
    },
    { id: "ledger", label: "Double-Entry Ledger", icon: BookOpen },
    { id: "reconciliation", label: "Reconciliation", icon: Scale },
    { id: "accounts", label: "Accounts", icon: Users },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Header line: Logo, System Tag, Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">FinSafe</span>
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  ICICI Core Banking Portal
                </span>
              </div>
              <p className="text-xs text-slate-500">Deputy Manager II · FinTech Infrastructure</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span>Refresh Data</span>
            </button>

            <button
              onClick={onOpenNewAccountModal}
              className="inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Account</span>
            </button>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center space-x-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                DM
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-800">ICICI Officer</div>
                <div className="text-[10px] text-emerald-600 font-medium">● Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-4 border-t border-slate-100 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center space-x-2 py-3 px-3 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                    tab.id === "risk"
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};

