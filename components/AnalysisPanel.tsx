"use client";

import { useState } from "react";
import { useActiveAccount } from "thirdweb/react";

interface AnalysisResult {
  tendency: "Bullish" | "Neutral" | "Bearish";
  risk: "niedrig" | "mittel" | "hoch";
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
      alert("Bitte verbinde zuerst deine Wallet");
      return;
    }

    if (credits < 1) {
      alert("Nicht genügend Credits. Bitte kaufe mehr Tokens.");
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
        throw new Error(error.error || "Fehler bei der Analyse");
      }

      const data = await response.json();
      
      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        onAnalyze(); // Credit wird abgezogen
      } else {
        throw new Error("Ungültige Antwort vom Server");
      }
    } catch (error) {
      console.error("Analyse-Fehler:", error);
      alert(error instanceof Error ? error.message : "Fehler bei der Analyse. Bitte versuche es erneut.");
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
      case "niedrig":
        return "text-green-400";
      case "hoch":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  };

  return (
    <div className="glass rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">KI-Analyse</h3>
          <p className="text-sm text-gray-400">Erhalte eine smarte Markteinschätzung</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Kosten</div>
          <div className="text-lg font-bold text-white">1 Credit</div>
        </div>
      </div>

      {!analysis ? (
        <div className="space-y-4">
          <button
            onClick={handleAnalyze}
            disabled={!account || credits < 1 || isAnalyzing}
            className={`w-full py-4 rounded-lg font-semibold text-white transition-all ${
              !account || credits < 1 || isAnalyzing
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 glow-hover"
            }`}
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analysiere...
              </span>
            ) : !account ? (
              "Wallet verbinden"
            ) : credits < 1 ? (
              "Nicht genügend Credits"
            ) : (
              "⚡ Analyse starten"
            )}
          </button>
          {!account && (
            <p className="text-xs text-center text-gray-500">
              Verbinde deine Wallet, um eine Analyse zu starten
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border ${getTendencyColor(analysis.tendency)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tendenz</span>
              <span className="text-lg font-bold">{analysis.tendency}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Risiko</span>
              <span className={`text-lg font-bold ${getRiskColor(analysis.risk)}`}>
                {analysis.risk.charAt(0).toUpperCase() + analysis.risk.slice(1)}
              </span>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-white mb-3">Technische Indikatoren</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-gray-400 mb-1">RSI</div>
                <div className="text-sm font-semibold text-white">{analysis.indicators.rsi}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">MACD</div>
                <div className="text-sm font-semibold text-white">{analysis.indicators.macd}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">EMA</div>
                <div className="text-sm font-semibold text-white">{analysis.indicators.ema}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-2">Begründung</h4>
            <p className="text-sm text-gray-300 leading-relaxed">{analysis.reasoning}</p>
          </div>

          <button
            onClick={() => {
              setAnalysis(null);
              handleAnalyze();
            }}
            disabled={!account || credits < 1 || isAnalyzing}
            className="w-full py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all glow-hover"
          >
            Neue Analyse starten
          </button>
        </div>
      )}
    </div>
  );
}

