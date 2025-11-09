"use client";

import { useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain } from "thirdweb/react";
import { useState } from "react";
import { PARA_TOKEN_ADDRESS, BASE_CHAIN_ID } from "@/lib/thirdweb";
import { defineChain } from "thirdweb/chains";

const baseChain = defineChain(BASE_CHAIN_ID);

const PACKAGES = [
  { tokens: 1000, price: 10, label: "Starter" },
  { tokens: 5000, price: 50, label: "Pro", popular: true },
  { tokens: 10000, price: 100, label: "Enterprise" },
];

export default function TokenPurchase() {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async (pkg: typeof PACKAGES[0]) => {
    if (!account) {
      alert("Bitte verbinde zuerst deine Wallet");
      return;
    }

    // Prüfe ob auf Base Chain
    if (activeChain?.id !== BASE_CHAIN_ID) {
      try {
        await switchChain(baseChain);
      } catch (error) {
        alert("Bitte wechsle zu Base Chain in deiner Wallet");
        return;
      }
    }

    setIsPurchasing(true);

    try {
      // Berechne die Anzahl der Tokens (in wei)
      // 1 Token = 1e18 wei
      const tokenAmount = (BigInt(pkg.tokens) * BigInt(10 ** 18)).toString();

      // Verwende Thirdweb API für Contract Write
      // Die API signiert die Transaction automatisch
      const response = await fetch("/api/claim-tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: account.address,
          quantity: tokenAmount,
          contractAddress: PARA_TOKEN_ADDRESS,
          chainId: BASE_CHAIN_ID,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Fehler beim Token-Kauf");
      }

      if (data.transactionHash) {
        alert(`Transaction erfolgreich! Hash: ${data.transactionHash}`);
        // Optional: Reload Token Balance
        window.location.reload();
      } else {
        throw new Error("Keine Transaction Hash erhalten");
      }
      
    } catch (error: any) {
      console.error("Purchase error:", error);
      alert(`Fehler beim Kauf: ${error.message || "Unbekannter Fehler"}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!account) {
    return (
      <div className="glass rounded-xl p-8 border border-white/10">
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-2">Bitte verbinde deine Wallet</p>
          <p className="text-xs text-gray-500">um Token-Pakete zu kaufen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-10 border border-white/10">
      <div className="mb-10">
        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Token kaufen</h3>
        <p className="text-base text-gray-400 font-medium">Wähle ein Paket und zahle mit Thirdweb Pay</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PACKAGES.map((pkg, index) => (
          <div
            key={index}
            className={`relative rounded-2xl p-8 border transition-all cursor-pointer ${
              selectedPackage === index
                ? "border-white/30 bg-white/10"
                : "border-white/10 bg-gray-900/50 hover:border-white/20"
            } ${pkg.popular ? "ring-2 ring-white/20" : ""}`}
            onClick={() => setSelectedPackage(index)}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
                  Beliebt
                </span>
              </div>
            )}
            <div className="text-center mb-4">
              <div className="text-2xl font-bold text-white mb-1">{pkg.tokens.toLocaleString()}</div>
              <div className="text-sm text-gray-400">PARA Tokens</div>
            </div>
            <div className="text-center mb-4">
              <div className="text-xl font-semibold text-white">${pkg.price}</div>
              <div className="text-xs text-gray-500">USD</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePurchase(pkg);
              }}
              disabled={isPurchasing}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                selectedPackage === index
                  ? "bg-white/10 text-white border border-white/20 hover:bg-white/20 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              } ${isPurchasing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isPurchasing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Wird verarbeitet...
                </span>
              ) : (
                "Kaufen"
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-400">
          💡 Zahlungen über Base, BSC, Polygon, Arbitrum und mehr möglich via Universal Bridge
        </p>
      </div>
    </div>
  );
}

