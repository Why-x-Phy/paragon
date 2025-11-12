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
    rsi: true,
    macd: true,
    ema: true,
    volume: true,
    liquidation: true,
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
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "Bearish":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      default:
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "text-green-400";
      case "high":
        return "text-red-400";
      default:
        return "text-yellow-400";
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
    <div className="glass rounded-3xl p-8 h-full flex flex-col min-h-0">
      <div className="mb-8 flex-shrink-0">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-h2 font-bold text-white mb-2 tracking-tight">AI Analysis</h3>
            <p className="text-body-sm text-gray-400 font-medium">Get a smart market assessment</p>
          </div>
          <div className="text-right">
            <div className="text-label text-gray-500 mb-2 font-medium">Cost</div>
            <div className="text-h3 font-extrabold text-white">1 Credit</div>
          </div>
        </div>
        
        {/* Step 1: Market Selection */}
        <div className="mb-6">
          <label className="text-label text-gray-400 font-semibold mb-3 block">
            Step 1: Select Crypto Asset
          </label>
          <div className="flex flex-wrap gap-3">
            {MARKETS.map((market) => (
              <button
                key={market.symbol}
                onClick={() => onMarketChange(market)}
                disabled={isAnalyzing}
                className={`px-5 py-3 rounded-xl text-body-sm font-semibold transition-all border-2 ${
                  selectedMarket.symbol === market.symbol
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border-cyan-500/40 shadow-lg shadow-cyan-500/20"
                    : "bg-gray-900/50 text-gray-300 hover:bg-gray-900/70 border-white/10 hover:border-white/20"
                } ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {market.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Step 2: Interval Selection */}
        <div className="mb-6">
          <label className="text-label text-gray-400 font-semibold mb-3 block">
            Step 2: Select Timeframe (Default: 15m)
          </label>
          <div className="flex flex-wrap gap-3">
            {INTERVALS.map((interval) => (
              <button
                key={interval.value}
                onClick={() => onIntervalChange(interval.value)}
                disabled={isAnalyzing}
                className={`px-5 py-3 rounded-xl text-body-sm font-semibold transition-all border-2 ${
                  selectedInterval === interval.value
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border-cyan-500/40 shadow-lg shadow-cyan-500/20"
                    : "bg-gray-900/50 text-gray-300 hover:bg-gray-900/70 border-white/10 hover:border-white/20"
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
        <div className="space-y-6 flex-1 flex flex-col justify-center">
          <div className="bg-gray-900/50 rounded-2xl p-8 border-2 border-white/10">
            <div className="text-center mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border-2 border-cyan-500/30 shadow-lg shadow-cyan-500/20">
                <span className="text-4xl">🧠</span>
              </div>
              <h4 className="text-h4 font-bold text-white mb-2">Ready to Analyze</h4>
              <p className="text-body-sm text-gray-400 mb-4">
                Get AI-powered market insights with technical indicators
              </p>
              <p className="text-body-sm text-gray-500 mb-4">
                Selected: <span className="text-white font-bold">{selectedMarket.name}</span> • 
                <span className="text-white font-bold"> {selectedInterval === "1" ? "1m" : selectedInterval === "5" ? "5m" : selectedInterval === "15" ? "15m" : selectedInterval === "60" ? "1h" : selectedInterval === "240" ? "4h" : "1d"}</span>
              </p>
              {lastAnalysisTime && (
                <p className="text-body-sm text-cyan-400 mb-6 font-medium">
                  Last Analysis: {lastAnalysisTime.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} ({Math.floor((Date.now() - lastAnalysisTime.getTime()) / 60000)}m ago)
                </p>
              )}
              
              {/* Analysis Features Info */}
              <div className="bg-gray-800/50 rounded-xl p-5 border-2 border-white/10 text-left">
                <p className="text-label text-gray-400 mb-3 font-bold">Analysis includes:</p>
                <ul className="text-body-sm text-gray-400 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>RSI, MACD, EMA (50/200)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>Volume analysis & spikes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>Price action & trends</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">•</span>
                    <span>Support/Resistance levels</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
              <button
                onClick={handleAnalyze}
                disabled={!account || credits < 1 || isAnalyzing || isTransferring}
                className={`w-full min-h-[56px] rounded-xl font-bold text-body text-white transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
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
        <div className="space-y-6 flex-1 overflow-y-auto min-h-0">
          {/* Market Info */}
          <div className="bg-gray-900/60 rounded-2xl p-6 border-2 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-label text-gray-400 font-semibold">Asset</span>
              <span className="text-h4 font-bold text-white">{selectedMarket.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-label text-gray-400 font-semibold">Timeframe</span>
              <span className="text-h4 font-bold text-white">
                {selectedInterval === "1" ? "1m" : selectedInterval === "5" ? "5m" : selectedInterval === "15" ? "15m" : selectedInterval === "60" ? "1h" : selectedInterval === "240" ? "4h" : "1d"}
              </span>
            </div>
            {analysis.marketData && (
              <>
                <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-white/10">
                  <span className="text-label text-gray-400 font-semibold">Price</span>
                  <span className="text-h4 font-bold text-white text-number">${analysis.marketData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-label text-gray-400 font-semibold">24h Change</span>
                  <span className={`text-h4 font-bold ${analysis.marketData.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {analysis.marketData.change24h >= 0 ? "+" : ""}{analysis.marketData.change24h.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-label text-gray-400 font-semibold">24h High</span>
                  <span className="text-body font-semibold text-white text-number">${analysis.marketData.high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-label text-gray-400 font-semibold">24h Low</span>
                  <span className="text-body font-semibold text-white text-number">${analysis.marketData.low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
          </div>

          {/* Tendency & Risk */}
          <div className={`p-6 rounded-2xl border-2 ${getTendencyColor(analysis.tendency)}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-label font-semibold">Tendency</span>
              <span className="text-h4 font-bold">{analysis.tendency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-label font-semibold">Risk</span>
              <span className={`text-h4 font-bold ${getRiskColor(analysis.risk)}`}>
                {analysis.risk.charAt(0).toUpperCase() + analysis.risk.slice(1)}
              </span>
            </div>
          </div>

          {/* RSI Details */}
          {analysis.detailedIndicators && (
            <div className="bg-gray-900/60 rounded-2xl border-2 border-white/10 overflow-hidden">
              <button
                onClick={() => setExpandedSections({...expandedSections, rsi: !expandedSections.rsi})}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <h4 className="text-h4 font-bold text-white">RSI (Relative Strength Index)</h4>
                <span className="text-cyan-400 text-2xl transition-transform duration-300" style={{ transform: expandedSections.rsi ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {expandedSections.rsi && (
                <div className="px-6 pb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-label text-gray-400 font-semibold">Value</span>
                    <span className="text-h3 font-bold text-white text-number">{analysis.detailedIndicators.rsi.value.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-label text-gray-400 font-semibold">Status</span>
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
            <div className="bg-gray-900/60 rounded-2xl border-2 border-white/10 overflow-hidden">
              <button
                onClick={() => setExpandedSections({...expandedSections, macd: !expandedSections.macd})}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <h4 className="text-h4 font-bold text-white">MACD (Moving Average Convergence Divergence)</h4>
                <span className="text-cyan-400 text-2xl transition-transform duration-300" style={{ transform: expandedSections.macd ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {expandedSections.macd && (
                <div className="px-6 pb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-label text-gray-400 font-semibold">MACD Line</span>
                    <span className="text-body font-bold text-white text-number">{analysis.detailedIndicators.macd.value.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-label text-gray-400 font-semibold">Signal Line</span>
                    <span className="text-body font-semibold text-white text-number">{analysis.detailedIndicators.macd.signal.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-label text-gray-400 font-semibold">Histogram</span>
                    <span className={`text-body font-bold ${analysis.detailedIndicators.macd.histogram >= 0 ? "text-emerald-400" : "text-red-400"} text-number`}>
                      {analysis.detailedIndicators.macd.histogram >= 0 ? "+" : ""}{analysis.detailedIndicators.macd.histogram.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t-2 border-white/10">
                    <span className="text-label text-gray-400 font-semibold">Trend</span>
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
            <div className="bg-gray-900/60 rounded-2xl border-2 border-white/10 overflow-hidden">
              <button
                onClick={() => setExpandedSections({...expandedSections, ema: !expandedSections.ema})}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <h4 className="text-h4 font-bold text-white">EMA (Exponential Moving Average)</h4>
                <span className="text-cyan-400 text-2xl transition-transform duration-300" style={{ transform: expandedSections.ema ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {expandedSections.ema && (
                <div className="px-6 pb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-label text-gray-400 font-semibold">EMA 13</span>
                    <span className="text-body font-bold text-white text-number">${analysis.detailedIndicators.ema.ema13.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-label text-gray-400 font-semibold">EMA 50</span>
                    <span className="text-body font-bold text-white text-number">${analysis.detailedIndicators.ema.ema50.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-label text-gray-400 font-semibold">EMA 200</span>
                    <span className="text-body font-bold text-white text-number">${analysis.detailedIndicators.ema.ema200.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-label text-gray-400 font-semibold">EMA 800</span>
                    <span className="text-body font-bold text-white text-number">${analysis.detailedIndicators.ema.ema800.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t-2 border-white/10">
                    <span className="text-label text-gray-400 font-semibold">Trend</span>
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
            <div className="bg-gray-900/60 rounded-2xl border-2 border-white/10 overflow-hidden">
              <button
                onClick={() => setExpandedSections({...expandedSections, volume: !expandedSections.volume})}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <h4 className="text-h4 font-bold text-white">Volume Analysis</h4>
                <span className="text-cyan-400 text-2xl transition-transform duration-300" style={{ transform: expandedSections.volume ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {expandedSections.volume && (
                <div className="px-6 pb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-label text-gray-400 font-semibold">Current Volume</span>
                    <span className="text-body font-bold text-white text-number">
                      {analysis.detailedIndicators.volume.current.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-label text-gray-400 font-semibold">Average Volume</span>
                    <span className="text-body font-bold text-white text-number">
                      {analysis.detailedIndicators.volume.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-label text-gray-400 font-semibold">Volume Ratio</span>
                    <span className={`text-body font-bold ${analysis.detailedIndicators.volume.ratio >= 1.5 ? "text-emerald-400" : "text-gray-400"} text-number`}>
                      {analysis.detailedIndicators.volume.ratio.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t-2 border-white/10">
                    <span className="text-label text-gray-400 font-semibold">Volume Spike</span>
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
            <div className="bg-gray-900/60 rounded-2xl border-2 border-white/10 overflow-hidden">
              <button
                onClick={() => setExpandedSections({...expandedSections, liquidation: !expandedSections.liquidation})}
                className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <h4 className="text-h4 font-bold text-white">Liquidation Zones</h4>
                <span className="text-cyan-400 text-2xl transition-transform duration-300" style={{ transform: expandedSections.liquidation ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              {expandedSections.liquidation && (
                <div className="px-6 pb-6 space-y-4">
                  {analysis.detailedIndicators.liquidationZones.map((zone, index) => (
                    <div
                      key={index}
                      className={`p-5 rounded-xl border-2 ${
                        zone.type === "long"
                          ? "bg-red-500/10 border-red-500/30"
                          : "bg-emerald-500/10 border-emerald-500/30"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-body font-bold ${
                          zone.type === "long" ? "text-red-400" : "text-emerald-400"
                        }`}>
                          {zone.type === "long" ? "Long" : "Short"} Liquidation
                        </span>
                        <span className="text-h4 font-bold text-white text-number">
                          ${zone.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-label text-gray-400 font-semibold">Liquidation Amount</span>
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

          {/* Reasoning */}
          <div className="bg-gray-900/60 rounded-2xl p-6 border-2 border-white/10">
            <h4 className="text-h4 font-bold text-white mb-4">AI Analysis Reasoning</h4>
            <p className="text-body text-gray-300 leading-relaxed">{analysis.reasoning}</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                const analysisText = `Paragon AI Analysis: ${selectedMarket.name} - ${analysis.tendency} | Risk: ${analysis.risk}\n${analysis.reasoning}`;
                navigator.clipboard.writeText(analysisText);
                // Optional: Toast notification
              }}
              className="min-h-[56px] rounded-xl text-body-sm font-bold text-white bg-white/10 hover:bg-white/20 border-2 border-white/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </button>
            <button
              onClick={handlePostToX}
              className="min-h-[56px] rounded-xl text-body-sm font-bold text-white bg-[#1DA1F2] hover:bg-[#1a8cd8] border-2 border-[#1DA1F2]/40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1DA1F2]/30 hover:shadow-xl hover:shadow-[#1DA1F2]/40 hover:scale-[1.02]"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share
            </button>
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              setAnalysis(null);
              handleAnalyze();
            }}
            disabled={!account || credits < 1 || isAnalyzing}
            className="w-full min-h-[56px] rounded-xl text-body font-bold text-white bg-white/10 hover:bg-white/20 border-2 border-white/20 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
          >
            Start New Analysis
          </button>
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
                className="flex-1 min-h-[56px] rounded-xl text-body font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-2 border-cyan-400/40 transition-all shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02]"
              >
                Yes, Trade Now
              </button>
              <button
                onClick={() => setShowWantToTrade(false)}
                className="flex-1 min-h-[56px] rounded-xl text-body font-bold text-white bg-white/10 hover:bg-white/20 border-2 border-white/20 transition-all hover:scale-[1.02]"
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

