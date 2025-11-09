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
      
      <main className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="w-full max-w-[1600px] mx-auto space-y-6" style={{ paddingTop: '80px' }}>
          {/* Stats Cards - Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
              <TokenBalance />
            </div>
            <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
              <CreditStatus credits={credits} />
            </div>
          </div>

          {/* Main Content Grid - Chart and Analysis Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Chart Panel - Takes 8 columns */}
            <div className="lg:col-span-8 fade-in-up h-full" style={{ animationDelay: "0.3s" }}>
              <ChartPanel />
            </div>

            {/* Analysis Panel - Takes 4 columns */}
            <div className="lg:col-span-4 fade-in-up h-full" style={{ animationDelay: "0.4s" }}>
              <AnalysisPanel credits={credits} onAnalyze={handleAnalyze} />
            </div>
          </div>

          {/* Token Purchase Section */}
          <div className="fade-in-up" style={{ animationDelay: "0.5s" }}>
            <TokenPurchase />
          </div>
        </div>
      </main>
    </div>
  );
}
