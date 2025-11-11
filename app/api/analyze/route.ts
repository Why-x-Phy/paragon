import { NextRequest, NextResponse } from "next/server";
import { fetchBinanceData, fetchHistoricalData } from "@/lib/marketData";
import { calculateRSI, calculateMACD, calculateEMA, detectVolumeSpike, calculateLiquidationZones } from "@/lib/indicators";
import { generateAIAnalysis } from "@/lib/aiService";
import { TechnicalIndicators } from "@/lib/types";
import { client, PARA_TOKEN_ADDRESS, BASE_CHAIN_ID } from "@/lib/thirdweb";
import { getContract } from "thirdweb/contract";
import { balanceOf } from "thirdweb/extensions/erc20";
import { defineChain } from "thirdweb/chains";

const baseChain = defineChain(BASE_CHAIN_ID);

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

    // Prüfe Token-Balance: 1 Token = 1 Credit
    const contract = getContract({
      client,
      chain: baseChain,
      address: PARA_TOKEN_ADDRESS,
    });

    const balance = await balanceOf({
      contract,
      address: walletAddress as `0x${string}`,
    });

    const tokenBalance = Number(balance) / 1e18;
    const credits = Math.floor(tokenBalance);

    if (credits < 1) {
      return NextResponse.json(
        { error: "Insufficient credits. Please purchase more PARA tokens. 1 Token = 1 Credit." },
        { status: 403 }
      );
    }

    // TODO: Optional - Tokens abbrennen/transferieren nach erfolgreicher Analyse (1 Token pro Analyse)

    // Hole Marktdaten
    const symbol = market.replace("/", ""); // BTC/USDT -> BTCUSDT
    const marketData = await fetchBinanceData(symbol);

    if (!marketData) {
      return NextResponse.json(
        { error: "Could not fetch market data" },
        { status: 500 }
      );
    }

    // Hole historische Daten für Indikatoren
    // Konvertiere selectedInterval (z.B. "15") zu Binance interval (z.B. "15m")
    const binanceInterval = interval === "1" ? "1m" : 
                            interval === "5" ? "5m" : 
                            interval === "15" ? "15m" : 
                            interval === "60" ? "1h" : 
                            interval === "240" ? "4h" : 
                            interval === "D" ? "1d" : "15m"; // Default: 15m
    
    const historicalData = await fetchHistoricalData(symbol, binanceInterval, 200);

    if (!historicalData || historicalData.length < 50) {
      return NextResponse.json(
        { error: "Insufficient historical data available" },
        { status: 500 }
      );
    }

    // Berechne Indikatoren
    const closes = historicalData.map((d) => d.close);
    const volumes = historicalData.map((d) => d.volume);
    const highs = historicalData.map((d) => d.high);
    const lows = historicalData.map((d) => d.low);

    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 200);
    const volumeSpike = detectVolumeSpike(volumes);
    const liquidationZones = calculateLiquidationZones(closes, volumes, highs, lows);

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
          ema800: calculateEMA(closes, 800),
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
        price: marketData.price,
        change24h: marketData.change24h,
        volume24h: marketData.volume24h,
        high24h: marketData.high24h,
        low24h: marketData.low24h,
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

