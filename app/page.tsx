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
    <div className="min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-950 opacity-50" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
      <Header />
      
      <main className="relative pt-24 pb-20 px-6 sm:px-8 lg:px-16 xl:px-24 2xl:px-32">
        <div className="max-w-[1600px] mx-auto w-full">
          {/* Hero Section */}
          <div className="text-center mb-32 mt-24 fade-in-up">
            <div className="inline-block mb-12">
              <h1 className="text-8xl md:text-9xl lg:text-[10rem] font-black gradient-text tracking-tight leading-none mb-6">
                ⚡ Paragon AI
              </h1>
            </div>
            <p className="text-3xl md:text-4xl lg:text-5xl text-white mb-8 font-light tracking-wide">
              The On-Chain AI Chart Analyst
            </p>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-400 max-w-5xl mx-auto leading-relaxed font-light">
              KI-gestützte Marktanalysen powered by Thirdweb, Base, und Paragon AI Token (PARA)
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32">
            <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
              <TokenBalance />
            </div>
            <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
              <CreditStatus credits={credits} />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-32">
            {/* Chart Panel - Takes 8 columns */}
            <div className="lg:col-span-8 fade-in-up" style={{ animationDelay: "0.3s" }}>
              <ChartPanel />
            </div>

            {/* Analysis Panel - Takes 4 columns */}
            <div className="lg:col-span-4 fade-in-up" style={{ animationDelay: "0.4s" }}>
              <AnalysisPanel credits={credits} onAnalyze={handleAnalyze} />
            </div>
          </div>

          {/* Token Purchase Section */}
          <div className="mb-32 fade-in-up" style={{ animationDelay: "0.5s" }}>
            <TokenPurchase />
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
            <div className="premium-card rounded-2xl p-12 fade-in-up" style={{ animationDelay: "0.6s" }}>
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-8 glow">
                <span className="text-4xl">🔗</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-5">Wallet-Login</h3>
              <p className="text-base text-gray-400 leading-relaxed">
                Verbinde deine Wallet (Metamask, Rabby, Phantom) direkt über Thirdweb
              </p>
            </div>

            <div className="premium-card rounded-2xl p-12 fade-in-up" style={{ animationDelay: "0.7s" }}>
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-8 glow">
                <span className="text-4xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-5">Token-Bezahlung</h3>
              <p className="text-base text-gray-400 leading-relaxed">
                Credits werden mit dem Paragon-Token (PARA) auf Base bezahlt
              </p>
            </div>

            <div className="premium-card rounded-2xl p-12 fade-in-up" style={{ animationDelay: "0.8s" }}>
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-8 glow">
                <span className="text-4xl">🧠</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-5">AI Chart-Analyzer</h3>
              <p className="text-base text-gray-400 leading-relaxed">
                KI-gestützte Analysen mit RSI, MACD, EMA und mehr
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="glass rounded-xl p-8 border border-yellow-500/20 bg-yellow-500/5">
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
