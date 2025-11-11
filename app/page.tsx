"use client";

import { useState } from "react";
import Header from "@/components/Header";
import TokenBalance from "@/components/TokenBalance";
import CreditStatus from "@/components/CreditStatus";
import ChartPanel from "@/components/ChartPanel";
import AnalysisPanel from "@/components/AnalysisPanel";
import TokenPurchase from "@/components/TokenPurchase";

const MARKETS = [
  { symbol: "BTC/USDT", name: "Bitcoin" },
  { symbol: "ETH/USDT", name: "Ethereum" },
  { symbol: "SOL/USDT", name: "Solana" },
  { symbol: "BNB/USDT", name: "BNB" },
];

export default function Home() {
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);
  const [selectedInterval, setSelectedInterval] = useState("15");
  const [showEMAs, setShowEMAs] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [chartView, setChartView] = useState<"chart" | "jupiter">("chart");

  const handleAnalyze = () => {
    // Credits werden jetzt automatisch aus Token-Balance berechnet
    // Keine manuelle Reduzierung mehr nötig
  };

  const handleAnalysisStart = () => {
    setShowEMAs(true);
  };

  const handleAnalysisComplete = () => {
    // EMAs bleiben sichtbar nach Analyse
  };

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 via-gray-950/90 to-black/80" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]" />
      
      {/* Main Container - Grid Layout with Header */}
      <div className="h-full w-full grid grid-rows-[auto_1fr] overflow-hidden">
        
        {/* Header - Fixed Container */}
        <div className="relative z-50 shrink-0">
          <Header />
        </div>
        
        {/* Content Area - Takes remaining space */}
        <div className="relative overflow-hidden min-h-0">
          <div className="h-full w-full px-6 sm:px-8 lg:px-10 xl:px-14 2xl:px-20 py-6 overflow-y-auto">
            <div className="h-full w-full grid grid-rows-[auto_1fr_auto] gap-6">
              
              {/* Top Row: Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
                  <TokenBalance />
                </div>
                <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
                  <CreditStatus />
                </div>
              </div>

              {/* Middle Row: Chart and Analysis - Takes remaining space */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                {/* Chart Panel - 8 columns */}
                <div className="lg:col-span-8 fade-in-up h-full min-h-0" style={{ animationDelay: "0.3s" }}>
                  <ChartPanel 
                    selectedMarket={selectedMarket} 
                    selectedInterval={selectedInterval}
                    showEMAs={showEMAs}
                    analysis={analysis}
                    onViewChange={setChartView}
                    initialView={chartView}
                  />
                </div>

                {/* Analysis Panel - 4 columns */}
                <div className="lg:col-span-4 fade-in-up h-full min-h-0" style={{ animationDelay: "0.4s" }}>
                  <AnalysisPanel 
                    onAnalyze={handleAnalyze} 
                    selectedMarket={selectedMarket}
                    onMarketChange={setSelectedMarket}
                    selectedInterval={selectedInterval}
                    onIntervalChange={setSelectedInterval}
                    onAnalysisStart={handleAnalysisStart}
                    onAnalysisComplete={handleAnalysisComplete}
                    onAnalysisResult={setAnalysis}
                    onOpenJupiter={() => setChartView("jupiter")}
                  />
                </div>
              </div>

              {/* Bottom Row: Token Purchase */}
              <div className="fade-in-up" style={{ animationDelay: "0.5s" }}>
                <TokenPurchase />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
