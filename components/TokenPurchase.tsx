"use client";

import { useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain, useSendTransaction } from "thirdweb/react";
import { useState, useEffect } from "react";
import { client, PARA_TOKEN_ADDRESS, BASE_CHAIN_ID } from "@/lib/thirdweb";
import { defineChain } from "thirdweb/chains";
import { getContract } from "thirdweb/contract";
import { prepareContractCall } from "thirdweb";
import { claimTo } from "thirdweb/extensions/erc20";

const baseChain = defineChain(BASE_CHAIN_ID);

const PACKAGES = [
  { tokens: 1000, label: "Starter" },
  { tokens: 5000, label: "Pro", popular: true },
  { tokens: 10000, label: "Enterprise" },
];

interface ClaimCondition {
  pricePerToken: string;
  pricePerTokenUsd: string;
  currency: string;
}

export default function TokenPurchase() {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [claimCondition, setClaimCondition] = useState<ClaimCondition | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  // Lade Claim Conditions beim Mount
  useEffect(() => {
    const loadClaimConditions = async () => {
      try {
        const response = await fetch("/api/claim-conditions");
        const data = await response.json();
        
        if (data.success && data.claimCondition) {
          setClaimCondition(data.claimCondition);
        }
      } catch (error) {
        console.error("Fehler beim Laden der Claim Conditions:", error);
      } finally {
        setIsLoadingPrice(false);
      }
    };

    loadClaimConditions();
  }, []);

  const { mutate: sendTransaction, isPending: isSendingTransaction } = useSendTransaction();

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
      const tokenAmount = BigInt(pkg.tokens) * BigInt(10 ** 18);

      // Erstelle Contract Instance
      const contract = getContract({
        client,
        chain: baseChain,
        address: PARA_TOKEN_ADDRESS,
      });

      // Bereite die claim Transaction vor
      // claimTo erwartet die Parameter direkt im Options-Objekt
      const transaction = await claimTo({
        contract,
        to: account.address,
        quantity: tokenAmount.toString(),
      });

      // Sende die Transaction - MetaMask wird jetzt eine Signing-Anfrage zeigen
      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log("Transaction erfolgreich:", result);
          alert(`Transaction erfolgreich! Hash: ${result.transactionHash}`);
          // Optional: Reload Token Balance
          window.location.reload();
        },
        onError: (error) => {
          console.error("Transaction Fehler:", error);
          alert(`Fehler beim Kauf: ${error.message || "Unbekannter Fehler"}`);
        },
      });
      
    } catch (error: any) {
      console.error("Purchase error:", error);
      alert(`Fehler beim Kauf: ${error.message || "Unbekannter Fehler"}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!account) {
    return (
      <div className="glass rounded-3xl p-10 border border-white/10">
        <div className="text-center py-8">
          <p className="text-base text-gray-300 mb-2 font-medium">Bitte verbinde deine Wallet</p>
          <p className="text-sm text-gray-400">um Token-Pakete zu kaufen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-10 border border-white/10 hover:border-white/20 transition-all">
      <div className="mb-10">
        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Token kaufen</h3>
        <p className="text-base text-gray-400 font-medium">Wähle ein Paket und zahle mit Thirdweb Pay</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PACKAGES.map((pkg, index) => (
          <div
            key={index}
            className={`relative premium-card rounded-3xl p-10 border transition-all cursor-pointer ${
              selectedPackage === index
                ? "border-white/40 bg-white/15 shadow-2xl scale-[1.02]"
                : "border-white/10 bg-gray-900/30 hover:border-white/25 hover:bg-white/5"
            } ${pkg.popular ? "ring-2 ring-white/30 ring-offset-2 ring-offset-black" : ""}`}
            onClick={() => setSelectedPackage(index)}
          >
            {pkg.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 text-xs font-bold px-4 py-1.5 rounded-full border border-yellow-500/30 shadow-lg backdrop-blur-sm">
                  ⭐ Beliebt
                </span>
              </div>
            )}
            <div className="text-center mb-6">
              <div className="text-4xl font-extrabold text-white mb-2 tracking-tight">
                {pkg.tokens.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400 font-medium">PARA Tokens</div>
            </div>
            <div className="text-center mb-6">
              {isLoadingPrice ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-sm text-gray-400">Lade Preis...</span>
                </div>
              ) : claimCondition ? (
                <>
                  <div className="text-3xl font-extrabold text-white mb-2">
                    ${(parseFloat(claimCondition.pricePerTokenUsd) * pkg.tokens).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400 font-medium">
                    {(parseFloat(claimCondition.pricePerToken) * pkg.tokens).toFixed(6)} ETH
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {parseFloat(claimCondition.pricePerTokenUsd).toFixed(4)} $ pro Token
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">Preis nicht verfügbar</div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePurchase(pkg);
              }}
              disabled={isPurchasing || isLoadingPrice || isSendingTransaction}
              className={`w-full py-5 rounded-2xl font-bold text-lg transition-all ${
                selectedPackage === index
                  ? "bg-gradient-to-r from-white/20 to-white/10 text-white border-2 border-white/30 hover:from-white/30 hover:to-white/20 shadow-xl hover:shadow-2xl hover:scale-[1.02]"
                  : "bg-gradient-to-r from-gray-800 to-gray-900 text-gray-200 border border-gray-700 hover:from-gray-700 hover:to-gray-800"
              } ${isPurchasing || isLoadingPrice ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isPurchasing || isSendingTransaction ? (
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

