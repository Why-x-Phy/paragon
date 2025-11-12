"use client";

import { useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain, useSendTransaction } from "thirdweb/react";
import { useState, useEffect } from "react";
import { showToast } from "@/components/Toast";
import { client, PARA_TOKEN_ADDRESS, BASE_CHAIN_ID } from "@/lib/thirdweb";
import { defineChain } from "thirdweb/chains";
import { getContract } from "thirdweb/contract";
import { prepareContractCall } from "thirdweb";
import { claimTo } from "thirdweb/extensions/erc20";

const baseChain = defineChain(BASE_CHAIN_ID);

const PACKAGES = [
  { tokens: 100, label: "Starter", pricePerToken: 0.0001 },
  { tokens: 5000, label: "Pro", popular: true, bestValue: true, pricePerToken: 0.00009 },
  { tokens: 10000, label: "Enterprise", pricePerToken: 0.00008 },
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
        
        console.log("Claim Conditions Response:", data);
        
        if (data.success && data.claimCondition) {
          console.log("Claim Condition loaded:", data.claimCondition);
          setClaimCondition(data.claimCondition);
        } else {
          console.error("Claim Conditions nicht erfolgreich:", data);
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
      showToast("Please connect your wallet first", "warning");
      return;
    }

    // Check if on Base Chain
    if (activeChain?.id !== BASE_CHAIN_ID) {
      try {
        await switchChain(baseChain);
      } catch (error) {
        showToast("Please switch to Base Chain in your wallet", "warning");
        return;
      }
    }

    setIsPurchasing(true);

    try {
      // Berechne die Anzahl der Tokens (in wei)
      // 1 Token = 1e18 wei
      const tokenAmountWei = BigInt(pkg.tokens) * BigInt(10 ** 18);
      
      console.log("Token Package:", pkg.tokens, "tokens");
      console.log("Token Amount (wei):", tokenAmountWei.toString());

      // Erstelle Contract Instance
      const contract = getContract({
        client,
        chain: baseChain,
        address: PARA_TOKEN_ADDRESS,
      });

      // Lade Claim Conditions, um den Preis zu prüfen
      const claimConditionResponse = await fetch("/api/claim-conditions");
      const claimConditionData = await claimConditionResponse.json();
      
      if (claimConditionData.success && claimConditionData.claimCondition) {
        const pricePerToken = parseFloat(claimConditionData.claimCondition.pricePerToken);
        console.log("Price per token (ETH):", pricePerToken);
        console.log("Total price for", pkg.tokens, "tokens (ETH):", (pricePerToken * pkg.tokens).toFixed(6));
      }
      
      // Calculate the correct ETH value based on Claim Conditions
      if (!claimConditionData.success || !claimConditionData.claimCondition) {
        throw new Error("Could not load claim conditions");
      }
      
      const pricePerToken = parseFloat(claimConditionData.claimCondition.pricePerToken);
      
      // Berechne totalPriceWei mit höherer Genauigkeit
      // Verwende BigInt für die Berechnung, um Rundungsfehler zu vermeiden
      const pricePerTokenWei = BigInt(Math.floor(pricePerToken * 1e18));
      const totalPriceWei = pricePerTokenWei * BigInt(pkg.tokens);
      
      console.log("Price per token (ETH):", pricePerToken);
      console.log("Price per token (wei):", pricePerTokenWei.toString());
      console.log("Token amount:", pkg.tokens);
      console.log("Total price (wei):", totalPriceWei.toString());
      console.log("Total price (ETH):", (Number(totalPriceWei) / 1e18).toFixed(6));
      
      // Check if price is too high
      const totalPriceEth = Number(totalPriceWei) / 1e18;
      if (totalPriceEth > 1000) {
        throw new Error(`Calculated price is extremely high: ${totalPriceEth.toFixed(2)} ETH. Please check the claim conditions in the contract.`);
      }
      
      // Check if price is too low (0 oder negativ)
      if (totalPriceWei === BigInt(0)) {
        throw new Error(`Calculated price is 0. Please check the claim conditions. Price per token: ${pricePerToken} ETH`);
      }
      
      // WICHTIG: Der Contract erwartet den tatsächlichen pricePerToken Wert, nicht 0!
      // Bereite die claim Transaction vor mit prepareContractCall
      // Verwende die claim Funktion direkt mit den korrekten Parametern
      const transaction = prepareContractCall({
        contract,
        method: "function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof, bytes _data) payable",
        params: [
          account.address, // _receiver
          tokenAmountWei, // _quantity (in wei, als BigInt)
          "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // _currency (ETH/Base native - muss dieser spezielle Wert sein!)
          pricePerTokenWei, // _pricePerToken (MUSS der tatsächliche Preis sein, nicht 0!)
          {
            proof: [], // proof: bytes32[] (empty array)
            quantityLimitPerWallet: BigInt(0), // quantityLimitPerWallet: uint256
            pricePerToken: pricePerTokenWei, // pricePerToken: uint256 (MUSS der tatsächliche Preis sein!)
            currency: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // currency: address (ETH native)
          }, // _allowlistProof as object
          "0x", // _data (empty bytes)
        ],
        value: totalPriceWei, // ETH-Wert in wei (als BigInt)
      });
      
      console.log("Transaction prepared:", transaction);

      // Send the transaction - MetaMask will now show a signing request
      sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log("Transaction successful:", result);
          showToast(`Transaction successful! Hash: ${result.transactionHash.substring(0, 10)}...`, "success");
          // Optional: Reload Token Balance
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        },
        onError: (error) => {
          console.error("Transaction error:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          showToast(`Purchase error: ${errorMessage}`, "error");
        },
      });
      
    } catch (error: unknown) {
      console.error("Purchase error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      showToast(`Purchase error: ${errorMessage}`, "error");
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!account) {
    return (
      <div className="glass rounded-3xl p-[calc(1.5rem+5px)] sm:p-[calc(2rem+5px)] border-2 border-white/10">
        <div className="text-center py-6">
          <p className="text-sm text-gray-300 mb-1 font-medium">Please connect your wallet</p>
          <p className="text-xs text-gray-400">to purchase token packages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-8 sm:p-10 md:p-12 border-2 border-white/10 hover:border-white/20 transition-all">
      <div className="mb-6 sm:mb-8 !px-[10px]">
        <h3 className="text-h2 font-bold text-white mb-3 tracking-tight !pl-[10px]">Purchase Credits</h3>
        <p className="text-body-sm text-gray-400 font-medium !pl-[10px]">Choose a package and pay</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 !px-[10px]">
        {PACKAGES.map((pkg, index) => (
          <div
            key={index}
            onClick={() => {
              if (!isPurchasing && !isLoadingPrice && !isSendingTransaction) {
                handlePurchase(pkg);
              }
            }}
            className={`relative premium-card rounded-3xl p-6 sm:p-8 border-2 transition-all cursor-pointer ${
              isPurchasing || isLoadingPrice || isSendingTransaction
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-cyan-500/50 hover:bg-gradient-to-br hover:from-cyan-500/10 hover:to-blue-500/5 hover:scale-[1.02] hover:shadow-xl hover:shadow-cyan-500/20"
            } ${pkg.popular ? "ring-2 ring-cyan-500/50 ring-offset-2 ring-offset-gray-950 border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 to-blue-500/5" : ""} border-white/10 bg-gray-900/40 backdrop-blur-sm`}
          >
            {(pkg.popular || pkg.bestValue) && (
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                {pkg.bestValue && (
                  <span className="bg-gradient-to-r from-emerald-500/30 to-green-500/30 text-emerald-300 text-label font-bold px-6 py-2 rounded-full border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/30 backdrop-blur-sm">
                    💎 Best Value
                  </span>
                )}
                {pkg.popular && (
                  <span className="bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-300 text-label font-bold px-6 py-2 rounded-full border-2 border-amber-500/50 shadow-lg shadow-amber-500/30 backdrop-blur-sm">
                    ⭐ Popular
                  </span>
                )}
              </div>
            )}
            <div className="text-center mb-6 !px-[10px]">
              <div className="flex items-center justify-center gap-2 mb-3">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-number text-4xl font-extrabold text-white tracking-tight">
                  {pkg.tokens.toLocaleString()}
                </div>
              </div>
              <div className="text-body-sm text-gray-400 font-semibold mb-1">PARA Tokens</div>
              <div className="text-label text-cyan-400 font-bold mb-4">
                ≈ {pkg.tokens.toLocaleString()} Analyses
              </div>
              {isLoadingPrice ? (
                <div className="flex items-center justify-center gap-3 py-4">
                  <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-body-sm text-gray-400">Loading price...</span>
                </div>
              ) : claimCondition ? (
                <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border-2 border-cyan-500/30">
                  <div className="text-label text-gray-400 mb-1">Price</div>
                  <div className="text-h3 font-extrabold text-white text-number">
                    {(parseFloat(claimCondition.pricePerToken) * pkg.tokens).toFixed(6)} ETH
                  </div>
                </div>
              ) : (
                <div className="text-body-sm text-gray-500 py-4">Price not available</div>
              )}
            </div>
            {/* Unsichtbarer Platzhalter für konsistente Höhe */}
            <div className="h-12"></div>
            {isPurchasing || isSendingTransaction && (
              <div className="flex items-center justify-center -mt-12">
                <span className="flex items-center justify-center gap-2 text-body-sm text-gray-400">
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}

