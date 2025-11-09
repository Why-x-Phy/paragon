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
      console.error("OpenAI Fehler, verwende regelbasierte Analyse:", error);
      return generateRuleBasedAnalysis(indicators, marketData);
    }
  }

  // Anthropic Claude Integration
  if (anthropicKey) {
    try {
      return await generateClaudeAnalysis(indicators, marketData, anthropicKey);
    } catch (error) {
      console.error("Claude Fehler, verwende regelbasierte Analyse:", error);
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
  const prompt = `Du bist ein professioneller Krypto-Chart-Analyst. Analysiere folgende Marktdaten:

Symbol: ${marketData.symbol}
Preis: $${marketData.price}
24h Änderung: ${marketData.change24h.toFixed(2)}%
Volumen: ${marketData.volume24h.toLocaleString()}

Technische Indikatoren:
- RSI: ${indicators.rsi}
- MACD: ${indicators.macd.value} (Signal: ${indicators.macd.signal})
- EMA 50: ${indicators.ema.ema50}
- EMA 200: ${indicators.ema.ema200}
- Volumen-Spike: ${indicators.volume.spike ? "Ja" : "Nein"}

Gib eine kurze, präzise Analyse mit:
1. Tendenz: Bullish, Neutral oder Bearish
2. Risiko: niedrig, mittel oder hoch
3. Begründung: 2-3 Sätze auf Deutsch

Antworte im JSON-Format:
{
  "tendency": "Bullish|Neutral|Bearish",
  "risk": "niedrig|mittel|hoch",
  "reasoning": "Begründung hier"
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
          content: "Du bist ein professioneller Krypto-Chart-Analyst. Antworte immer im JSON-Format.",
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
      macd: indicators.macd.value > indicators.macd.signal ? "Positiv" : "Negativ",
      ema: indicators.ema.ema50 > indicators.ema.ema200 ? "Über EMA 50 & 200" : "Unter EMA 50 & 200",
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
  let risk: "niedrig" | "mittel" | "hoch" = "mittel";
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

  // Tendenz bestimmen
  const bullishSignals = [rsiBullish, macdBullish, emaBullish, volumeBullish].filter(Boolean).length;
  const bearishSignals = [rsiBearish, macdBearish, emaBearish].filter(Boolean).length;

  if (bullishSignals >= 3) {
    tendency = "Bullish";
    risk = rsiOverbought ? "hoch" : "mittel";
    reasoning = `Starke Aufwärtstendenz erkennbar. RSI bei ${indicators.rsi.toFixed(1)}, MACD positiv, EMA-Trend bullish. ${indicators.volume.spike ? "Volumen-Spike bestätigt die Bewegung." : ""}`;
  } else if (bearishSignals >= 2) {
    tendency = "Bearish";
    risk = rsiOversold ? "niedrig" : "mittel";
    reasoning = `Abwärtstendenz sichtbar. RSI bei ${indicators.rsi.toFixed(1)}, MACD negativ, EMA-Trend bearish.`;
  } else {
    tendency = "Neutral";
    risk = "mittel";
    reasoning = `Markt zeigt gemischte Signale. RSI bei ${indicators.rsi.toFixed(1)}, Indikatoren uneinheitlich. Abwarten auf klare Richtung.`;
  }

  return {
    tendency,
    risk,
    reasoning,
    indicators: {
      rsi: indicators.rsi,
      macd: macdBullish ? "Positiv" : "Negativ",
      ema: emaBullish ? "Über EMA 50 & 200" : "Unter EMA 50 & 200",
    },
    timestamp: new Date().toISOString(),
  };
}

