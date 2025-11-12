"use client";

import { useState, useEffect } from "react";
import type { AnalysisResult } from "@/lib/types";

interface Market {
  symbol: string;
  name: string;
}

interface ChartPanelProps {
  selectedMarket: Market;
  selectedInterval: string;
  showEMAs: boolean;
  showVolumeProfile?: boolean;
  showLiquidationHeatmap?: boolean;
  analysis?: AnalysisResult | null;
  onViewChange?: (view: "chart" | "jupiter") => void;
  initialView?: "chart" | "jupiter";
  onAnalyze?: () => void;
}

type ViewType = "chart" | "jupiter";

export default function ChartPanel({ 
  selectedMarket, 
  selectedInterval, 
  showEMAs,
  showVolumeProfile = false,
  showLiquidationHeatmap = false,
  analysis = null,
  onViewChange,
  initialView = "chart",
  onAnalyze
}: ChartPanelProps) {
  const [activeView, setActiveView] = useState<ViewType>(initialView);

  // Update view when initialView changes from parent
  useEffect(() => {
    if (initialView !== activeView) {
      setActiveView(initialView);
    }
  }, [initialView, activeView]);

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    onViewChange?.(view);
  };

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  };

  const currentPrice = analysis?.marketData?.price || 0;
  const change24h = analysis?.marketData?.change24h || 0;
  const relevantLiquidationZone = analysis?.detailedIndicators?.liquidationZones?.[0];
  const jupiterPerpsUrl = "https://jup.ag/perps";

  return (
    <div className="glass rounded-3xl p-8 sm:p-10 h-full flex flex-col min-h-0">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6 sm:mb-8 flex-shrink-0">
        <div className="flex-1 min-w-0 pl-[5px]">
          <h3 className="text-h2 font-bold text-white tracking-tight mb-2">
            {activeView === "chart" ? "Live Chart" : "Jupiter Perps"}
          </h3>
          <p className="text-body-sm text-gray-400 font-medium">
            {activeView === "chart" 
              ? `${selectedMarket.name} • ${selectedInterval === "1" ? "1m" : selectedInterval === "5" ? "5m" : selectedInterval === "15" ? "15m" : selectedInterval === "60" ? "1h" : selectedInterval === "240" ? "4h" : "1d"} • ${showEMAs ? "EMAs, Volume Profile & Heatmap Active" : "Real-time Chart"}`
              : "Trade perpetual futures on Jupiter"
            }
          </p>
        </div>
        
        {/* Tab Switcher & Quick Actions */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
          {activeView === "chart" && (
            <div className="flex gap-2">
              <button
                onClick={onAnalyze}
                className="px-4 py-2 rounded-xl text-body-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 border-2 border-cyan-400/40 transition-all shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-[1.02] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900"
                title="Quick Analyze"
                aria-label="Start quick market analysis"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Analyze
              </button>
            </div>
          )}
          <div className="flex gap-3 bg-gray-900/80 rounded-xl p-1.5 border-2 border-white/10 shadow-lg">
            <button
              onClick={() => handleViewChange("chart")}
              className={`px-6 py-3 rounded-xl text-body font-semibold transition-all min-w-[120px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                activeView === "chart"
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/20"
                  : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border-2 border-transparent"
              }`}
              aria-label="Switch to chart view"
              aria-pressed={activeView === "chart"}
            >
              📊 Chart
            </button>
            <button
              onClick={() => handleViewChange("jupiter")}
              className={`px-6 py-3 rounded-xl text-body font-semibold transition-all min-w-[120px] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                activeView === "jupiter"
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-white border-2 border-cyan-500/40 shadow-lg shadow-cyan-500/20"
                  : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border-2 border-transparent"
              }`}
              aria-label="Switch to Jupiter Perps trading view"
              aria-pressed={activeView === "jupiter"}
            >
              ⚡ Jupiter Perps
            </button>
          </div>
        </div>
      </div>

      {/* AI Analysis Context - nur bei Jupiter View */}
      {activeView === "jupiter" && analysis && (
        <div className="mb-6 px-[calc(1.25rem+5px)] sm:px-[calc(1.5rem+5px)] py-4 border-2 border-white/10 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-transparent rounded-3xl flex-shrink-0 shadow-lg">
          <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-label text-gray-400">Tendency:</span>
              <span className={`text-body font-bold ${
                analysis.tendency === "Bullish" ? "text-emerald-400" : 
                analysis.tendency === "Bearish" ? "text-red-400" : 
                "text-amber-400"
              }`}>
                {analysis.tendency === "Bullish" ? "🟢 Bullish" : 
                 analysis.tendency === "Bearish" ? "🔴 Bearish" : 
                 "🟡 Neutral"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-label text-gray-400">Risk:</span>
              <span className={`text-body font-bold ${
                analysis.risk === "low" ? "text-emerald-400" : 
                analysis.risk === "high" ? "text-red-400" : 
                "text-amber-400"
              }`}>
                {analysis.risk?.charAt(0).toUpperCase() + analysis.risk?.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-label text-gray-400">Price:</span>
              <span className="text-body font-bold text-white text-number">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-body font-bold ${change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                ({change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%)
              </span>
            </div>
            {relevantLiquidationZone && (
              <div className="flex items-center gap-3">
                <span className="text-label text-gray-400">Key Liq Zone:</span>
                <span className="text-body font-bold text-white text-number">
                  ${relevantLiquidationZone.price.toFixed(0)} (${formatAmount(relevantLiquidationZone.liquidationAmount)})
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Content Area */}
      <div className="w-full flex-1 rounded-3xl overflow-hidden bg-gray-950 border-2 border-white/10 shadow-2xl min-h-0">
        {activeView === "chart" ? (
          <iframe
            src={(() => {
              const baseUrl = `https://www.tradingview.com/widgetembed/?symbol=BINANCE:${selectedMarket.symbol.replace("/", "")}&interval=${selectedInterval}&theme=dark&style=1&locale=en&toolbar_bg=%231a1a1a&enable_publishing=false&hide_top_toolbar=true&hide_legend=true&hide_volume=${showEMAs ? "false" : "true"}&save_image=false&container_id=tradingview_${selectedMarket.symbol.replace("/", "")}_${selectedInterval}_${showEMAs ? "full" : "basic"}`;
              
              if (showEMAs) {
                // Build studies array: EMAs + Volume Profile
                // Volume Profile shows volume distribution at price levels (helps identify support/resistance)
                // Note: Custom scripts like Liquidation Heatmap may not work in widget embed
                // They require TradingView Pro account and may need to be added manually
                const studies = [
                  // EMAs (13, 50, 200, 800)
                  { id: "MASimple@tv-basicstudies", inputs: { length: 13 } },
                  { id: "MASimple@tv-basicstudies", inputs: { length: 50 } },
                  { id: "MASimple@tv-basicstudies", inputs: { length: 200 } },
                  { id: "MASimple@tv-basicstudies", inputs: { length: 800 } },
                  // Volume Profile - shows volume distribution at price levels
                  // This helps identify support/resistance zones and liquidity areas
                  // Note: Volume Profile may require TradingView Pro account
                  { id: "VolumeProfile@tv-basicstudies", inputs: {} }
                ];
                
                const studiesParam = encodeURIComponent(JSON.stringify(studies));
                return `${baseUrl}&studies=${studiesParam}`;
              }
              
              return baseUrl;
            })() + `&overrides=${encodeURIComponent(JSON.stringify({
              "paneProperties.background": "#1a1a1a",
              "paneProperties.backgroundType": "solid",
              "mainSeriesProperties.candleStyle.upColor": "#00d4aa",
              "mainSeriesProperties.candleStyle.downColor": "#ff4976",
              "mainSeriesProperties.candleStyle.borderUpColor": "#00d4aa",
              "mainSeriesProperties.candleStyle.borderDownColor": "#ff4976",
              "mainSeriesProperties.candleStyle.wickUpColor": "#00d4aa",
              "mainSeriesProperties.candleStyle.wickDownColor": "#ff4976"
            }))}&studies_overrides=${encodeURIComponent(JSON.stringify({
              "volume.volume.color.0": "#ff4976",
              "volume.volume.color.1": "#00d4aa"
            }))}`}
            className="w-full h-full"
            frameBorder="0"
            title={`TradingView Chart ${selectedMarket.symbol}`}
            allow="clipboard-write"
            key={`${selectedMarket.symbol}_${selectedInterval}_${showEMAs}`}
          />
        ) : (
          <iframe
            src={jupiterPerpsUrl}
            className="w-full h-full border-0"
            title="Jupiter Perps Trading Interface"
            allow="clipboard-read; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            key="jupiter-perps"
          />
        )}
      </div>
    </div>
  );
}

