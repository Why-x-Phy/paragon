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
      alert("Please connect your wallet first");
      return;
    }

    // Check if on Base Chain
    if (activeChain?.id !== BASE_CHAIN_ID) {
      try {
        await switchChain(baseChain);
      } catch (error) {
        alert("Please switch to Base Chain in your wallet");
        return;
      }
    }

    setIsPurchasing(true);

    try {
      // Berechne die Anzahl der Tokens (in wei)
      // 1 Token = 1e18 wei
      // Wichtig: pkg.tokens ist bereits die Anzahl der Tokens (z.B. 1000)
      // Wir müssen das in wei umwandeln: 1000 * 10^18 = 1000000000000000000000
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
      const totalPriceWei = BigInt(Math.floor(pricePerToken * pkg.tokens * 1e18));
      
      console.log("Price per token (ETH):", pricePerToken);
      console.log("Total price (wei):", totalPriceWei.toString());
      console.log("Total price (ETH):", (Number(totalPriceWei) / 1e18).toFixed(6));
      
      // Check if price is too high
      const totalPriceEth = Number(totalPriceWei) / 1e18;
      if (totalPriceEth > 1000) {
        throw new Error(`Calculated price is extremely high: ${totalPriceEth.toFixed(2)} ETH. Please check the claim conditions in the contract.`);
      }
      
      // Bereite die claim Transaction vor mit prepareContractCall
      // Verwende die claim Funktion direkt mit den korrekten Parametern
      const transaction = prepareContractCall({
        contract,
        method: "function claim(address _receiver, uint256 _quantity, address _currency, uint256 _pricePerToken, (bytes32[] proof, uint256 quantityLimitPerWallet, uint256 pricePerToken, address currency) _allowlistProof, bytes _data) payable",
        params: [
          account.address, // _receiver
          tokenAmountWei, // _quantity (in wei, als BigInt)
          "0x0000000000000000000000000000000000000000", // _currency (ETH/Base native)
          BigInt(0), // _pricePerToken (Claim Conditions bestimmen den Preis)
          {
            proof: [], // proof: bytes32[] (empty array)
            quantityLimitPerWallet: BigInt(0), // quantityLimitPerWallet: uint256
            pricePerToken: BigInt(0), // pricePerToken: uint256
            currency: "0x0000000000000000000000000000000000000000", // currency: address
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
          alert(`Transaction successful! Hash: ${result.transactionHash}`);
          // Optional: Reload Token Balance
          window.location.reload();
        },
        onError: (error) => {
          console.error("Transaction error:", error);
          alert(`Purchase error: ${error.message || "Unknown error"}`);
        },
      });
      
    } catch (error: any) {
      console.error("Purchase error:", error);
      alert(`Purchase error: ${error.message || "Unknown error"}`);
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!account) {
    return (
      <div className="glass rounded-3xl p-10 border border-white/10">
        <div className="text-center py-8">
          <p className="text-base text-gray-300 mb-2 font-medium">Please connect your wallet</p>
          <p className="text-sm text-gray-400">to purchase token packages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Purchase Tokens</h3>
        <p className="text-sm text-gray-400 font-medium">Choose a package and pay with Thirdweb Pay</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PACKAGES.map((pkg, index) => (
          <div
            key={index}
            className={`relative premium-card rounded-2xl p-6 border transition-all cursor-pointer ${
              selectedPackage === index
                ? "border-white/40 bg-white/15 shadow-2xl scale-[1.02]"
                : "border-white/10 bg-gray-900/30 hover:border-white/25 hover:bg-white/5"
            } ${pkg.popular ? "ring-2 ring-white/30 ring-offset-2 ring-offset-black" : ""}`}
            onClick={() => setSelectedPackage(index)}
          >
            {pkg.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 text-xs font-bold px-4 py-1.5 rounded-full border border-yellow-500/30 shadow-lg backdrop-blur-sm">
                  ⭐ Popular
                </span>
              </div>
            )}
            <div className="text-center mb-5">
              <div className="text-3xl font-extrabold text-white mb-1.5 tracking-tight">
                {pkg.tokens.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 font-medium">PARA Tokens</div>
            </div>
            <div className="text-center mb-5">
              {isLoadingPrice ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-xs text-gray-400">Loading price...</span>
                </div>
              ) : claimCondition ? (
                <>
                  <div className="text-2xl font-extrabold text-white mb-1.5">
                    ${(parseFloat(claimCondition.pricePerTokenUsd) * pkg.tokens).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    {(parseFloat(claimCondition.pricePerToken) * pkg.tokens).toFixed(6)} ETH
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {parseFloat(claimCondition.pricePerTokenUsd).toFixed(4)} $ per token
                  </div>
                </>
              ) : (
                <div className="text-xs text-gray-500">Price not available</div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePurchase(pkg);
              }}
              disabled={isPurchasing || isLoadingPrice || isSendingTransaction}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                selectedPackage === index
                  ? "bg-gradient-to-r from-white/20 to-white/10 text-white border-2 border-white/30 hover:from-white/30 hover:to-white/20 shadow-xl hover:shadow-2xl hover:scale-[1.02]"
                  : "bg-gradient-to-r from-gray-800 to-gray-900 text-gray-200 border border-gray-700 hover:from-gray-700 hover:to-gray-800"
              } ${isPurchasing || isLoadingPrice ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isPurchasing || isSendingTransaction ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                "Purchase"
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-400">
          💡 Payments via Base, BSC, Polygon, Arbitrum and more possible via Universal Bridge
        </p>
      </div>
    </div>
  );
}

