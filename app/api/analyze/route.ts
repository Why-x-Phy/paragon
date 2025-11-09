import { NextRequest, NextResponse } from "next/server";
import { fetchBinanceData, fetchHistoricalData } from "@/lib/marketData";
import { calculateRSI, calculateMACD, calculateEMA, detectVolumeSpike } from "@/lib/indicators";
import { generateAIAnalysis } from "@/lib/aiService";
import { TechnicalIndicators } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { market, walletAddress } = body;

    // Validierung
    if (!market || !walletAddress) {
      return NextResponse.json(
        { error: "Market und Wallet-Adresse erforderlich" },
        { status: 400 }
      );
    }

    // TODO: Prüfe Credits in Datenbank (Supabase)
    // TODO: Ziehe Credit ab nach erfolgreicher Analyse

    // Hole Marktdaten
    const symbol = market.replace("/", ""); // BTC/USDT -> BTCUSDT
    const marketData = await fetchBinanceData(symbol);

    if (!marketData) {
      return NextResponse.json(
        { error: "Marktdaten konnten nicht abgerufen werden" },
        { status: 500 }
      );
    }

    // Hole historische Daten für Indikatoren
    const historicalData = await fetchHistoricalData(symbol, "1h", 200);

    if (!historicalData || historicalData.length < 50) {
      return NextResponse.json(
        { error: "Nicht genügend historische Daten verfügbar" },
        { status: 500 }
      );
    }

    // Berechne Indikatoren
    const closes = historicalData.map((d) => d.close);
    const volumes = historicalData.map((d) => d.volume);

    const rsi = calculateRSI(closes, 14);
    const macd = calculateMACD(closes);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 200);
    const volumeSpike = detectVolumeSpike(volumes);

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
    };

    // Generiere AI-Analyse
    const analysis = await generateAIAnalysis(indicators, marketData);

    // TODO: Speichere Analyse in Datenbank (Supabase)

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Analyse-Fehler:", error);
    return NextResponse.json(
      { error: "Fehler bei der Analyse", details: error instanceof Error ? error.message : "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}

