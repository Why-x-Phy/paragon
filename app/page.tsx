"use client";

import { useState } from "react";
import Header from "@/components/Header";
import TokenBalance from "@/components/TokenBalance";
import CreditStatus from "@/components/CreditStatus";
import ChartPanel from "@/components/ChartPanel";
import AnalysisPanel from "@/components/AnalysisPanel";
import TokenPurchase from "@/components/TokenPurchase";

export default function Home() {
  const [credits, setCredits] = useState(10); // Demo: Start mit 10 Credits

  const handleAnalyze = () => {
    // Credit wird abgezogen
    setCredits((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <Header />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 mt-8">
            <div className="inline-block mb-4">
              <span className="text-6xl font-bold gradient-text">⚡ Paragon AI</span>
            </div>
            <p className="text-xl text-gray-300 mb-2">The On-Chain AI Chart Analyst</p>
            <p className="text-sm text-gray-500 max-w-2xl mx-auto">
              KI-gestützte Marktanalysen powered by Thirdweb, Base, und Paragon AI Token (PARA)
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <TokenBalance />
            <CreditStatus credits={credits} />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Chart Panel - Takes 2 columns */}
            <div className="lg:col-span-2">
              <ChartPanel />
            </div>

            {/* Analysis Panel - Takes 1 column */}
            <div className="lg:col-span-1">
              <AnalysisPanel credits={credits} onAnalyze={handleAnalyze} />
            </div>
          </div>

          {/* Token Purchase Section */}
          <div className="mb-8">
            <TokenPurchase />
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 glow">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Wallet-Login</h3>
              <p className="text-sm text-gray-400">
                Verbinde deine Wallet (Metamask, Rabby, Phantom) direkt über Thirdweb
              </p>
            </div>

            <div className="glass rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 glow">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Token-Bezahlung</h3>
              <p className="text-sm text-gray-400">
                Credits werden mit dem Paragon-Token (PARA) auf Base bezahlt
              </p>
            </div>

            <div className="glass rounded-xl p-6 border border-white/10">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 glow">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">AI Chart-Analyzer</h3>
              <p className="text-sm text-gray-400">
                KI-gestützte Analysen mit RSI, MACD, EMA und mehr
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="glass rounded-xl p-6 border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="text-sm font-semibold text-yellow-400 mb-1">Disclaimer</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Paragon AI bietet keine Finanz- oder Anlageberatung. Alle Analysen sind 
                  algorithmisch generierte technische Einschätzungen. Trading erfolgt auf eigenes Risiko.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
