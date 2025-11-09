// TypeScript Types für Paragon AI

export interface AnalysisResult {
  tendency: "Bullish" | "Neutral" | "Bearish";
  risk: "niedrig" | "mittel" | "hoch";
  reasoning: string;
  indicators: {
    rsi: number;
    macd: string;
    ema: string;
    volume?: number;
    priceChange?: number;
  };
  timestamp: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  ema: {
    ema50: number;
    ema200: number;
  };
  volume: {
    current: number;
    average: number;
    spike: boolean;
  };
}

export interface UserCredits {
  walletAddress: string;
  credits: number;
  lastUpdated: string;
}

export interface TokenPackage {
  tokens: number;
  price: number;
  label: string;
  popular?: boolean;
}

