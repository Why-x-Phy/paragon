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

  const formattedBalance = balance 
    ? (Number(balance) / 1e18).toLocaleString("de-DE", { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
    : "0.00";

  const usdValue = balance 
    ? (Number(balance) / 1e18 * 0.01).toFixed(2)
    : "0.00";

  if (!account) {
    return (
      <div className="glass rounded-3xl p-[calc(1.5rem+5px)] sm:p-[calc(2rem+5px)] h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-body text-gray-300 mb-2 font-medium">Please connect your wallet</p>
          <p className="text-body-sm text-gray-400">to view your credits</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="glass rounded-3xl p-[calc(1.5rem+5px)] sm:p-[calc(2rem+5px)] h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-body text-gray-300">Loading credits...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (credits >= 10) return "text-emerald-400";
    if (credits >= 5) return "text-amber-400";
    return "text-red-400";
  };

  const getStatusBg = () => {
    if (credits >= 10) return "bg-emerald-500/20 border-emerald-500/40";
    if (credits >= 5) return "bg-amber-500/20 border-amber-500/40";
    return "bg-red-500/20 border-red-500/40";
  };

  const getStatusText = () => {
    if (credits >= 10) return "Sufficient";
    if (credits >= 5) return "Low";
    return "Critical";
  };

  return (
    <div className="glass rounded-3xl p-8 sm:p-10 md:p-12 h-full flex flex-col !mt-[5px]">
      <div className="flex items-center mb-6 sm:mb-8 gap-6 !px-[10px]">
        <h3 className="text-label text-gray-400 flex-1 !pl-[10px]">Credits & Balance</h3>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <span className="text-lg font-bold text-cyan-400">PARA</span>
          </div>
          <span className={`text-label font-bold px-5 py-2 rounded-xl ${getStatusColor()} ${getStatusBg()} border-2`}>
            {getStatusText()}
          </span>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center space-y-6">
        {/* Credits Display */}
        <div className="flex items-baseline gap-4 !px-[10px]">
          <span className="text-number text-6xl font-extrabold text-white tracking-tight !pl-[10px]">{credits}</span>
          <span className="text-h4 text-gray-400 font-semibold">Credits</span>
        </div>
        
        {/* Token Balance Info */}
        <div className="bg-gray-900/60 rounded-3xl p-8 sm:p-10 border-2 border-white/10">
          <div className="flex items-center mb-3 gap-6 !px-[10px]">
            <span className="text-label text-gray-400 font-semibold flex-1">Token Balance</span>
            <span className="text-h4 font-bold text-white text-number flex-shrink-0">{formattedBalance} PARA</span>
          </div>
          <div className="flex items-center gap-6 !px-[10px]">
            <span className="text-label text-gray-400 font-semibold flex-1">USD Value</span>
            <span className="text-body-lg font-semibold text-gray-300 flex-shrink-0">≈ ${usdValue}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-1/2 bg-gray-900/80 rounded-full h-3 overflow-hidden shadow-inner border border-white/5 !mx-auto">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              credits >= 10
                ? "bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/50"
                : credits >= 5
                ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/50"
                : "bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/50"
            }`}
            style={{ width: `${Math.min((credits / 20) * 100, 100)}%` }}
          />
        </div>
        <p className="text-body-sm text-gray-400 font-medium text-center !px-[10px]">
          1 Analysis = 1 Credit = 1 PARA Token
        </p>
      </div>
    </div>
  );
}

