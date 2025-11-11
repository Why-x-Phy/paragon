// Marktdaten von verschiedenen APIs holen

import { MarketData } from "./types";

/**
 * Holt Marktdaten von Dexscreener API
 * @param symbol z.B. "BTC/USDT"
 * @returns MarketData oder null
 */
export async function fetchDexscreenerData(symbol: string): Promise<MarketData | null> {
  try {
    // Dexscreener API - kostenlos, keine API-Key erforderlich
    // Format: BTC/USDT -> BTCUSDT
    const pairSymbol = symbol.replace("/", "");
    
    // Für Demo verwenden wir eine Mock-Response
    // In Produktion: const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    
    // Mock-Daten für Demo
    return {
      symbol,
      price: 45000 + Math.random() * 1000,
      change24h: (Math.random() - 0.5) * 10,
      volume24h: 1000000000 + Math.random() * 500000000,
      high24h: 46000,
      low24h: 44000,
    };
  } catch (error) {
    console.error("Fehler beim Abrufen von Dexscreener-Daten:", error);
    return null;
  }
}

/**
 * Holt Marktdaten von Binance API
 * @param symbol z.B. "BTCUSDT"
 * @returns MarketData oder null
 */
export async function fetchBinanceData(symbol: string): Promise<MarketData | null> {
  try {
    // Binance Public API - kein API-Key erforderlich für ticker/24hr
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
      {
        next: { revalidate: 10 }, // Cache für 10 Sekunden
      }
    );

    if (!response.ok) {
      console.error(`Binance API Error: ${response.status} ${response.statusText}`);
      // Fallback zu Mock-Daten nur wenn API komplett fehlschlägt
      console.warn("Binance API fehlgeschlagen, verwende Fallback-Daten");
      return fetchDexscreenerData(symbol);
    }

    const data = await response.json();

    return {
      symbol: data.symbol,
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent),
      volume24h: parseFloat(data.volume),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
    };
  } catch (error) {
    console.error("Fehler beim Abrufen von Binance-Daten:", error);
    // Fallback zu Mock-Daten nur bei Netzwerkfehler
    console.warn("Verwende Fallback-Daten aufgrund eines Fehlers");
    return fetchDexscreenerData(symbol);
  }
}

/**
 * Holt historische Preis-Daten für Indikator-Berechnung
 * @param symbol z.B. "BTCUSDT"
 * @param interval z.B. "1h", "4h", "1d"
 * @param limit Anzahl der Candles (Standard: 200)
 */
export async function fetchHistoricalData(
  symbol: string,
  interval: string = "1h",
  limit: number = 200
): Promise<Array<{ timestamp: number; open: number; high: number; low: number; close: number; volume: number }> | null> {
  try {
    // Binance Klines API
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Binance API Error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.map((candle: any[]) => ({
      timestamp: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
    }));
  } catch (error) {
    console.error("Fehler beim Abrufen historischer Daten:", error);
    return null;
  }
}

