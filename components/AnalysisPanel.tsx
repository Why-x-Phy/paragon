"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";

interface AnalysisResult {
  tendency: "Bullish" | "Neutral" | "Bearish";
  risk: "low" | "medium" | "high";
  reasoning: string;
  indicators: {
    rsi: number;
    macd: string;
    ema: string;
  };
}

export default function AnalysisPanel({ credits, onAnalyze }: { credits: number; onAnalyze: () => void }) {
  const account = useActiveAccount();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!account) {
      alert("Please connect your wallet first");
      return;
    }

    if (credits < 1) {
      alert("Insufficient credits. Please purchase more tokens.");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // API Call zum Backend
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          market: "BTC/USDT", // TODO: Aus Chart-Panel übernehmen
          walletAddress: account.address,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis error");
      }

      const data = await response.json();
      
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        onAnalyze(); // Credit is deducted
      } else {
        throw new Error("Invalid server response");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      alert(error instanceof Error ? error.message : "Analysis error. Please try again.");
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

  return (
    <div className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all h-full flex flex-col min-h-[600px]">
      <div className="mb-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-white mb-1.5 tracking-tight">AI Analysis</h3>
            <p className="text-xs text-gray-400 font-medium">Get a smart market assessment</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1 font-medium">Cost</div>
            <div className="text-lg font-extrabold text-white">1 Credit</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
      {!analysis ? (
        <div className="space-y-5 flex-1 flex flex-col justify-center">
          <div className="bg-gray-900/30 rounded-lg p-5 border border-white/5">
            <div className="text-center mb-3">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
                <span className="text-2xl">🧠</span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-1.5">Ready to Analyze</h4>
              <p className="text-xs text-gray-400">
                Get AI-powered market insights with technical indicators
              </p>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={!account || credits < 1 || isAnalyzing}
            className={`w-full py-3 rounded-lg font-bold text-sm text-white transition-all ${
              !account || credits < 1 || isAnalyzing
                ? "bg-gray-700 cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-white/15 to-white/5 hover:from-white/25 hover:to-white/10 border border-white/20 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            }`}
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
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
        <div className="space-y-3 flex-1 overflow-y-auto">
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

          <div className="bg-gray-900/50 rounded-lg p-3 space-y-2">
            <h4 className="text-xs font-semibold text-white mb-2">Technical Indicators</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <div className="text-xs text-gray-400 mb-1">RSI</div>
                <div className="text-xs font-semibold text-white">{analysis.indicators.rsi}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">MACD</div>
                <div className="text-xs font-semibold text-white">{analysis.indicators.macd}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">EMA</div>
                <div className="text-xs font-semibold text-white">{analysis.indicators.ema}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-white mb-2">Reasoning</h4>
            <p className="text-xs text-gray-300 leading-relaxed">{analysis.reasoning}</p>
          </div>

          <button
            onClick={() => {
              setAnalysis(null);
              handleAnalyze();
            }}
            disabled={!account || credits < 1 || isAnalyzing}
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all mt-auto"
          >
            Start New Analysis
          </button>
        </div>
      )}
      </div>
    </div>
  );
}

