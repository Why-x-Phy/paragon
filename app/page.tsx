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
      
      <main className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="w-full max-w-[1400px] mx-auto space-y-6">
          {/* Stats Cards - Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
              <TokenBalance />
            </div>
            <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
              <CreditStatus credits={credits} />
            </div>
          </div>

          {/* Main Content Grid - Chart and Analysis Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Panel - Takes 2 columns */}
            <div className="lg:col-span-2 fade-in-up" style={{ animationDelay: "0.3s" }}>
              <ChartPanel />
            </div>

            {/* Analysis Panel - Takes 1 column */}
            <div className="lg:col-span-1 fade-in-up" style={{ animationDelay: "0.4s" }}>
              <AnalysisPanel credits={credits} onAnalyze={handleAnalyze} />
            </div>
          </div>

          {/* Token Purchase Section */}
          <div className="fade-in-up" style={{ animationDelay: "0.5s" }}>
            <TokenPurchase />
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="premium-card rounded-3xl p-8 fade-in-up" style={{ animationDelay: "0.6s" }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center mb-5 glow border border-white/10">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Wallet Login</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Connect your wallet (Metamask, Rabby, Phantom) directly via Thirdweb
              </p>
            </div>

            <div className="premium-card rounded-3xl p-8 fade-in-up" style={{ animationDelay: "0.7s" }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center mb-5 glow border border-white/10">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">Token Payment</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Credits are paid with the Paragon Token (PARA) on Base
              </p>
            </div>

            <div className="premium-card rounded-3xl p-8 fade-in-up" style={{ animationDelay: "0.8s" }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center mb-5 glow border border-white/10">
                <span className="text-2xl">🧠</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-3">AI Chart Analyzer</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                AI-powered analyses with RSI, MACD, EMA and more
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="glass rounded-2xl p-5 border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <h4 className="text-sm font-semibold text-yellow-400 mb-1">Disclaimer</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Paragon AI does not provide financial or investment advice. All analyses are 
                  algorithmically generated technical assessments. Trading is at your own risk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
