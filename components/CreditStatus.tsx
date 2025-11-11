"use client";

import { useActiveAccount, useReadContract } from "thirdweb/react";
import { client, PARA_TOKEN_ADDRESS, BASE_CHAIN_ID } from "@/lib/thirdweb";
import { getContract } from "thirdweb/contract";
import { balanceOf } from "thirdweb/extensions/erc20";
import { defineChain } from "thirdweb/chains";

const baseChain = defineChain(BASE_CHAIN_ID);

interface CreditStatusProps {
  credits?: number; // Optional, wird jetzt aus Token-Balance berechnet
}

export default function CreditStatus({ credits: creditsProp }: CreditStatusProps) {
  const account = useActiveAccount();
  
  const contract = getContract({
    client,
    chain: baseChain,
    address: PARA_TOKEN_ADDRESS,
  });

  const { data: balance, isLoading } = useReadContract(balanceOf, {
    contract,
    address: account?.address || "0x0000000000000000000000000000000000000000",
  });

  // Berechne Credits basierend auf Token-Balance: 1 Token = 1 Credit
  const credits = balance ? Math.floor(Number(balance) / 1e18) : 0;

  if (!account) {
    return (
      <div className="glass rounded-2xl p-6 border border-white/10 h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-300 mb-1 font-medium">Please connect your wallet</p>
          <p className="text-xs text-gray-400">to view your credits</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 border border-white/10 h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-300">Loading credits...</p>
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
    if (credits >= 10) return "Sufficient";
    if (credits >= 5) return "Low";
    return "Critical";
  };

  return (
    <div className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Credits</h3>
        <span className={`text-xs font-bold px-4 py-1.5 rounded-lg ${getStatusColor()} bg-opacity-10 border border-current border-opacity-20`}>
          {getStatusText()}
        </span>
      </div>
      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-extrabold text-white tracking-tight">{credits}</span>
          <span className="text-base text-gray-400 font-medium">available</span>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Based on {credits} PARA Token{credits !== 1 ? "s" : ""}
        </div>
        <div className="w-full bg-gray-800/50 rounded-full h-2.5 overflow-hidden shadow-inner">
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
          1 Analysis = 1 Credit = 1 PARA Token
        </p>
      </div>
    </div>
  );
}

