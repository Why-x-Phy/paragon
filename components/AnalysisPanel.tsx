"use client";

import { useState, useEffect } from "react";
import { showToast } from "@/components/Toast";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { client, PARA_TOKEN_ADDRESS, BASE_CHAIN_ID } from "@/lib/thirdweb";
import { getContract } from "thirdweb/contract";
import { balanceOf, transfer } from "thirdweb/extensions/erc20";
import { prepareContractCall } from "thirdweb";
import { defineChain } from "thirdweb/chains";
import type { AnalysisResult } from "@/lib/types";

const baseChain = defineChain(BASE_CHAIN_ID);

interface Market {
  symbol: string;
  name: string;
}

interface AnalysisPanelProps {
  credits?: number; // Optional, wird jetzt aus Token-Balance berechnet
  onAnalyze: () => void;
  selectedMarket: Market;
  onMarketChange: (market: Market) => void;
  selectedInterval: string;
  onIntervalChange: (interval: string) => void;
  onAnalysisStart: () => void;
  onAnalysisComplete: () => void;
  onAnalysisResult?: (analysis: AnalysisResult | null) => void;
  onOpenJupiter?: () => void;
}

const MARKETS = [
  { symbol: "BTC/USDT", name: "Bitcoin" },
  { symbol: "ETH/USDT", name: "Ethereum" },
  { symbol: "SOL/USDT", name: "Solana" },
  { symbol: "BNB/USDT", name: "BNB" },
];

const INTERVALS = [
  { value: "1", label: "1m" },
  { value: "5", label: "5m" },
  { value: "15", label: "15m" },
  { value: "60", label: "1h" },
  { value: "240", label: "4h" },
  { value: "D", label: "1d" },
];

