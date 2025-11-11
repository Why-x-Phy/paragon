"use client";

import { useState, useEffect } from "react";
import { useActiveAccount, useReadContract, useSendTransaction } from "thirdweb/react";
import { client, PARA_TOKEN_ADDRESS, BASE_CHAIN_ID } from "@/lib/thirdweb";
import { getContract } from "thirdweb/contract";
import { balanceOf, transfer } from "thirdweb/extensions/erc20";
import { prepareContractCall } from "thirdweb";
import { defineChain } from "thirdweb/chains";

const baseChain = defineChain(BASE_CHAIN_ID);

interface Market {
  symbol: string;
  name: string;
}

interface AnalysisResult {
  tendency: "Bullish" | "Neutral" | "Bearish";
  risk: "low" | "medium" | "high";
  reasoning: string;
  indicators: {
    rsi: number;
    macd: string;
    ema: string;
  };
  detailedIndicators?: {
    rsi: {
      value: number;
      status: string;
    };
    macd: {
      value: number;
      signal: number;
      histogram: number;
      trend: string;
    };
    ema: {
      ema13: number;
      ema50: number;
      ema200: number;
      ema800: number;
      trend: string;
    };
    volume: {
      current: number;
      average: number;
      spike: boolean;
      ratio: number;
    };
    liquidationZones?: {
      price: number;
      intensity: number;
      type: "long" | "short";
      liquidationAmount: number;
    }[];
  };
  marketData?: {
    price: number;
    change24h: number;
    volume24h: number;
    high24h: number;
    low24h: number;
  };
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
      alert("Please connect your wallet first");
      return;
    }

    if (credits < 1) {
      alert("Insufficient credits. Please purchase more PARA tokens.");
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
            resolve();
          },
          onError: (error: any) => {
            console.error("Token transfer error:", error);
            console.error("Error type:", typeof error);
            console.error("Error constructor:", error?.constructor?.name);
            console.error("Error details:", JSON.stringify(error, null, 2));
            console.error("Error message:", error?.message);
            console.error("Error data:", error?.data);
            console.error("Error code:", error?.code);
            console.error("Error reason:", error?.reason);
            console.error("Error shortMessage:", error?.shortMessage);
            console.error("Error cause:", error?.cause);
            
            // Prüfe ob es ein Balance-Problem ist
            const errorMessage = error?.message || error?.data?.message || error?.reason || error?.shortMessage || String(error);
            const errorCode = error?.code || error?.data?.code;
            
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
        throw new Error(error.error || "Analysis error");
      }

      const data = await response.json();
      
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
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
      alert(error instanceof Error ? error.message : "Analysis error. Please try again.");
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
    <div className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all h-full flex flex-col min-h-0">
      <div className="mb-5 flex-shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-1 tracking-tight">AI Analysis</h3>
            <p className="text-xs text-gray-400 font-medium">Get a smart market assessment</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1 font-medium">Cost</div>
            <div className="text-lg font-extrabold text-white">1 Credit</div>
          </div>
        </div>
        
        {/* Step 1: Market Selection */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 font-medium mb-2 block">
            Step 1: Select Crypto Asset
          </label>
          <div className="flex flex-wrap gap-2">
            {MARKETS.map((market) => (
              <button
                key={market.symbol}
                onClick={() => onMarketChange(market)}
                disabled={isAnalyzing}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedMarket.symbol === market.symbol
                    ? "bg-white/10 text-white border border-white/20 shadow-lg"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-800/70 border border-white/5 hover:border-white/10"
                } ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {market.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Step 2: Interval Selection */}
        <div className="mb-4">
          <label className="text-xs text-gray-400 font-medium mb-2 block">
            Step 2: Select Timeframe (Default: 15m)
          </label>
          <div className="flex flex-wrap gap-2">
            {INTERVALS.map((interval) => (
              <button
                key={interval.value}
                onClick={() => onIntervalChange(interval.value)}
                disabled={isAnalyzing}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedInterval === interval.value
                    ? "bg-white/10 text-white border border-white/20 shadow-lg"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-800/70 border border-white/5 hover:border-white/10"
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
        <div className="space-y-5 flex-1 flex flex-col justify-center">
          <div className="bg-gray-900/30 rounded-lg p-5 border border-white/5">
            <div className="text-center mb-3">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
                <span className="text-2xl">🧠</span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-1.5">Ready to Analyze</h4>
              <p className="text-xs text-gray-400 mb-2">
                Get AI-powered market insights with technical indicators
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Selected: <span className="text-white font-semibold">{selectedMarket.name}</span> • 
                <span className="text-white font-semibold"> {selectedInterval === "1" ? "1m" : selectedInterval === "5" ? "5m" : selectedInterval === "15" ? "15m" : selectedInterval === "60" ? "1h" : selectedInterval === "240" ? "4h" : "1d"}</span>
              </p>
              
              {/* Analysis Features Info */}
              <div className="bg-gray-800/30 rounded-lg p-3 border border-white/5 text-left">
                <p className="text-[10px] text-gray-400 mb-2 font-semibold">Analysis includes:</p>
                <ul className="text-[10px] text-gray-500 space-y-1">
                  <li>• RSI, MACD, EMA (50/200)</li>
                  <li>• Volume analysis & spikes</li>
                  <li>• Price action & trends</li>
                  <li>• Support/Resistance levels</li>
                </ul>
              </div>
            </div>
          </div>
              <button
                onClick={handleAnalyze}
                disabled={!account || credits < 1 || isAnalyzing || isTransferring}
                className={`w-full py-3 rounded-lg font-bold text-sm text-white transition-all ${
                  !account || credits < 1 || isAnalyzing || isTransferring
                    ? "bg-gray-700 cursor-not-allowed opacity-50"
                    : "bg-gradient-to-r from-white/15 to-white/5 hover:from-white/25 hover:to-white/10 border border-white/20 shadow-lg hover:shadow-xl hover:scale-[1.02]"
                }`}
          >
                {isAnalyzing || isTransferring ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isTransferring ? "Transferring Token..." : "Analyzing..."}
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
            <p className="text-xs text-center text-gray-500">
              Connect your wallet to start an analysis
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
          {/* Market Info */}
          <div className="bg-gray-900/50 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 font-medium">Asset</span>
              <span className="text-sm font-bold text-white">{selectedMarket.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Timeframe</span>
              <span className="text-sm font-bold text-white">
                {selectedInterval === "1" ? "1m" : selectedInterval === "5" ? "5m" : selectedInterval === "15" ? "15m" : selectedInterval === "60" ? "1h" : selectedInterval === "240" ? "4h" : "1d"}
              </span>
            </div>
            {analysis.marketData && (
              <>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <span className="text-xs text-gray-400 font-medium">Price</span>
                  <span className="text-sm font-bold text-white">${analysis.marketData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">24h Change</span>
                  <span className={`text-sm font-bold ${analysis.marketData.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {analysis.marketData.change24h >= 0 ? "+" : ""}{analysis.marketData.change24h.toFixed(2)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">24h High</span>
                  <span className="text-sm font-semibold text-white">${analysis.marketData.high24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">24h Low</span>
                  <span className="text-sm font-semibold text-white">${analysis.marketData.low24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
          </div>

          {/* Tendency & Risk */}
          <div className={`p-3 rounded-lg border ${getTendencyColor(analysis.tendency)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium">Tendency</span>
              <span className="text-sm font-bold">{analysis.tendency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Risk</span>
              <span className={`text-sm font-bold ${getRiskColor(analysis.risk)}`}>
                {analysis.risk.charAt(0).toUpperCase() + analysis.risk.slice(1)}
              </span>
            </div>
          </div>

          {/* RSI Details */}
          {analysis.detailedIndicators && (
            <div className="bg-gray-900/50 rounded-lg p-3 border border-white/10">
              <h4 className="text-xs font-semibold text-white mb-3">RSI (Relative Strength Index)</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Value</span>
                  <span className="text-sm font-bold text-white">{analysis.detailedIndicators.rsi.value.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Status</span>
                  <span className={`text-xs font-semibold ${
                    analysis.detailedIndicators.rsi.status === "Overbought" ? "text-red-400" :
                    analysis.detailedIndicators.rsi.status === "Oversold" ? "text-green-400" : "text-yellow-400"
                  }`}>
                    {analysis.detailedIndicators.rsi.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* MACD Details */}
          {analysis.detailedIndicators && (
            <div className="bg-gray-900/50 rounded-lg p-3 border border-white/10">
              <h4 className="text-xs font-semibold text-white mb-3">MACD (Moving Average Convergence Divergence)</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">MACD Line</span>
                  <span className="text-sm font-bold text-white">{analysis.detailedIndicators.macd.value.toFixed(4)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Signal Line</span>
                  <span className="text-sm font-semibold text-white">{analysis.detailedIndicators.macd.signal.toFixed(4)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Histogram</span>
                  <span className={`text-sm font-semibold ${analysis.detailedIndicators.macd.histogram >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {analysis.detailedIndicators.macd.histogram >= 0 ? "+" : ""}{analysis.detailedIndicators.macd.histogram.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-gray-400">Trend</span>
                  <span className={`text-xs font-semibold ${
                    analysis.detailedIndicators.macd.trend === "Bullish" 
                      ? "text-green-400" 
                      : analysis.detailedIndicators.macd.trend === "Bearish" 
                      ? "text-red-400" 
                      : "text-yellow-400"
                  }`}>
                    {analysis.detailedIndicators.macd.trend}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* EMA Details */}
          {analysis.detailedIndicators && (
            <div className="bg-gray-900/50 rounded-lg p-3 border border-white/10">
              <h4 className="text-xs font-semibold text-white mb-3">EMA (Exponential Moving Average)</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">EMA 13</span>
                  <span className="text-sm font-semibold text-white">${analysis.detailedIndicators.ema.ema13.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">EMA 50</span>
                  <span className="text-sm font-semibold text-white">${analysis.detailedIndicators.ema.ema50.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">EMA 200</span>
                  <span className="text-sm font-semibold text-white">${analysis.detailedIndicators.ema.ema200.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">EMA 800</span>
                  <span className="text-sm font-semibold text-white">${analysis.detailedIndicators.ema.ema800.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-gray-400">Trend</span>
                  <span className={`text-xs font-semibold ${analysis.detailedIndicators.ema.trend === "Bullish" ? "text-green-400" : "text-red-400"}`}>
                    {analysis.detailedIndicators.ema.trend}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Volume Details */}
          {analysis.detailedIndicators && (
            <div className="bg-gray-900/50 rounded-lg p-3 border border-white/10">
              <h4 className="text-xs font-semibold text-white mb-3">Volume Analysis</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Current Volume</span>
                  <span className="text-sm font-semibold text-white">
                    {analysis.detailedIndicators.volume.current.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Average Volume</span>
                  <span className="text-sm font-semibold text-white">
                    {analysis.detailedIndicators.volume.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Volume Ratio</span>
                  <span className={`text-sm font-semibold ${analysis.detailedIndicators.volume.ratio >= 1.5 ? "text-green-400" : "text-gray-400"}`}>
                    {analysis.detailedIndicators.volume.ratio.toFixed(2)}x
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs text-gray-400">Volume Spike</span>
                  <span className={`text-xs font-semibold ${analysis.detailedIndicators.volume.spike ? "text-green-400" : "text-gray-400"}`}>
                    {analysis.detailedIndicators.volume.spike ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Liquidation Zones */}
          {analysis.detailedIndicators && analysis.detailedIndicators.liquidationZones && analysis.detailedIndicators.liquidationZones.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-3 border border-white/10">
              <h4 className="text-xs font-semibold text-white mb-3">Liquidation Zones</h4>
              <div className="space-y-2">
                {analysis.detailedIndicators.liquidationZones.map((zone, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg border ${
                      zone.type === "long"
                        ? "bg-red-500/10 border-red-500/20"
                        : "bg-green-500/10 border-green-500/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold ${
                        zone.type === "long" ? "text-red-400" : "text-green-400"
                      }`}>
                        {zone.type === "long" ? "Long" : "Short"} Liquidation
                      </span>
                      <span className="text-xs font-bold text-white">
                        ${zone.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">Liquidation Amount</span>
                      <span className="text-xs font-bold text-white">
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
            </div>
          )}

          {/* Reasoning */}
          <div className="bg-gray-900/50 rounded-lg p-3 border border-white/10">
            <h4 className="text-xs font-semibold text-white mb-2">AI Analysis Reasoning</h4>
            <p className="text-xs text-gray-300 leading-relaxed">{analysis.reasoning}</p>
          </div>

          {/* X Post Button */}
          <button
            onClick={handlePostToX}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-[#1DA1F2] hover:bg-[#1a8cd8] border border-[#1DA1F2]/30 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Post to X
          </button>

          {/* Action Button */}
          <button
            onClick={() => {
              setAnalysis(null);
              handleAnalyze();
            }}
            disabled={!account || credits < 1 || isAnalyzing}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all mt-2"
          >
            Start New Analysis
          </button>
        </div>
      )}

      {/* "Want to Trade?" Popup */}
      {showWantToTrade && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl max-w-sm w-full">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
                <span className="text-3xl">🚀</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Want to Trade?</h3>
              <p className="text-xs text-gray-400">
                Open a position on Jupiter Perps based on your analysis
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowWantToTrade(false);
                  onOpenJupiter?.(); // Wechsle zum Jupiter Tab im ChartPanel
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border border-green-500/30 transition-all shadow-lg shadow-green-500/20"
              >
                Yes, Trade Now
              </button>
              <button
                onClick={() => setShowWantToTrade(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
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

