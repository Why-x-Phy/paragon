// TypeScript Types für Paragon AI

export interface AnalysisResult {
  tendency: "Bullish" | "Neutral" | "Bearish";
  risk: "low" | "medium" | "high";
  reasoning: string;
  indicators: {
    rsi: number;
    macd: string;
    ema: string;
    volume?: number;
    priceChange?: number;
  };
  timestamp: string;
  // Erweiterte Felder für detaillierte Analyse
  detailedIndicators?: {
    rsi: {
      value: number;
      status: string;
    };
    macd: {
      value: number;
      signal: number;
      histogram: number;
      trend: string;
    };
    ema: {
      ema13: number;
      ema50: number;
      ema200: number;
      ema800: number;
      trend: string;
    };
    volume: {
      current: number;
      average: number;
      spike: boolean;
      ratio: number;
    };
    liquidationZones?: {
      price: number;
      intensity: number;
      type: "long" | "short";
      liquidationAmount: number;
    }[];
  };
  marketData?: {
    price: number;
    change24h: number;
    volume24h: number;
    high24h: number;
    low24h: number;
  };
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
  liquidationZones?: {
    price: number;
    intensity: number;
    type: "long" | "short";
    liquidationAmount: number; // Liquidationssumme in USD
  }[];
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

// Binance API Response Types
export interface BinanceCandle {
  0: number; // timestamp
  1: string; // open
  2: string; // high
  3: string; // low
  4: string; // close
  5: string; // volume
  6: number; // close time
  7: string; // quote asset volume
  8: number; // number of trades
  9: string; // taker buy base asset volume
  10: string; // taker buy quote asset volume
  11: string; // ignore
}

export interface BinanceTickerResponse {
  symbol: string;
  lastPrice: string;
  highPrice: string;
  lowPrice: string;
  priceChangePercent: string;
  volume: string;
}

