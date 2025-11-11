// AI-Service Integration für Marktanalysen

import { TechnicalIndicators, AnalysisResult } from "./types";

/**
 * Generiert AI-Analyse basierend auf technischen Indikatoren
 * @param indicators Technische Indikatoren
 * @param marketData Aktuelle Marktdaten
 * @returns AnalysisResult
 */
export async function generateAIAnalysis(
  indicators: TechnicalIndicators,
  marketData: { symbol: string; price: number; change24h: number; volume24h: number }
): Promise<AnalysisResult> {
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // Wenn keine AI-API konfiguriert, verwende regelbasierte Analyse
  if (!openaiKey && !anthropicKey) {
    return generateRuleBasedAnalysis(indicators, marketData);
  }

  // OpenAI Integration
  if (openaiKey) {
    try {
      return await generateOpenAIAnalysis(indicators, marketData, openaiKey);
    } catch (error) {
      console.error("OpenAI error, using rule-based analysis:", error);
      return generateRuleBasedAnalysis(indicators, marketData);
    }
  }

  // Anthropic Claude Integration
  if (anthropicKey) {
    try {
      return await generateClaudeAnalysis(indicators, marketData, anthropicKey);
    } catch (error) {
      console.error("Claude error, using rule-based analysis:", error);
      return generateRuleBasedAnalysis(indicators, marketData);
    }
  }

  return generateRuleBasedAnalysis(indicators, marketData);
}

/**
 * Generiert Analyse mit OpenAI GPT
 */
