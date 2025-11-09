"use client";

import { useActiveAccount, useReadContract } from "thirdweb/react";
import { client, PARA_TOKEN_ADDRESS, BASE_CHAIN_ID } from "@/lib/thirdweb";
import { getContract } from "thirdweb/contract";
import { balanceOf } from "thirdweb/extensions/erc20";
import { defineChain } from "thirdweb/chains";

const baseChain = defineChain(BASE_CHAIN_ID);

export default function TokenBalance() {
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
      <div className="glass rounded-xl p-8 border border-white/10">
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-2">Bitte verbinde deine Wallet</p>
          <p className="text-xs text-gray-500">um deine Token-Balance zu sehen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-8 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-medium text-gray-400">Token Balance</h3>
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
          <span className="text-xs font-bold text-white">PARA</span>
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            {isLoading ? "..." : formattedBalance}
          </span>
          <span className="text-sm text-gray-400">PARA</span>
        </div>
        <div className="text-xs text-gray-500">
          ≈ ${usdValue} USD
        </div>
      </div>
    </div>
  );
}

