import React from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

interface StatusBannerProps {
  banner: {
    type: "success" | "error" | "info";
    message: string;
  } | null;
  onDismiss: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({ banner, onDismiss }) => {
  if (!banner) return null;

  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    error: "bg-rose-50 border-rose-200 text-rose-900",
    info: "bg-blue-50 border-blue-200 text-blue-900",
  }[banner.type];

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    error: <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
  }[banner.type];

  return (
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4`}>
      <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${styles}`}>
        <div className="flex items-center space-x-3 text-sm font-medium">
          {icons}
          <span>{banner.message}</span>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

