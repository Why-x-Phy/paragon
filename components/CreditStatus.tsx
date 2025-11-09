"use client";

import { useActiveAccount } from "thirdweb/react";

interface CreditStatusProps {
  credits: number;
}

export default function CreditStatus({ credits }: CreditStatusProps) {
  const account = useActiveAccount();

  if (!account) {
    return (
      <div className="glass rounded-xl p-6 border border-white/10">
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-2">Bitte verbinde deine Wallet</p>
          <p className="text-xs text-gray-500">um deine Credits zu sehen</p>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (credits >= 10) return "text-green-400";
    if (credits >= 5) return "text-yellow-400";
    return "text-red-400";
  };

  const getStatusText = () => {
    if (credits >= 10) return "Ausreichend";
    if (credits >= 5) return "Niedrig";
    return "Kritisch";
  };

  return (
    <div className="glass rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-400">Credits</h3>
        <span className={`text-xs font-semibold ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{credits}</span>
          <span className="text-sm text-gray-400">verfügbar</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              credits >= 10
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : credits >= 5
                ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                : "bg-gradient-to-r from-red-500 to-pink-500"
            }`}
            style={{ width: `${Math.min((credits / 20) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">
          1 Analyse = 1 Credit
        </p>
      </div>
    </div>
  );
}