async function generateOpenAIAnalysis(
  indicators: TechnicalIndicators,
  marketData: { symbol: string; price: number; change24h: number; volume24h: number },
  apiKey: string
): Promise<AnalysisResult> {
  const prompt = `You are a professional crypto chart analyst. Analyze the following market data:

Symbol: ${marketData.symbol}
Price: $${marketData.price}
24h Change: ${marketData.change24h.toFixed(2)}%
Volume: ${marketData.volume24h.toLocaleString()}

Technical Indicators:
- RSI: ${indicators.rsi}
- MACD: ${indicators.macd.value} (Signal: ${indicators.macd.signal}, Histogram: ${indicators.macd.histogram})
- EMA 50: ${indicators.ema.ema50}
- EMA 200: ${indicators.ema.ema200}
- Volume Spike: ${indicators.volume.spike ? "Yes" : "No"}
${indicators.liquidationZones && indicators.liquidationZones.length > 0 ? `- Liquidation Zones: ${indicators.liquidationZones.length} zones identified (${indicators.liquidationZones.slice(0, 3).map(z => `${z.type === "long" ? "Long" : "Short"} @ $${z.price.toFixed(2)} (${(z.intensity * 100).toFixed(0)}% intensity)`).join(", ")})` : ""}

Provide a short, precise analysis with:
1. Tendency: Bullish, Neutral or Bearish
2. Risk: low, medium or high
3. Reasoning: 2-3 sentences in English

Respond in JSON format:
{
  "tendency": "Bullish|Neutral|Bearish",
  "risk": "low|medium|high",
  "reasoning": "Reasoning here"
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional crypto chart analyst. Always respond in JSON format.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API Error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);

  return {
    tendency: content.tendency,
    risk: content.risk,
    reasoning: content.reasoning,
    indicators: {
      rsi: indicators.rsi,
      macd: indicators.macd.value > indicators.macd.signal ? "Positive" : "Negative",
      ema: indicators.ema.ema50 > indicators.ema.ema200 ? "Above EMA 50 & 200" : "Below EMA 50 & 200",
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generiert Analyse mit Anthropic Claude
 */
async function generateClaudeAnalysis(
  indicators: TechnicalIndicators,
  marketData: { symbol: string; price: number; change24h: number; volume24h: number },
  apiKey: string
): Promise<AnalysisResult> {
  // TODO: Claude API Integration
  // Ähnlich wie OpenAI, aber mit Claude API Format
  return generateRuleBasedAnalysis(indicators, marketData);
}

/**
 * Regelbasierte Analyse (Fallback wenn keine AI-API verfügbar)
 */
function generateRuleBasedAnalysis(
  indicators: TechnicalIndicators,
  marketData: { symbol: string; price: number; change24h: number; volume24h: number }
): AnalysisResult {
  let tendency: "Bullish" | "Neutral" | "Bearish" = "Neutral";
  let risk: "low" | "medium" | "high" = "medium";
  let reasoning = "";

  // RSI Analyse
  const rsiBullish = indicators.rsi > 50 && indicators.rsi < 70;
  const rsiBearish = indicators.rsi < 50 && indicators.rsi > 30;
  const rsiOverbought = indicators.rsi > 70;
  const rsiOversold = indicators.rsi < 30;

  // MACD Analyse
  const macdBullish = indicators.macd.value > indicators.macd.signal && indicators.macd.histogram > 0;
  const macdBearish = indicators.macd.value < indicators.macd.signal && indicators.macd.histogram < 0;

  // EMA Analyse
  const emaBullish = indicators.ema.ema50 > indicators.ema.ema200;
  const emaBearish = indicators.ema.ema50 < indicators.ema.ema200;

  // Volumen Analyse
  const volumeBullish = indicators.volume.spike && marketData.change24h > 0;

  // Liquidation Zones Analyse
  const liquidationZones = indicators.liquidationZones || [];
  const longLiquidationZones = liquidationZones.filter(z => z.type === "long" && z.price < marketData.price);
  const shortLiquidationZones = liquidationZones.filter(z => z.type === "short" && z.price > marketData.price);
  const highIntensityZones = liquidationZones.filter(z => z.intensity > 0.7);
  const nearbyLongLiquidation = longLiquidationZones.some(z => Math.abs(z.price - marketData.price) / marketData.price < 0.02);
  const nearbyShortLiquidation = shortLiquidationZones.some(z => Math.abs(z.price - marketData.price) / marketData.price < 0.02);

  // Tendenz bestimmen
  const bullishSignals = [rsiBullish, macdBullish, emaBullish, volumeBullish].filter(Boolean).length;
  const bearishSignals = [rsiBearish, macdBearish, emaBearish].filter(Boolean).length;

  // Berücksichtige Liquidationszonen in der Analyse
  let liquidationContext = "";
  if (liquidationZones.length > 0) {
    if (nearbyLongLiquidation && longLiquidationZones.length > 0) {
      liquidationContext = ` Strong long liquidation zone detected below current price at $${longLiquidationZones[0].price.toFixed(2)} (${(longLiquidationZones[0].intensity * 100).toFixed(0)}% intensity). This could trigger a bounce or further downside pressure.`;
      if (bearishSignals > 0) risk = "high";
    } else if (nearbyShortLiquidation && shortLiquidationZones.length > 0) {
      liquidationContext = ` Strong short liquidation zone detected above current price at $${shortLiquidationZones[0].price.toFixed(2)} (${(shortLiquidationZones[0].intensity * 100).toFixed(0)}% intensity). This could trigger a pullback or further upside momentum.`;
      if (bullishSignals > 0) risk = "high";
    } else if (highIntensityZones.length > 0) {
      liquidationContext = ` ${highIntensityZones.length} high-intensity liquidation zone${highIntensityZones.length > 1 ? "s" : ""} identified. Monitor these levels for potential price reactions.`;
    }
  }

  if (bullishSignals >= 3) {
    tendency = "Bullish";
    risk = rsiOverbought ? "high" : "medium";
    reasoning = `Strong upward trend detected. RSI at ${indicators.rsi.toFixed(1)}, MACD positive, EMA trend bullish. ${indicators.volume.spike ? "Volume spike confirms the movement." : ""}${liquidationContext}`;
  } else if (bearishSignals >= 2) {
    tendency = "Bearish";
    risk = rsiOversold ? "low" : "medium";
    reasoning = `Downward trend visible. RSI at ${indicators.rsi.toFixed(1)}, MACD negative, EMA trend bearish.${liquidationContext}`;
  } else {
    tendency = "Neutral";
    risk = "medium";
    reasoning = `Market shows mixed signals. RSI at ${indicators.rsi.toFixed(1)}, indicators are inconsistent. Waiting for clear direction.${liquidationContext}`;
  }

  return {
    tendency,
    risk,
    reasoning,
    indicators: {
      rsi: indicators.rsi,
      macd: macdBullish ? "Positive" : "Negative",
      ema: emaBullish ? "Above EMA 50 & 200" : "Below EMA 50 & 200",
    },
    timestamp: new Date().toISOString(),
  };
}

