"use client";

import { useState } from "react";

const MARKETS = [
  { symbol: "BTC/USDT", name: "Bitcoin" },
  { symbol: "ETH/USDT", name: "Ethereum" },
  { symbol: "SOL/USDT", name: "Solana" },
  { symbol: "BNB/USDT", name: "BNB" },
];

export default function ChartPanel() {
  const [selectedMarket, setSelectedMarket] = useState(MARKETS[0]);

  return (
    <div className="glass rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Live Chart</h3>
        <div className="flex gap-2">
          {MARKETS.map((market) => (
            <button
              key={market.symbol}
              onClick={() => setSelectedMarket(market)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedMarket.symbol === market.symbol
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white glow"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {market.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="w-full h-[500px] rounded-lg overflow-hidden bg-gray-900 border border-white/5">
        <iframe
          src={`https://www.tradingview.com/widgetembed/?symbol=BINANCE:${selectedMarket.symbol}&interval=15&theme=dark&style=1&locale=de&toolbar_bg=%231a1a1a&enable_publishing=false&hide_top_toolbar=true&hide_legend=true&save_image=false&container_id=tradingview_${selectedMarket.symbol.replace("/", "")}`}
          className="w-full h-full"
          frameBorder="0"
          title={`TradingView Chart ${selectedMarket.symbol}`}
        />
      </div>
    </div>
  );
}

