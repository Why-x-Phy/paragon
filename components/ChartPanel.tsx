"use client";

import { useState, useEffect } from "react";

interface Market {
  symbol: string;
  name: string;
}

interface AnalysisResult {
  tendency?: "Bullish" | "Neutral" | "Bearish";
  risk?: "low" | "medium" | "high";
  marketData?: {
    price: number;
    change24h: number;
  };
  detailedIndicators?: {
    liquidationZones?: {
      price: number;
      type: "long" | "short";
      liquidationAmount: number;
    }[];
  };
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
  initialView = "chart"
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
    <div className="glass rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all h-full flex flex-col min-h-0">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 flex-shrink-0">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white tracking-tight mb-1">
            {activeView === "chart" ? "Live Chart" : "Jupiter Perps"}
          </h3>
          <p className="text-xs text-gray-400 font-medium">
            {activeView === "chart" 
              ? `${selectedMarket.name} • ${selectedInterval === "1" ? "1m" : selectedInterval === "5" ? "5m" : selectedInterval === "15" ? "15m" : selectedInterval === "60" ? "1h" : selectedInterval === "240" ? "4h" : "1d"} • ${showEMAs ? "EMAs, Volume Profile & Heatmap Active" : "Real-time Chart"}`
              : "Trade perpetual futures on Jupiter"
            }
          </p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex gap-2 bg-gray-900/50 rounded-lg p-1 border border-white/10">
          <button
            onClick={() => handleViewChange("chart")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === "chart"
                ? "bg-white/10 text-white border border-white/20 shadow-lg"
                : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            📊 Chart
          </button>
          <button
            onClick={() => handleViewChange("jupiter")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeView === "jupiter"
                ? "bg-white/10 text-white border border-white/20 shadow-lg"
                : "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            ⚡ Jupiter Perps
          </button>
        </div>
      </div>

      {/* AI Analysis Context - nur bei Jupiter View */}
      {activeView === "jupiter" && analysis && (
        <div className="mb-4 px-4 py-3 border border-white/10 bg-gradient-to-r from-white/5 to-transparent rounded-lg flex-shrink-0">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Tendency:</span>
              <span className={`text-xs font-semibold ${
                analysis.tendency === "Bullish" ? "text-green-400" : 
                analysis.tendency === "Bearish" ? "text-red-400" : 
                "text-yellow-400"
              }`}>
                {analysis.tendency === "Bullish" ? "🟢 Bullish" : 
                 analysis.tendency === "Bearish" ? "🔴 Bearish" : 
                 "🟡 Neutral"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Risk:</span>
              <span className={`text-xs font-semibold ${
                analysis.risk === "low" ? "text-green-400" : 
                analysis.risk === "high" ? "text-red-400" : 
                "text-yellow-400"
              }`}>
                {analysis.risk?.charAt(0).toUpperCase() + analysis.risk?.slice(1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Price:</span>
              <span className="text-xs font-bold text-white">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={`text-xs font-semibold ${change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                ({change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}%)
              </span>
            </div>
            {relevantLiquidationZone && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Key Liq Zone:</span>
                <span className="text-xs font-semibold text-white">
                  ${relevantLiquidationZone.price.toFixed(0)} (${formatAmount(relevantLiquidationZone.liquidationAmount)})
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Content Area */}
      <div className="w-full flex-1 rounded-xl overflow-hidden bg-gray-900 border border-white/10 shadow-2xl min-h-0">
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

