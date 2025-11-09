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
    <div className="glass rounded-3xl p-10 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-white tracking-tight">Live Chart</h3>
        <div className="flex gap-3">
          {MARKETS.map((market) => (
            <button
              key={market.symbol}
              onClick={() => setSelectedMarket(market)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                selectedMarket.symbol === market.symbol
                  ? "bg-white/10 text-white border border-white/20 shadow-lg"
                  : "bg-gray-800/50 text-gray-300 hover:bg-gray-800/70 border border-white/5 hover:border-white/10"
              }`}
            >
              {market.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="w-full h-[700px] rounded-2xl overflow-hidden bg-gray-900 border border-white/10 shadow-2xl">
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

