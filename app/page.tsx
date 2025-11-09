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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black relative overflow-hidden">
      {/* Premium Background Effects - Heller */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 via-gray-950/90 to-black/80" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]" />
      
      <Header />
      
      <main className="relative pt-32 pb-32 px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-24">
        <div className="w-full max-w-[1800px] mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-32 mt-20 fade-in-up">
            <div className="inline-block mb-10">
              <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black text-white tracking-tight leading-none mb-6">
                ⚡ Paragon AI
              </h1>
            </div>
            <p className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-300 font-light tracking-wide">
              The On-Chain AI Chart Analyst
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
              <TokenBalance />
            </div>
            <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
              <CreditStatus credits={credits} />
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
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
          <div className="mb-20 fade-in-up" style={{ animationDelay: "0.5s" }}>
            <TokenPurchase />
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <div className="premium-card rounded-3xl p-10 fade-in-up" style={{ animationDelay: "0.6s" }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center mb-6 glow border border-white/10">
                <span className="text-3xl">🔗</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Wallet-Login</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Verbinde deine Wallet (Metamask, Rabby, Phantom) direkt über Thirdweb
              </p>
            </div>

            <div className="premium-card rounded-3xl p-10 fade-in-up" style={{ animationDelay: "0.7s" }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center mb-6 glow border border-white/10">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Token-Bezahlung</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Credits werden mit dem Paragon-Token (PARA) auf Base bezahlt
              </p>
            </div>

            <div className="premium-card rounded-3xl p-10 fade-in-up" style={{ animationDelay: "0.8s" }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center mb-6 glow border border-white/10">
                <span className="text-3xl">🧠</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">AI Chart-Analyzer</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                KI-gestützte Analysen mit RSI, MACD, EMA und mehr
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="glass rounded-2xl p-6 border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-start gap-4">
              <span className="text-xl">⚠️</span>
              <div>
                <h4 className="text-sm font-semibold text-yellow-400 mb-2">Disclaimer</h4>
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
