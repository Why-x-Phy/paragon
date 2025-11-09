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
      
      <main className="relative pt-24 pb-24 px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-24">
        <div className="w-full max-w-[1600px] mx-auto">
          {/* Stats Cards - Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 mt-8">
            <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
              <TokenBalance />
            </div>
            <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
              <CreditStatus credits={credits} />
            </div>
          </div>

          {/* Main Content Grid - Chart and Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
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
          <div className="mb-12 fade-in-up" style={{ animationDelay: "0.5s" }}>
            <TokenPurchase />
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="premium-card rounded-3xl p-10 fade-in-up" style={{ animationDelay: "0.6s" }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center mb-6 glow border border-white/10">
                <span className="text-3xl">🔗</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Wallet Login</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Connect your wallet (Metamask, Rabby, Phantom) directly via Thirdweb
              </p>
            </div>

            <div className="premium-card rounded-3xl p-10 fade-in-up" style={{ animationDelay: "0.7s" }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center mb-6 glow border border-white/10">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Token Payment</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Credits are paid with the Paragon Token (PARA) on Base
              </p>
            </div>

            <div className="premium-card rounded-3xl p-10 fade-in-up" style={{ animationDelay: "0.8s" }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center mb-6 glow border border-white/10">
                <span className="text-3xl">🧠</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">AI Chart Analyzer</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                AI-powered analyses with RSI, MACD, EMA and more
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
