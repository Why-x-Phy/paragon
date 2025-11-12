"use client";

interface Market {
  symbol: string;
  name: string;
}

interface AnalysisResult {
  tendency: "Bullish" | "Neutral" | "Bearish";
  risk: "low" | "medium" | "high";
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

interface JupiterPerpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMarket: Market;
  analysis: AnalysisResult | null;
}

export default function JupiterPerpsModal({
  isOpen,
  onClose,
  selectedMarket,
  analysis,
}: JupiterPerpsModalProps) {
  if (!isOpen) return null;

  const currentPrice = analysis?.marketData?.price || 0;
  const change24h = analysis?.marketData?.change24h || 0;

  // Jupiter Perps URL - kann angepasst werden falls die URL anders ist
  // Mögliche URLs:
  // - https://jup.ag/perps
  // - https://jup.ag/perpetuals
  // - https://jup.ag (Hauptseite, dann zu Perps navigieren)
  const jupiterPerpsUrl = "https://jup.ag/perps";

  const formatAmount = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(0);
  };

  // Finde relevante Liquidationszone
  const relevantLiquidationZone = analysis?.detailedIndicators?.liquidationZones?.[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass rounded-3xl border-2 border-white/10 w-full max-w-6xl h-[90vh] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight mb-1">
              ⚡ Trade Perps on Jupiter
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              {selectedMarket.name} • {selectedMarket.symbol}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all"
          >
            <span className="text-white text-xl">×</span>
          </button>
        </div>

        {/* AI Analysis Context - Kompakt oben */}
        {analysis && (
          <div className="px-6 py-3 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent flex-shrink-0">
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
                  {analysis.risk.charAt(0).toUpperCase() + analysis.risk.slice(1)}
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

        {/* Jupiter Perps iframe */}
        <div className="flex-1 relative overflow-hidden">
          <iframe
            src={jupiterPerpsUrl}
            className="w-full h-full border-0"
            title="Jupiter Perps Trading Interface"
            allow="clipboard-read; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 border-t border-white/10 bg-gray-900/30 flex-shrink-0">
          <p className="text-[10px] text-gray-500 text-center">
            Trading via Jupiter Perps. Connect your Solana wallet in the Jupiter interface to start trading.
            {analysis && (
              <span className="ml-2">
                Based on your analysis: {analysis.tendency === "Bullish" ? "Consider Long positions" : analysis.tendency === "Bearish" ? "Consider Short positions" : "Monitor market conditions"}.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