export default function AnalysisPanel({ 
  credits: creditsProp, 
  onAnalyze, 
  selectedMarket, 
  onMarketChange,
  selectedInterval,
  onIntervalChange,
  onAnalysisStart,
  onAnalysisComplete,
  onAnalysisResult,
  onOpenJupiter
}: AnalysisPanelProps) {
  const account = useActiveAccount();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showWantToTrade, setShowWantToTrade] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    rsi: false,
    macd: false,
    ema: false,
    volume: false,
    liquidation: false,
  });

  // Lese Token-Balance für Credits
  const contract = getContract({
    client,
    chain: baseChain,
    address: PARA_TOKEN_ADDRESS,
  });

  const { data: balance } = useReadContract(balanceOf, {
    contract,
    address: account?.address || "0x0000000000000000000000000000000000000000",
  });

  // Berechne Credits basierend auf Token-Balance: 1 Token = 1 Credit
  const credits = balance ? Math.floor(Number(balance) / 1e18) : 0;

  const { mutate: sendTransaction, isPending: isTransferring } = useSendTransaction();

  const handleAnalyze = async () => {
    if (!account) {
      showToast("Please connect your wallet first", "warning");
      return;
    }

    if (credits < 1) {
      showToast("Insufficient credits. Please purchase more PARA tokens.", "error");
      return;
    }

    setIsAnalyzing(true);
    onAnalysisStart(); // Signalisiere dass Analyse startet (EMAs anzeigen)
    
    try {
      // Schritt 1: Prüfe Balance vor Transfer
      const tokenContract = getContract({
        client,
        chain: baseChain,
        address: PARA_TOKEN_ADDRESS,
      });

      // 1 Token = 10^18 wei (korrekt als BigInt)
      // Verwende BigInt-Exponentiation für präzise Berechnung
      const oneTokenWei = BigInt(10) ** BigInt(18); // 1 Token in wei = 1000000000000000000

      console.log("One token in wei:", oneTokenWei.toString());
      console.log("One token in wei (expected): 1000000000000000000");
      console.log("One token in wei (match):", oneTokenWei.toString() === "1000000000000000000");

      // Prüfe Balance vor Transfer
      const currentBalance = await balanceOf({
        contract: tokenContract,
        address: account.address as `0x${string}`,
      });

      console.log("Current balance (wei):", currentBalance?.toString());
      // Korrekte Umrechnung: Verwende BigInt-Division für präzise Berechnung
      const balanceTokens = currentBalance 
        ? Number(currentBalance) / Number(BigInt(10 ** 18))
        : 0;
      console.log("Current balance (tokens):", balanceTokens);

      if (!currentBalance || currentBalance < oneTokenWei) {
        const balanceTokens = currentBalance ? Number(currentBalance) / 1e18 : 0;
        throw new Error(`Insufficient PARA tokens. You have ${balanceTokens.toFixed(2)} PARA, but need 1 PARA to continue.`);
      }

      console.log("Transferring 1 PARA token back to contract:", PARA_TOKEN_ADDRESS);
      console.log("Amount to transfer (wei):", oneTokenWei.toString());
      console.log("Amount to transfer (tokens): 1"); // Direkt 1 Token, keine Umrechnung
      console.log("Balance check - Current balance >= oneTokenWei:", currentBalance >= oneTokenWei);
      console.log("Balance difference (wei):", (currentBalance - oneTokenWei).toString());
      console.log("Balance difference (tokens):", Number(currentBalance - oneTokenWei) / 1e18);

      // VALIDIERUNG: Prüfe ob oneTokenWei exakt 1e18 ist
      const expectedOneTokenWei = BigInt("1000000000000000000");
      if (oneTokenWei !== expectedOneTokenWei) {
        throw new Error(`Invalid token amount calculation. Expected ${expectedOneTokenWei.toString()}, got ${oneTokenWei.toString()}`);
      }

      // VALIDIERUNG: Prüfe ob Balance ausreicht
      if (currentBalance < oneTokenWei) {
        const balanceTokens = Number(currentBalance) / Number(BigInt(10 ** 18));
        throw new Error(`Insufficient balance. You have ${balanceTokens.toFixed(2)} PARA, but need 1 PARA.`);
      }

      // Transferiere Token zurück an den Contract (Supply bleibt gleich)
      // Verwende prepareContractCall statt transfer, um sicherzustellen, dass der Betrag korrekt formatiert wird
      const transferTransaction = prepareContractCall({
        contract: tokenContract,
        method: "function transfer(address to, uint256 amount) returns (bool)",
        params: [
          PARA_TOKEN_ADDRESS as `0x${string}`, // to
          oneTokenWei, // amount (in wei, als BigInt)
        ],
      });

      console.log("Transfer transaction prepared:", transferTransaction);
      console.log("Transfer transaction type:", typeof transferTransaction);
      console.log("Transfer transaction keys:", Object.keys(transferTransaction || {}));

      // Warte auf Token-Transfer
      await new Promise<void>((resolve, reject) => {
        console.log("Sending transaction...");
        sendTransaction(transferTransaction, {
          onSuccess: () => {
            console.log("Token transfer successful");
            // Warte kurz, damit die Blockchain die Balance aktualisiert
            setTimeout(() => {
              resolve();
            }, 1000); // 1 Sekunde warten für Balance-Update
          },
          onError: (error: Error | unknown) => {
            console.error("Token transfer error:", error);
            
            // Prüfe ob es ein Balance-Problem ist
            const errorObj = error as { 
              message?: string; 
              reason?: string; 
              shortMessage?: string; 
              code?: string | number; 
              data?: { 
                message?: string; 
                code?: string | number;
              };
            };
            const errorMessage = errorObj?.message || errorObj?.data?.message || errorObj?.reason || errorObj?.shortMessage || String(error);
            const errorCode = errorObj?.code || errorObj?.data?.code;
            
            if (error instanceof Error) {
              console.error("Error message:", error.message);
            }
            
            console.error("Parsed error message:", errorMessage);
            console.error("Parsed error code:", errorCode);
            
            // Prüfe ob es ein Gas-Problem ist
            if (errorCode === "INSUFFICIENT_FUNDS" || errorMessage.includes("insufficient funds") || errorMessage.includes("gas")) {
              reject(new Error(`Insufficient native token (ETH) for gas fees. Please ensure you have enough ETH on Base network to pay for transaction fees.`));
            } else if (errorMessage.includes("insufficient") || errorMessage.includes("balance") || errorMessage.includes("funds") || errorMessage.includes("999999999999999900")) {
              reject(new Error(`Insufficient PARA tokens or wallet error. Please check your balance. Error: ${errorMessage}`));
            } else {
              reject(error);
            }
          },
        });
      });

      // Schritt 2: Nach erfolgreichem Transfer, führe Analyse durch
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          market: selectedMarket.symbol,
          walletAddress: account.address,
          interval: selectedInterval, // Übergebe das ausgewählte Intervall
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 429) {
          // Rate Limit Error
          const retryAfter = error.retryAfter || 60;
          throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`);
        }
        throw new Error(error.error || "Analysis error");
      }

      const data = await response.json();
      
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        setLastAnalysisTime(new Date());
        onAnalysisResult?.(data.analysis); // Übergib Analyse an Parent
        onAnalyze(); // Credit is deducted (Token wurde bereits transferiert)
        onAnalysisComplete(); // Signalisiere dass Analyse abgeschlossen ist
        // Zeige "Want to Trade?" Popup nach erfolgreicher Analyse
        setShowWantToTrade(true);
      } else {
        throw new Error("Invalid server response");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : "Analysis error. Please try again.";
      showToast(errorMessage, "error");
      onAnalysisComplete(); // Auch bei Fehler EMAs anzeigen
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTendencyColor = (tendency: string) => {
    switch (tendency) {
      case "Bullish":
        return "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
      case "Bearish":
        return "text-rose-400 bg-rose-500/15 border-rose-500/30";
      default:
        return "text-amber-400 bg-amber-500/15 border-amber-500/30";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-emerald-400";
      case "high":
        return "text-rose-400";
      default:
        return "text-amber-400";
    }
  };

  // Erstelle X-Post aus Analyse
  const generateXPost = (analysis: AnalysisResult): string => {
    const market = selectedMarket.name;
    const price = analysis.marketData?.price 
      ? `$${analysis.marketData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "N/A";
    const change24h = analysis.marketData?.change24h 
      ? `${analysis.marketData.change24h >= 0 ? "+" : ""}${analysis.marketData.change24h.toFixed(2)}%`
      : "N/A";
    
    const tendency = analysis.tendency;
    const risk = analysis.risk.charAt(0).toUpperCase() + analysis.risk.slice(1);
    
    const rsi = analysis.detailedIndicators?.rsi.value 
      ? analysis.detailedIndicators.rsi.value.toFixed(1)
      : "N/A";
    const rsiStatus = analysis.detailedIndicators?.rsi.status || "Neutral";
    
    const emaTrend = analysis.detailedIndicators?.ema.trend || "Neutral";
    const macdTrend = analysis.detailedIndicators?.macd.trend || "Neutral";
    
    // Liquidationszonen - größte und kleinste
    const liquidationZones = analysis.detailedIndicators?.liquidationZones || [];
    let liquidationInfo = "";
    if (liquidationZones.length > 0) {
      const sortedZones = [...liquidationZones].sort((a, b) => b.liquidationAmount - a.liquidationAmount);
      const largest = sortedZones[0];
      const smallest = sortedZones[sortedZones.length - 1];
      
      const formatAmount = (amount: number) => {
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
        return amount.toFixed(0);
      };
      
      liquidationInfo = `\n🔥 Liq Zones:\n• Largest: ${largest.type === "long" ? "Long" : "Short"} @ $${largest.price.toFixed(0)} ($${formatAmount(largest.liquidationAmount)})\n• Smallest: ${smallest.type === "long" ? "Long" : "Short"} @ $${smallest.price.toFixed(0)} ($${formatAmount(smallest.liquidationAmount)})`;
    }
    
    // Erstelle ausführlichen, ansprechenden X-Post (max 280 Zeichen)
    const reasoning = analysis.reasoning.length > 80 
      ? analysis.reasoning.substring(0, 77) + "..."
      : analysis.reasoning;
    
    const post = `🚀 ${market} Market Analysis

💰 ${price} (${change24h}) | ${tendency} | Risk: ${risk}

📊 Key Metrics:
• RSI: ${rsi} (${rsiStatus})
• EMA: ${emaTrend} | MACD: ${macdTrend}${liquidationInfo}

💡 ${reasoning}

⚡ Paragon AI
#Crypto #Trading #AI`;

    // Stelle sicher, dass der Post nicht zu lang ist (max 280 Zeichen)
    return post.length > 280 ? post.substring(0, 277) + "..." : post;
  };

  const handlePostToX = () => {
    if (!analysis) return;
    
    const postText = generateXPost(analysis);
    const encodedText = encodeURIComponent(postText);
    const xUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    
    window.open(xUrl, "_blank", "width=550,height=420");
  };

  return (
    <div className="glass rounded-3xl p-8 sm:p-10 md:p-12 h-full flex flex-col min-h-0 !mt-[5px]">
      <div className="mb-6 flex-shrink-0 !mt-[10px]">
        {/* Header Section */}
        <div className="flex items-center justify-between !px-[10px] mb-4">
          <div className="flex-1 min-w-0 !pl-[10px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 flex items-center justify-center border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/20">
                <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-h3 sm:text-h2 font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">AI Analysis</h3>
            </div>
          </div>
          {/* Kosten-Badge - Modern Card Design */}
          <div className="flex-shrink-0 !pr-[10px]">
            <div className="bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-purple-500/20 rounded-2xl !px-[calc(1.5rem+20px)] py-4 border-2 border-cyan-500/50 shadow-xl shadow-cyan-500/30 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <div className="text-label text-cyan-200 font-semibold text-xs leading-tight opacity-90">Cost per Analysis</div>
                  <div className="text-h3 font-extrabold text-white leading-tight">1 Credit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Step 1: Market Selection - Modern Card */}
        <div className="bg-gray-900/40 rounded-2xl p-5 border border-white/10 backdrop-blur-sm !mx-[10px] !mt-[10px]">
          <div className="flex items-center gap-3 mb-4 !px-[5px]">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 flex items-center justify-center border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/20">
              <span className="text-sm font-bold text-cyan-300">1</span>
            </div>
            <div className="flex-1">
              <label className="text-body-sm text-gray-200 font-bold">
                Select Crypto Asset
              </label>
              <p className="text-label text-gray-500 text-xs mt-0.5">Choose your trading pair</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 !px-[5px]">
            {MARKETS.map((market) => (
              <button
                key={market.symbol}
                onClick={() => onMarketChange(market)}
                disabled={isAnalyzing}
                className={`px-4 py-3 rounded-xl text-body-sm font-semibold transition-all border-2 ${
                  selectedMarket.symbol === market.symbol
                    ? "bg-gradient-to-br from-cyan-500/30 to-blue-500/20 text-white border-cyan-500/50 shadow-lg shadow-cyan-500/30 scale-[1.02]"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-800/70 border-white/10 hover:border-white/20 hover:scale-[1.02]"
                } ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {market.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Step 2: Interval Selection - Modern Card */}
        <div className="bg-gray-900/40 rounded-2xl p-5 border border-white/10 backdrop-blur-sm !mx-[10px] !mt-[5px]">
          <div className="flex items-center gap-3 mb-4 !px-[5px]">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/30 to-blue-600/20 flex items-center justify-center border-2 border-blue-500/40 shadow-lg shadow-blue-500/20">
              <span className="text-sm font-bold text-blue-300">2</span>
            </div>
            <div className="flex-1">
              <label className="text-body-sm text-gray-200 font-bold">
                Select Timeframe
              </label>
              <p className="text-label text-gray-500 text-xs mt-0.5">Choose your analysis period</p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 !px-[5px]">
            {INTERVALS.map((interval) => (
              <button
                key={interval.value}
                onClick={() => onIntervalChange(interval.value)}
                disabled={isAnalyzing}
                className={`px-4 py-3 rounded-xl text-body-sm font-semibold transition-all border-2 ${
                  selectedInterval === interval.value
                    ? "bg-gradient-to-br from-cyan-500/30 to-blue-500/20 text-white border-cyan-500/50 shadow-lg shadow-cyan-500/30 scale-[1.02]"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-800/70 border-white/10 hover:border-white/20 hover:scale-[1.02]"
                } ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {interval.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {!analysis ? (
        <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col justify-center overflow-y-auto">
          <div className="bg-gray-900/50 rounded-3xl p-8 sm:p-10 border-2 border-white/10 !mx-[10px] !my-[5px]">
            <div className="text-center !mb-[5px] !px-[5px] !py-[5px]">
              <div className="w-20 h-20 mx-auto !mb-[5px] rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
                <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="text-h4 font-bold text-white !mb-[5px] !px-[10px]">Ready to Analyze</h4>
              <p className="text-body-sm text-gray-400 !mb-[5px] !px-[10px]">
                Get AI-powered market insights with technical indicators
              </p>
              
              {/* Selected Asset & Timeframe as Badges */}
              <div className="flex gap-[5px] justify-center !mb-[5px] !px-[5px]">
                <div className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 rounded-full border-2 border-cyan-500/40 flex items-center gap-2 !m-[5px]">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-cyan-400 font-bold text-body-sm">{selectedMarket.name}</span>
                </div>
                <div className="px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-500/10 rounded-full border-2 border-blue-500/40 flex items-center gap-2 !m-[5px]">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-400 font-bold text-body-sm">{selectedInterval === "1" ? "1m" : selectedInterval === "5" ? "5m" : selectedInterval === "15" ? "15m" : selectedInterval === "60" ? "1h" : selectedInterval === "240" ? "4h" : "1d"}</span>
                </div>
              </div>
              
              {lastAnalysisTime && (
                <p className="text-body-sm text-cyan-400 !mb-[5px] font-medium">
                  Last Analysis: {lastAnalysisTime.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} ({Math.floor((Date.now() - lastAnalysisTime.getTime()) / 60000)}m ago)
                </p>
              )}
              
              {/* Analysis Features Info as Grid */}
              <div className="bg-gray-800/50 rounded-3xl p-8 border-2 border-white/10 !mb-[5px] !px-[5px]">
                <p className="text-label text-gray-400 !mb-[5px] font-bold text-center !px-[5px]">Analysis includes:</p>
                <div className="grid grid-cols-2 gap-[5px] !px-[5px]">
                  <div className="flex items-center gap-3 p-5 bg-gray-900/50 rounded-xl border border-white/10 !m-[5px]">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40">
                      <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="text-body-sm text-gray-300 font-medium">RSI, MACD, EMA</span>
                  </div>
                  <div className="flex items-center gap-3 p-5 bg-gray-900/50 rounded-xl border border-white/10 !m-[5px]">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/40">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <span className="text-body-sm text-gray-300 font-medium">Volume Analysis</span>
                  </div>
                  <div className="flex items-center gap-3 p-5 bg-gray-900/50 rounded-xl border border-white/10 !m-[5px]">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <span className="text-body-sm text-gray-300 font-medium">Price Trends</span>
                  </div>
                  <div className="flex items-center gap-3 p-5 bg-gray-900/50 rounded-xl border border-white/10 !m-[5px]">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/40">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="text-body-sm text-gray-300 font-medium">Support/Resistance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
              <button
                onClick={handleAnalyze}
                disabled={!account || credits < 1 || isAnalyzing || isTransferring}
                className={`w-1/2 min-h-[48px] rounded-xl font-bold text-body text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 !mx-auto !mt-[5px] ${
                  !account || credits < 1 || isAnalyzing || isTransferring
                    ? "bg-gray-800 cursor-not-allowed opacity-50 border-2 border-gray-700"
                    : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-2 border-cyan-400/40 shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02]"
                }`}
                aria-label={!account ? "Connect wallet to start analysis" : credits < 1 ? "Insufficient credits to start analysis" : "Start AI market analysis"}
                aria-disabled={!account || credits < 1 || isAnalyzing || isTransferring}
          >
                {isAnalyzing || isTransferring ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{isTransferring ? "Transferring Token..." : "Analyzing..."}</span>
                  </span>
                ) : !account ? (
                  "Connect Wallet"
                ) : credits < 1 ? (
                  "Insufficient Credits"
                ) : (
                  "⚡ Start Analysis"
                )}
          </button>
          {!account && (
            <p className="text-body-sm text-center text-gray-500">
              Connect your wallet to start an analysis
            </p>
          )}
        </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 !mt-[30px] pb-0">
            {/* Market Overview Section - Sticky Header */}
            <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm pb-2 !mb-[5px]">
            <div className="bg-gray-900/60 rounded-3xl p-8 sm:p-10 border-2 border-white/10">
            
            {analysis.marketData && (
              <>
                {/* Price - Prominent */}
                <div className="text-center py-4 sm:py-6 border-y-2 border-white/10 mb-4 sm:mb-6 !px-[10px]">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-1 sm:mb-2 text-number">
                    ${analysis.marketData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-lg sm:text-xl font-bold ${analysis.marketData.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {analysis.marketData.change24h >= 0 ? "+" : ""}{analysis.marketData.change24h.toFixed(2)}%
                  </div>
                </div>
                
                {/* 24h Stats as Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 !px-[10px]">
                  <div className="p-6 sm:p-8 bg-gray-800/50 rounded-xl border border-white/10">
                    <div className="text-label text-gray-400 font-semibold mb-1 sm:mb-2 text-xs sm:text-sm !pl-[10px]">24h High</div>
                    <div className="text-h4 sm:text-h3 font-bold text-white text-number !pl-[10px]">${analysis.marketData.high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="p-6 sm:p-8 bg-gray-800/50 rounded-xl border border-white/10">
                    <div className="text-label text-gray-400 font-semibold mb-1 sm:mb-2 text-xs sm:text-sm !pl-[10px]">24h Low</div>
                    <div className="text-h4 sm:text-h3 font-bold text-white text-number !pl-[10px]">${analysis.marketData.low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>

          {/* Key Metrics Section */}
          <div className="space-y-3 sm:space-y-4 !mb-[5px] !px-[10px]">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Tendency Card */}
            <div className={`p-8 sm:p-10 rounded-3xl border-2 ${getTendencyColor(analysis.tendency)}`}>
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  {analysis.tendency === "Bullish" ? (
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ) : analysis.tendency === "Bearish" ? (
                    <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                    </svg>
                  )}
                </div>
                <span className="text-label font-semibold text-xs sm:text-sm">Tendency</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-center">{analysis.tendency}</div>
            </div>
            
            {/* Risk Card */}
            <div className={`p-8 sm:p-10 rounded-3xl border-2 ${getRiskColor(analysis.risk) === "text-emerald-400" ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30" : getRiskColor(analysis.risk) === "text-rose-400" ? "text-rose-400 bg-rose-500/15 border-rose-500/30" : "text-amber-400 bg-amber-500/15 border-amber-500/30"}`}>
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  {analysis.risk === "low" ? (
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : analysis.risk === "high" ? (
                    <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <span className="text-label font-semibold text-xs sm:text-sm">Risk</span>
              </div>
              <div className={`text-xl sm:text-2xl font-bold text-center ${getRiskColor(analysis.risk)}`}>
                {analysis.risk.charAt(0).toUpperCase() + analysis.risk.slice(1)}
              </div>
            </div>
          </div>
          </div>

          {/* Technical Indicators Section */}
          <div className="space-y-[5px] !mb-[5px] !px-[10px]">
            {/* RSI Details */}
          {analysis.detailedIndicators && (
            <div className="bg-gray-900/60 rounded-3xl p-8 sm:p-10 border-2 border-white/10 overflow-hidden !my-[5px]">
              <button
                onClick={() => setExpandedSections({...expandedSections, rsi: !expandedSections.rsi})}
                className="w-full p-8 sm:p-10 flex items-center gap-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/40 flex-shrink-0">
                    <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="text-h4 sm:text-h3 font-bold text-white truncate">RSI</h4>
                  <span className={`ml-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                    analysis.detailedIndicators.rsi.status === "Overbought" ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                    analysis.detailedIndicators.rsi.status === "Oversold" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : 
                    "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  }`}>
                    {analysis.detailedIndicators.rsi.status}
                  </span>
                </div>
                <span className="text-cyan-400 text-2xl transition-transform duration-300 flex-shrink-0 !mr-[20px]" style={{ transform: expandedSections.rsi ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {expandedSections.rsi && (
                <div className="px-8 sm:px-10 pb-8 sm:pb-10 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-6 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">Value</span>
                    <span className="text-h3 font-bold text-white text-number flex-shrink-0">{analysis.detailedIndicators.rsi.value.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-6 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">Status</span>
                    <span className={`text-body font-bold ${
                      analysis.detailedIndicators.rsi.status === "Overbought" ? "text-red-400" :
                      analysis.detailedIndicators.rsi.status === "Oversold" ? "text-emerald-400" : "text-amber-400"
                    }`}>
                      {analysis.detailedIndicators.rsi.status}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MACD Details */}
          {analysis.detailedIndicators && (
            <div className="bg-gray-900/60 rounded-3xl p-8 sm:p-10 border-2 border-white/10 overflow-hidden !my-[5px]">
              <button
                onClick={() => setExpandedSections({...expandedSections, macd: !expandedSections.macd})}
                className="w-full p-8 sm:p-10 flex items-center gap-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/40 flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h4 className="text-h4 sm:text-h3 font-bold text-white truncate">MACD</h4>
                  <span className={`ml-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                    analysis.detailedIndicators.macd.trend === "Bullish" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" :
                    analysis.detailedIndicators.macd.trend === "Bearish" ? "bg-red-500/20 text-red-400 border border-red-500/40" : 
                    "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  }`}>
                    {analysis.detailedIndicators.macd.trend}
                  </span>
                </div>
                <span className="text-cyan-400 text-2xl transition-transform duration-300 flex-shrink-0 !mr-[20px]" style={{ transform: expandedSections.macd ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {expandedSections.macd && (
                <div className="px-8 sm:px-10 pb-8 sm:pb-10 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-6 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">MACD Line</span>
                    <span className="text-body font-bold text-white text-number flex-shrink-0">{analysis.detailedIndicators.macd.value.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-6 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">Signal Line</span>
                    <span className="text-body font-semibold text-white text-number flex-shrink-0">{analysis.detailedIndicators.macd.signal.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-6 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">Histogram</span>
                    <span className={`text-body font-bold flex-shrink-0 ${analysis.detailedIndicators.macd.histogram >= 0 ? "text-emerald-400" : "text-red-400"} text-number`}>
                      {analysis.detailedIndicators.macd.histogram >= 0 ? "+" : ""}{analysis.detailedIndicators.macd.histogram.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 pt-4 border-t-2 border-white/10 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">Trend</span>
                    <span className={`text-body font-bold ${
                      analysis.detailedIndicators.macd.trend === "Bullish" 
                        ? "text-emerald-400" 
                        : analysis.detailedIndicators.macd.trend === "Bearish" 
                        ? "text-red-400" 
                        : "text-amber-400"
                    }`}>
                      {analysis.detailedIndicators.macd.trend}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EMA Details */}
          {analysis.detailedIndicators && (
            <div className="bg-gray-900/60 rounded-3xl p-8 sm:p-10 border-2 border-white/10 overflow-hidden !my-[5px]">
              <button
                onClick={() => setExpandedSections({...expandedSections, ema: !expandedSections.ema})}
                className="w-full p-8 sm:p-10 flex items-center gap-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/40 flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h4 className="text-h4 sm:text-h3 font-bold text-white truncate">EMA</h4>
                  <span className={`ml-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold flex-shrink-0 ${
                    analysis.detailedIndicators.ema.trend === "Bullish" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" :
                    "bg-red-500/20 text-red-400 border border-red-500/40"
                  }`}>
                    {analysis.detailedIndicators.ema.trend}
                  </span>
                </div>
                <span className="text-cyan-400 text-2xl transition-transform duration-300 flex-shrink-0 !mr-[20px]" style={{ transform: expandedSections.ema ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {expandedSections.ema && (
                <div className="px-8 sm:px-10 pb-8 sm:pb-10 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-6 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">EMA 13</span>
                    <span className="text-body font-bold text-white text-number flex-shrink-0">${analysis.detailedIndicators.ema.ema13.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center gap-6 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">EMA 50</span>
                    <span className="text-body font-bold text-white text-number flex-shrink-0">${analysis.detailedIndicators.ema.ema50.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center gap-6 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">EMA 200</span>
                    <span className="text-body font-bold text-white text-number flex-shrink-0">${analysis.detailedIndicators.ema.ema200.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center gap-6 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">EMA 800</span>
                    <span className="text-body font-bold text-white text-number flex-shrink-0">${analysis.detailedIndicators.ema.ema800.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center gap-6 pt-4 border-t-2 border-white/10 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">Trend</span>
                    <span className={`text-body font-bold ${analysis.detailedIndicators.ema.trend === "Bullish" ? "text-emerald-400" : "text-red-400"}`}>
                      {analysis.detailedIndicators.ema.trend}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Volume Details */}
          {analysis.detailedIndicators && (
            <div className="bg-gray-900/60 rounded-3xl p-8 sm:p-10 border-2 border-white/10 overflow-hidden !my-[5px]">
              <button
                onClick={() => setExpandedSections({...expandedSections, volume: !expandedSections.volume})}
                className="w-full p-8 sm:p-10 flex items-center gap-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40 flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h4 className="text-h4 sm:text-h3 font-bold text-white truncate">Volume</h4>
                  {analysis.detailedIndicators.volume.spike && (
                    <span className="ml-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex-shrink-0">
                      Spike
                    </span>
                  )}
                </div>
                <span className="text-cyan-400 text-2xl transition-transform duration-300 flex-shrink-0 !mr-[20px]" style={{ transform: expandedSections.volume ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {expandedSections.volume && (
                <div className="px-8 sm:px-10 pb-8 sm:pb-10 space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-6 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">Current Volume</span>
                    <span className="text-body font-bold text-white text-number flex-shrink-0">
                      {analysis.detailedIndicators.volume.current.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">Average Volume</span>
                    <span className="text-body font-bold text-white text-number flex-shrink-0">
                      {analysis.detailedIndicators.volume.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">Volume Ratio</span>
                    <span className={`text-body font-bold flex-shrink-0 ${analysis.detailedIndicators.volume.ratio >= 1.5 ? "text-emerald-400" : "text-gray-400"} text-number`}>
                      {analysis.detailedIndicators.volume.ratio.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex items-center gap-6 pt-4 border-t-2 border-white/10 !px-[10px]">
                    <span className="text-label text-gray-400 font-semibold flex-1">Volume Spike</span>
                    <span className={`text-body font-bold ${analysis.detailedIndicators.volume.spike ? "text-emerald-400" : "text-gray-400"}`}>
                      {analysis.detailedIndicators.volume.spike ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Liquidation Zones */}
          {analysis.detailedIndicators && analysis.detailedIndicators.liquidationZones && analysis.detailedIndicators.liquidationZones.length > 0 && (
            <div className="bg-gray-900/60 rounded-3xl p-8 sm:p-10 border-2 border-white/10 overflow-hidden !my-[5px]">
              <button
                onClick={() => setExpandedSections({...expandedSections, liquidation: !expandedSections.liquidation})}
                className="w-full p-8 sm:p-10 flex items-center gap-6 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500/40 flex-shrink-0">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h4 className="text-h4 sm:text-h3 font-bold text-white truncate">Liquidation</h4>
                  <span className="ml-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40 flex-shrink-0">
                    {analysis.detailedIndicators.liquidationZones.length}
                  </span>
                </div>
                <span className="text-cyan-400 text-2xl transition-transform duration-300 flex-shrink-0 !mr-[20px]" style={{ transform: expandedSections.liquidation ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {expandedSections.liquidation && (
                <div className="px-8 sm:px-10 pb-8 sm:pb-10 space-y-3 sm:space-y-4">
                  {analysis.detailedIndicators.liquidationZones.map((zone, index) => (
                    <div
                      key={index}
                      className={`p-6 sm:p-8 rounded-3xl border-2 ${
                        zone.type === "long"
                          ? "bg-red-500/10 border-red-500/30"
                          : "bg-emerald-500/10 border-emerald-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-6 mb-3 !px-[10px]">
                        <span className={`text-body font-bold flex-1 ${
                          zone.type === "long" ? "text-red-400" : "text-emerald-400"
                        }`}>
                          {zone.type === "long" ? "Long" : "Short"} Liquidation
                        </span>
                        <span className="text-h4 font-bold text-white text-number flex-shrink-0">
                          ${zone.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 !px-[10px]">
                        <span className="text-label text-gray-400 font-semibold flex-1">Liquidation Amount</span>
                        <span className="text-body font-bold text-white text-number">
                          ${zone.liquidationAmount >= 1000000 
                            ? `${(zone.liquidationAmount / 1000000).toFixed(2)}M`
                            : zone.liquidationAmount >= 1000
                            ? `${(zone.liquidationAmount / 1000).toFixed(2)}K`
                            : zone.liquidationAmount.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>

          {/* AI Analysis Reasoning */}
          <div className="bg-gray-900/60 rounded-3xl p-8 sm:p-10 border-2 border-white/10 !px-[10px] !mb-[5px]">
            <h4 className="text-h4 sm:text-h3 font-bold text-white mb-3 sm:mb-4 !px-[10px]">AI Analysis Reasoning</h4>
            <p className="text-body-sm sm:text-body text-gray-300 leading-relaxed !px-[10px]">{analysis.reasoning}</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 !mb-[5px] !px-[10px]">
            <button
              onClick={() => {
                const analysisText = `Paragon AI Analysis: ${selectedMarket.name} - ${analysis.tendency} | Risk: ${analysis.risk}\n${analysis.reasoning}`;
                navigator.clipboard.writeText(analysisText);
                showToast("Analysis copied to clipboard", "success");
              }}
              className="min-h-[44px] sm:min-h-[48px] rounded-xl text-body-xs sm:text-body-sm font-semibold text-white bg-gray-900/60 hover:bg-gray-900/80 border-2 border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
            <button
              onClick={handlePostToX}
              className="min-h-[44px] sm:min-h-[48px] rounded-xl text-body-xs sm:text-body-sm font-semibold text-white bg-gradient-to-r from-cyan-500/30 to-blue-500/20 hover:from-cyan-500/40 hover:to-blue-500/30 border-2 border-cyan-500/40 hover:border-cyan-500/50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.02] backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share
            </button>
          </div>

          {/* Action Button */}
          <div className="flex justify-center !px-[10px] !mt-[5px]">
            <button
              onClick={() => {
                setAnalysis(null);
                handleAnalyze();
              }}
              disabled={!account || credits < 1 || isAnalyzing}
              className="w-1/2 min-h-[44px] sm:min-h-[48px] rounded-xl text-body-sm sm:text-body font-semibold text-white bg-gradient-to-r from-cyan-500/30 to-blue-500/20 hover:from-cyan-500/40 hover:to-blue-500/30 border-2 border-cyan-500/40 hover:border-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 backdrop-blur-sm"
            >
              Start New Analysis
            </button>
          </div>
        </div>
      )}

      {/* "Want to Trade?" Popup */}
      {showWantToTrade && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass rounded-3xl p-8 border-2 border-white/10 shadow-2xl max-w-md w-full">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/30">
                <span className="text-5xl">🚀</span>
              </div>
              <h3 className="text-h2 font-bold text-white mb-3">Want to Trade?</h3>
              <p className="text-body-sm text-gray-400">
                Open a position on Jupiter Perps based on your analysis
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowWantToTrade(false);
                  onOpenJupiter?.(); // Wechsle zum Jupiter Tab im ChartPanel
                }}
                className="flex-1 min-h-[48px] rounded-xl text-body font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-2 border-cyan-400/40 transition-all shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02]"
              >
                Yes, Trade Now
              </button>
              <button
                onClick={() => setShowWantToTrade(false)}
                className="flex-1 min-h-[48px] rounded-xl text-body font-bold text-white bg-white/10 hover:bg-white/20 border-2 border-white/20 transition-all hover:scale-[1.02]"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

