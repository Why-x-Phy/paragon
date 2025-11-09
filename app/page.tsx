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
      
      <main className="pt-20 pb-12 px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-24">
        <div className="w-full">
          {/* Hero Section */}
          <div className="text-center mb-16 mt-12">
            <div className="inline-block mb-6">
              <span className="text-7xl font-bold gradient-text tracking-tight">⚡ Paragon AI</span>
            </div>
            <p className="text-2xl text-gray-300 mb-3 font-light">The On-Chain AI Chart Analyst</p>
            <p className="text-base text-gray-400 max-w-3xl mx-auto leading-relaxed">
              KI-gestützte Marktanalysen powered by Thirdweb, Base, und Paragon AI Token (PARA)
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <TokenBalance />
            <CreditStatus credits={credits} />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
            {/* Chart Panel - Takes 8 columns */}
            <div className="lg:col-span-8">
              <ChartPanel />
            </div>

            {/* Analysis Panel - Takes 4 columns */}
            <div className="lg:col-span-4">
              <AnalysisPanel credits={credits} onAnalyze={handleAnalyze} />
            </div>
          </div>

          {/* Token Purchase Section */}
          <div className="mb-12">
            <TokenPurchase />
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="glass rounded-xl p-8 border border-white/10 hover:border-white/20 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <span className="text-3xl">🔗</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Wallet-Login</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Verbinde deine Wallet (Metamask, Rabby, Phantom) direkt über Thirdweb
              </p>
            </div>

            <div className="glass rounded-xl p-8 border border-white/10 hover:border-white/20 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Token-Bezahlung</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Credits werden mit dem Paragon-Token (PARA) auf Base bezahlt
              </p>
            </div>

            <div className="glass rounded-xl p-8 border border-white/10 hover:border-white/20 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <span className="text-3xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">AI Chart-Analyzer</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
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
