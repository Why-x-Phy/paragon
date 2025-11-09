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
    <div className="glass rounded-2xl p-10 border border-white/10">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-semibold text-gray-300 uppercase tracking-wider text-xs">Credits</h3>
        <span className={`text-sm font-bold px-3 py-1 rounded-lg ${getStatusColor()} bg-opacity-10`}>
          {getStatusText()}
        </span>
      </div>
      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-extrabold text-white tracking-tight">{credits}</span>
          <span className="text-lg text-gray-400 font-medium">verfügbar</span>
        </div>
        <div className="w-full bg-gray-800/50 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              credits >= 10
                ? "bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30"
                : credits >= 5
                ? "bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/30"
                : "bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/30"
            }`}
            style={{ width: `${Math.min((credits / 20) * 100, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 font-medium">
          1 Analyse = 1 Credit
        </p>
      </div>
    </div>
  );
}

