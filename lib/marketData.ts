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
export async function fetchBinanceData(symbol: string, forceFresh: boolean = false): Promise<MarketData | null> {
  try {
    // Binance Public API - kein API-Key erforderlich für ticker/24hr
    // IMMER frische Daten holen (kein Cache)
    // Verwende KEINEN cacheBuster in der URL - kann zu Problemen führen
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
    
    console.log(`[fetchBinanceData] Fetching 24h ticker data from: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store', // KEIN Cache - immer frische Daten
      next: { revalidate: 0 }, // Kein Next.js Cache
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchBinanceData] Binance API Error: ${response.status} ${response.statusText}`);
      console.error(`[fetchBinanceData] Error response: ${errorText}`);
      // KEIN Fallback - wirf einen Fehler statt falsche Daten zu verwenden
      console.error(`[fetchBinanceData] Binance API failed - NOT using fallback data to avoid incorrect values`);
      return null;
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error(`[fetchBinanceData] Failed to parse JSON response:`, parseError);
      return null;
    }

    // Validiere, dass wir die erwarteten Felder haben
    if (!data || !data.lastPrice || !data.highPrice || !data.lowPrice) {
      console.error(`[fetchBinanceData] Invalid response data:`, data);
      return null;
    }

    // Binance API gibt highPrice und lowPrice als Strings zurück
    // Diese sind die 24h High/Low Werte
    const highPrice = parseFloat(data.highPrice);
    const lowPrice = parseFloat(data.lowPrice);
    const lastPrice = parseFloat(data.lastPrice);

    // Validiere, dass die Werte gültige Zahlen sind
    if (isNaN(highPrice) || isNaN(lowPrice) || isNaN(lastPrice)) {
      console.error(`[fetchBinanceData] Invalid numeric values:`, {
        highPrice: data.highPrice,
        lowPrice: data.lowPrice,
        lastPrice: data.lastPrice,
      });
      return null;
    }

    console.log(`[fetchBinanceData] Received data for ${symbol}:`, {
      lastPrice: data.lastPrice,
      highPrice: data.highPrice,
      lowPrice: data.lowPrice,
      priceChangePercent: data.priceChangePercent,
      parsedHighPrice: highPrice,
      parsedLowPrice: lowPrice,
      parsedLastPrice: lastPrice,
    });

    // Validiere, dass High > Low und beide im realistischen Bereich sind
    if (highPrice <= lowPrice) {
      console.warn(`[fetchBinanceData] WARNING: High price (${highPrice}) is not greater than low price (${lowPrice})`);
    }
    if (lastPrice < lowPrice || lastPrice > highPrice) {
      console.warn(`[fetchBinanceData] WARNING: Last price (${lastPrice}) is outside 24h range (${lowPrice} - ${highPrice})`);
    }

    return {
      symbol: data.symbol,
      price: lastPrice,
      change24h: parseFloat(data.priceChangePercent),
      volume24h: parseFloat(data.volume),
      high24h: highPrice,
      low24h: lowPrice,
    };
  } catch (error) {
    console.error(`[fetchBinanceData] Error fetching Binance data:`, error);
    // KEIN Fallback - wirf einen Fehler statt falsche Daten zu verwenden
    console.error(`[fetchBinanceData] Network error - NOT using fallback data to avoid incorrect values`);
    return null;
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
  limit: number = 200,
  forceFresh: boolean = false
): Promise<Array<{ timestamp: number; open: number; high: number; low: number; close: number; volume: number }> | null> {
  try {
    // Binance Klines API - Hole die neuesten Daten (endTime = jetzt)
    // Verwende endTime um sicherzustellen, dass wir die neuesten Daten bekommen
    const endTime = Date.now();
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}&endTime=${endTime}`;
    
    console.log(`[fetchHistoricalData] Fetching from: ${url}`);
    console.log(`[fetchHistoricalData] Symbol: ${symbol}, Interval: ${interval}, Limit: ${limit}, ForceFresh: ${forceFresh}`);
    
    // WICHTIG: In Next.js Server-Side müssen wir explizit 'no-store' verwenden
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: forceFresh ? 'no-store' : 'default',
    });

    console.log(`[fetchHistoricalData] Response status: ${response.status} ${response.statusText}`);
    console.log(`[fetchHistoricalData] Response ok: ${response.ok}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[fetchHistoricalData] API Error Response:`, errorText);
      throw new Error(`Binance API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // WICHTIG: Response kann nur einmal gelesen werden
    const data = await response.json();
    console.log(`[fetchHistoricalData] Response data type:`, typeof data);
    console.log(`[fetchHistoricalData] Response data is array:`, Array.isArray(data));
    console.log(`[fetchHistoricalData] Response data length:`, Array.isArray(data) ? data.length : 'N/A');
    
    if (Array.isArray(data) && data.length > 0) {
      const firstCandle = data[0];
      const lastCandle = data[data.length - 1];
      console.log(`[fetchHistoricalData] First candle (oldest): timestamp=${new Date(firstCandle[0]).toISOString()}, close=${firstCandle[4]}`);
      console.log(`[fetchHistoricalData] Last candle (newest): timestamp=${new Date(lastCandle[0]).toISOString()}, close=${lastCandle[4]}`);
      
      // Validiere, dass die Daten chronologisch sortiert sind
      if (firstCandle[0] > lastCandle[0]) {
        console.warn(`[fetchHistoricalData] WARNING: Data appears to be reversed! First timestamp (${firstCandle[0]}) is newer than last (${lastCandle[0]})`);
      }
    }

    if (!Array.isArray(data)) {
      console.error(`[fetchHistoricalData] Response is not an array:`, data);
      return null;
    }

    if (data.length === 0) {
      console.warn(`[fetchHistoricalData] Response is empty array`);
      return null;
    }

    const mappedData = data.map((candle: import("./types").BinanceCandle) => ({
      timestamp: candle[0],
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5]),
    }));

    // WICHTIG: Binance gibt Daten chronologisch zurück (älteste zuerst, neueste zuletzt)
    // Validiere die Sortierung
    if (mappedData.length > 1) {
      const firstTimestamp = mappedData[0].timestamp;
      const lastTimestamp = mappedData[mappedData.length - 1].timestamp;
      
      if (firstTimestamp > lastTimestamp) {
        console.warn(`[fetchHistoricalData] WARNING: Data is reversed! Reversing array...`);
        mappedData.reverse();
        console.log(`[fetchHistoricalData] After reverse - First: ${new Date(mappedData[0].timestamp).toISOString()}, Last: ${new Date(mappedData[mappedData.length - 1].timestamp).toISOString()}`);
      }
      
      // Log erste und letzte Preise zur Validierung
      console.log(`[fetchHistoricalData] First candle close: ${mappedData[0].close.toFixed(2)}, Last candle close: ${mappedData[mappedData.length - 1].close.toFixed(2)}`);
    }

    console.log(`[fetchHistoricalData] Successfully mapped ${mappedData.length} candles`);
    return mappedData;
  } catch (error) {
    console.error(`[fetchHistoricalData] Error caught:`, error);
    if (error instanceof Error) {
      console.error(`[fetchHistoricalData] Error message:`, error.message);
      console.error(`[fetchHistoricalData] Error stack:`, error.stack);
    }
    return null;
  }
}

