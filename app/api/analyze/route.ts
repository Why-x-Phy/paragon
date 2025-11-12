import { NextRequest, NextResponse } from "next/server";
import { fetchBinanceData, fetchHistoricalData } from "@/lib/marketData";
import { calculateRSI, calculateMACD, calculateEMA, detectVolumeSpike, calculateLiquidationZones } from "@/lib/indicators";
import { generateAIAnalysis } from "@/lib/aiService";
import { TechnicalIndicators } from "@/lib/types";
import { client, PARA_TOKEN_ADDRESS, BASE_CHAIN_ID } from "@/lib/thirdweb";
import { getContract } from "thirdweb/contract";
import { balanceOf } from "thirdweb/extensions/erc20";
import { defineChain } from "thirdweb/chains";
import { checkRateLimit } from "@/lib/rateLimit";

const baseChain = defineChain(BASE_CHAIN_ID);

// Deaktiviere Caching für diese Route - immer frische Daten
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { market, walletAddress, interval } = body;

    // Validation
    if (!market || !walletAddress) {
      return NextResponse.json(
        { error: "Market and wallet address required" },
        { status: 400 }
      );
    }

    // Rate-Limiting: 10 Requests pro Minute pro Wallet-Adresse
    const rateLimit = checkRateLimit(walletAddress, 10, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Rate limit exceeded. Please wait before requesting another analysis.",
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetAt.toString(),
            "Retry-After": Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
          }
        }
      );
    }

    // Prüfe Token-Balance: 1 Token = 1 Credit
    // WICHTIG: Balance-Prüfung mit Retry, da nach Transfer die Balance möglicherweise noch nicht aktualisiert ist
    const contract = getContract({
      client,
      chain: baseChain,
      address: PARA_TOKEN_ADDRESS,
    });

    let balance = await balanceOf({
      contract,
      address: walletAddress as `0x${string}`,
    });

    let tokenBalance = Number(balance) / 1e18;
    let credits = Math.floor(tokenBalance);

    // Retry-Logik: Warte bis zu 3 Sekunden auf Balance-Update nach Transfer
    if (credits < 1) {
      console.log("Initial balance check failed, waiting for blockchain update...");
      for (let i = 0; i < 6; i++) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Warte 500ms
        
        balance = await balanceOf({
          contract,
          address: walletAddress as `0x${string}`,
        });
        
        tokenBalance = Number(balance) / 1e18;
        credits = Math.floor(tokenBalance);
        
        if (credits >= 1) {
          console.log(`Balance updated after ${(i + 1) * 500}ms: ${credits} credits`);
          break;
        }
      }
    }

    if (credits < 1) {
      return NextResponse.json(
        { error: `Insufficient credits. Please purchase more PARA tokens. 1 Token = 1 Credit. Current balance: ${tokenBalance.toFixed(4)} PARA.` },
        { status: 403 }
      );
    }

    // TODO: Optional - Tokens abbrennen/transferieren nach erfolgreicher Analyse (1 Token pro Analyse)

    // Hole Marktdaten - IMMER frische Daten für Analyse (forceFresh=true)
    const symbol = market.replace("/", ""); // BTC/USDT -> BTCUSDT
    const marketData = await fetchBinanceData(symbol, true); // forceFresh=true für aktuelle Daten

    if (!marketData) {
      console.error(`[analyze] Failed to fetch market data for ${symbol}`);
      return NextResponse.json(
        { error: "Could not fetch market data from Binance. Please try again." },
        { status: 500 }
      );
    }

    // Validiere, dass die 24h High/Low Werte realistisch sind
    // Warnung wenn Werte nicht passen, aber nicht blockieren (kann bei sehr volatilen Märkten passieren)
    if (marketData.high24h < marketData.price || marketData.low24h > marketData.price) {
      console.warn(`[analyze] WARNING: 24h High/Low values seem invalid!`, {
        price: marketData.price,
        high24h: marketData.high24h,
        low24h: marketData.low24h,
      });
      console.warn(`[analyze] Continuing anyway - values might be correct for volatile markets`);
      // Nicht blockieren - könnte bei sehr volatilen Märkten passieren
    }

    // Log die 24h High/Low Werte zur Validierung
    console.log(`[analyze] Market data received:`, {
      price: marketData.price,
      high24h: marketData.high24h,
      low24h: marketData.low24h,
      change24h: marketData.change24h,
    });

    // Hole historische Daten für Indikatoren - IMMER frische Daten
    // Konvertiere selectedInterval (z.B. "15") zu Binance interval (z.B. "15m")
    const binanceInterval = interval === "1" ? "1m" : 
                            interval === "5" ? "5m" : 
                            interval === "15" ? "15m" : 
                            interval === "60" ? "1h" : 
                            interval === "240" ? "4h" : 
                            interval === "D" ? "1d" : "15m"; // Default: 15m
    
    // Hole mehr Daten für genauere EMAs (besonders EMA 800)
    // Für kleinere Intervalle brauchen wir mehr Candles
    const limit = binanceInterval === "1m" ? 1000 : 
                  binanceInterval === "5m" ? 1000 : 
                  binanceInterval === "15m" ? 1000 : 
                  binanceInterval === "1h" ? 1000 : 
                  binanceInterval === "4h" ? 1000 : 
                  binanceInterval === "1d" ? 1000 : 1000; // Mehr Daten für genauere Berechnungen
    
    console.log(`[analyze] Requesting historical data for symbol: ${symbol}, interval: ${binanceInterval}, original interval: ${interval}, limit: ${limit}`);
    
    const historicalData = await fetchHistoricalData(symbol, binanceInterval, limit, true); // forceFresh=true für aktuelle Daten

    console.log(`[analyze] Historical data received:`, {
      isNull: historicalData === null,
      isArray: Array.isArray(historicalData),
      length: Array.isArray(historicalData) ? historicalData.length : 0
    });

    if (!historicalData || historicalData.length === 0) {
      console.error(`[analyze] Insufficient historical data - returning error`);
      return NextResponse.json(
        { error: `Insufficient historical data available. Symbol: ${symbol}, Interval: ${binanceInterval}, Received: ${historicalData ? historicalData.length : 0} candles.` },
        { status: 500 }
      );
    }

    console.log(`[analyze] Successfully received ${historicalData.length} candles, proceeding with analysis`);
    
    // WICHTIG: Binance API gibt Daten chronologisch zurück (älteste zuerst, neueste zuletzt)
    // Validiere die Sortierung: Der letzte Candle sollte der neueste sein
    const latestCandle = historicalData[historicalData.length - 1];
    const oldestCandle = historicalData[0];
    
    console.log(`[analyze] Raw data check - Oldest timestamp: ${new Date(oldestCandle.timestamp).toISOString()}, Latest timestamp: ${new Date(latestCandle.timestamp).toISOString()}`);
    
    // Prüfe ob die Daten korrekt sortiert sind (älteste zuerst, neueste zuletzt)
    if (oldestCandle.timestamp > latestCandle.timestamp) {
      console.warn(`[analyze] WARNING: Data appears to be reversed! Oldest timestamp (${oldestCandle.timestamp}) is newer than latest (${latestCandle.timestamp}). Reversing array...`);
      historicalData.reverse();
      // Update nach Reverse
      const newLatestCandle = historicalData[historicalData.length - 1];
      const newOldestCandle = historicalData[0];
      console.log(`[analyze] After reverse - Oldest: ${new Date(newOldestCandle.timestamp).toISOString()}, Latest: ${new Date(newLatestCandle.timestamp).toISOString()}`);
    }
    
    const validatedLatestCandle = historicalData[historicalData.length - 1];
    const validatedOldestCandle = historicalData[0];
    
    console.log(`[analyze] Validated - Oldest candle: ${new Date(validatedOldestCandle.timestamp).toISOString()}, close: ${validatedOldestCandle.close.toFixed(2)}`);
    console.log(`[analyze] Validated - Latest candle: ${new Date(validatedLatestCandle.timestamp).toISOString()}, close: ${validatedLatestCandle.close.toFixed(2)}`);
    
    // Verwende den aktuellen Preis aus den Marktdaten
    const currentPriceFromMarket = marketData.price;
    const currentPriceFromCandles = validatedLatestCandle.close;
    
    console.log(`[analyze] Current price from market data: ${currentPriceFromMarket.toFixed(2)}`);
    console.log(`[analyze] Current price from latest candle: ${currentPriceFromCandles.toFixed(2)}`);
    const priceDiff = Math.abs(currentPriceFromMarket - currentPriceFromCandles);
    const priceDiffPercent = currentPriceFromMarket > 0 ? (priceDiff / currentPriceFromMarket) * 100 : 0;
    console.log(`[analyze] Price difference: ${priceDiff.toFixed(2)} (${priceDiffPercent.toFixed(2)}%)`);
    
    // WICHTIG: Wenn die Preise stark abweichen, verwende den neueren/höheren Preis
    // (kann passieren wenn Marktdaten veraltet sind)
    if (priceDiffPercent > 10) {
      console.warn(`[analyze] WARNING: Price difference is ${priceDiffPercent.toFixed(2)}% - market data might be stale`);
    }
    
    // WICHTIG: Verwende den neueren Preis (entweder aus Marktdaten oder aus dem letzten Candle)
    // Der letzte Candle könnte neuer sein als die Marktdaten
    const latestCandlePrice = validatedLatestCandle.close;
    const actualCurrentPrice = Math.abs(currentPriceFromMarket - latestCandlePrice) < Math.abs(latestCandlePrice * 0.1) 
      ? currentPriceFromMarket // Wenn ähnlich, verwende Marktdaten
      : Math.max(currentPriceFromMarket, latestCandlePrice); // Verwende den höheren/neueren Preis
    
    console.log(`[analyze] Market data price: ${currentPriceFromMarket.toFixed(2)}`);
    console.log(`[analyze] Latest candle price: ${latestCandlePrice.toFixed(2)}`);
    console.log(`[analyze] Using actual current price: ${actualCurrentPrice.toFixed(2)}`);
    
    // Ersetze den letzten Close-Preis mit dem aktuellen Marktpreis für genauere Berechnungen
    const closes = [...historicalData.map((d) => d.close)];
    closes[closes.length - 1] = actualCurrentPrice; // Ersetze letzten Close mit aktuellem Marktpreis
    
    console.log(`[analyze] Using current market price ${actualCurrentPrice.toFixed(2)} for calculations (replaced last candle close: ${currentPriceFromCandles.toFixed(2)})`);
    console.log(`[analyze] First 3 closes (oldest): ${closes.slice(0, 3).map(p => p.toFixed(2)).join(', ')}`);
    console.log(`[analyze] Last 3 closes (newest): ${closes.slice(-3).map(p => p.toFixed(2)).join(', ')}`);
    
    // Verwende den tatsächlichen aktuellen Preis für die Analyse
    const finalCurrentPrice = actualCurrentPrice;
    
    // KRITISCH: Validiere, dass die Preise realistisch sind
    // Der aktuelle Preis sollte nahe bei den letzten Close-Preisen sein
    const recentCloses = closes.slice(-5); // Letzte 5 Close-Preise
    const avgRecentClose = recentCloses.reduce((a, b) => a + b, 0) / recentCloses.length;
    const priceDeviationFromRecent = Math.abs(currentPriceFromMarket - avgRecentClose) / currentPriceFromMarket;
    
    if (priceDeviationFromRecent > 0.1) { // Mehr als 10% Abweichung
      console.error(`[analyze] ERROR: Current price (${currentPriceFromMarket.toFixed(2)}) deviates significantly from recent closes (avg: ${avgRecentClose.toFixed(2)}). Deviation: ${(priceDeviationFromRecent * 100).toFixed(2)}%`);
      console.error(`[analyze] This suggests the data might be incorrect or from a different time period.`);
    }
    
    const volumes = historicalData.map((d) => d.volume);
    const highs = historicalData.map((d) => d.high);
    const lows = historicalData.map((d) => d.low);
    
    // Validiere, dass wir genug Daten haben für alle EMAs
    const minRequiredCandles = Math.max(200, 800); // EMA 800 benötigt mindestens 800 Candles
    if (historicalData.length < minRequiredCandles) {
      console.warn(`[analyze] Warning: Only ${historicalData.length} candles available, but ${minRequiredCandles} recommended for accurate EMAs`);
    }

    // Validiere, dass die Daten realistisch sind
    // Die letzten Close-Preise sollten nahe am aktuellen Preis sein
    const lastFewCloses = closes.slice(-10);
    const minClose = Math.min(...lastFewCloses);
    const maxClose = Math.max(...lastFewCloses);
    const priceRange = maxClose - minClose;
    
    console.log(`[analyze] Last 10 closes range: ${minClose.toFixed(2)} - ${maxClose.toFixed(2)} (range: ${priceRange.toFixed(2)})`);
    console.log(`[analyze] Current price: ${finalCurrentPrice.toFixed(2)}`);
    
    // Warnung wenn der aktuelle Preis außerhalb des Bereichs liegt, aber nicht blockieren
    // (kann passieren wenn der Markt sich schnell bewegt oder die Daten leicht veraltet sind)
    if (currentPriceFromMarket < minClose * 0.3 || currentPriceFromMarket > maxClose * 1.7) {
      console.warn(`[analyze] WARNING: Current price (${currentPriceFromMarket.toFixed(2)}) is outside the range of recent closes (${minClose.toFixed(2)} - ${maxClose.toFixed(2)})`);
      console.warn(`[analyze] This might indicate stale data. Using current market price for calculations.`);
    }
    
    // Berechne Indikatoren mit den korrigierten Daten
    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 200);
    const volumeSpike = detectVolumeSpike(volumes);
    const liquidationZones = calculateLiquidationZones(closes, volumes, highs, lows);
    
    // Validiere EMAs - sie sollten nahe am aktuellen Preis sein
    const ema13 = calculateEMA(closes, 13);
    console.log(`[analyze] Calculated EMAs: EMA13=${ema13.toFixed(2)}, EMA50=${ema50.toFixed(2)}, EMA200=${ema200.toFixed(2)}, Current Price=${finalCurrentPrice.toFixed(2)}`);
    
    // Warnung wenn EMAs stark abweichen, aber nicht blockieren
    // (kann passieren wenn der Markt sich schnell bewegt)
    const priceDeviation50 = finalCurrentPrice > 0 ? Math.abs(ema50 - finalCurrentPrice) / finalCurrentPrice : 0;
    const priceDeviation200 = finalCurrentPrice > 0 ? Math.abs(ema200 - finalCurrentPrice) / finalCurrentPrice : 0;
    
    if (priceDeviation50 > 0.5) { // Mehr als 50% Abweichung
      console.warn(`[analyze] WARNING: EMA50 (${ema50.toFixed(2)}) deviates significantly from current price (${finalCurrentPrice.toFixed(2)}). Deviation: ${(priceDeviation50 * 100).toFixed(2)}%`);
      console.warn(`[analyze] This might indicate stale historical data. Continuing with analysis using current market price.`);
    }
    if (priceDeviation200 > 0.5) {
      console.warn(`[analyze] WARNING: EMA200 (${ema200.toFixed(2)}) deviates significantly from current price (${finalCurrentPrice.toFixed(2)}). Deviation: ${(priceDeviation200 * 100).toFixed(2)}%`);
    }

    const indicators: TechnicalIndicators = {
      rsi,
      macd: {
        value: macd.macd,
        signal: macd.signal,
        histogram: macd.histogram,
      },
      ema: {
        ema50,
        ema200,
      },
      volume: {
        current: volumes[volumes.length - 1],
        average: volumes.reduce((a, b) => a + b, 0) / volumes.length,
        spike: volumeSpike,
      },
      liquidationZones,
    };

    // Generiere AI-Analyse
    const analysis = await generateAIAnalysis(indicators, marketData);

    // Erweitere Analyse mit detaillierten Indikator-Werten
    const detailedAnalysis = {
      ...analysis,
      detailedIndicators: {
        rsi: {
          value: rsi,
          status: rsi > 70 ? "Overbought" : rsi < 30 ? "Oversold" : "Neutral",
        },
        macd: {
          value: macd.macd,
          signal: macd.signal,
          histogram: macd.histogram,
          // MACD Trend: Bullish wenn MACD > Signal, Bearish wenn MACD < Signal, Neutral wenn gleich oder sehr nahe
          trend: macd.histogram > 0.0001 ? "Bullish" : macd.histogram < -0.0001 ? "Bearish" : "Neutral",
        },
        ema: {
          ema13: calculateEMA(closes, 13),
          ema50: ema50,
          ema200: ema200,
          ema800: closes.length >= 800 ? calculateEMA(closes, 800) : calculateEMA(closes, Math.min(closes.length, 200)), // Fallback wenn nicht genug Daten
          trend: ema50 > ema200 ? "Bullish" : "Bearish",
        },
        volume: {
          current: volumes[volumes.length - 1],
          average: volumes.reduce((a, b) => a + b, 0) / volumes.length,
          spike: volumeSpike,
          ratio: volumes[volumes.length - 1] / (volumes.reduce((a, b) => a + b, 0) / volumes.length),
        },
        liquidationZones: liquidationZones,
      },
      marketData: {
        price: finalCurrentPrice, // Verwende den tatsächlichen aktuellen Preis (kann aus Marktdaten oder letzten Candle sein)
        change24h: marketData.change24h,
        volume24h: marketData.volume24h,
        high24h: marketData.high24h, // 24h High direkt aus Binance API
        low24h: marketData.low24h, // 24h Low direkt aus Binance API
      },
    };

    // TODO: Speichere Analyse in Datenbank (Supabase)

    return NextResponse.json({ success: true, analysis: detailedAnalysis });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

