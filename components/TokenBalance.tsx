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
      <div className="glass rounded-3xl p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-body text-gray-300 mb-2 font-medium">Please connect your wallet</p>
          <p className="text-body-sm text-gray-400">to view your token balance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-label text-gray-400">Token Balance</h3>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <span className="text-lg font-bold text-cyan-400">PARA</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <div className="flex items-baseline gap-4">
          <span className="text-number text-6xl font-extrabold text-white tracking-tight">
            {isLoading ? "..." : formattedBalance}
          </span>
          <span className="text-h4 text-gray-400 font-semibold">PARA</span>
        </div>
        <div className="text-body-lg text-gray-400 font-medium">
          ≈ ${usdValue} USD
        </div>
      </div>
    </div>
  );
}

