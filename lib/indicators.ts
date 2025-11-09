// Technische Indikatoren-Berechnung

export interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Berechnet den RSI (Relative Strength Index)
 * @param prices Array von Schlusskursen
 * @param period Standard: 14
 * @returns RSI Wert (0-100)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // Neutral wenn nicht genug Daten
  }

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return Math.round(rsi * 100) / 100;
}

/**
 * Berechnet MACD (Moving Average Convergence Divergence)
 * @param prices Array von Schlusskursen
 * @param fastPeriod Standard: 12
 * @param slowPeriod Standard: 26
 * @param signalPeriod Standard: 9
 */
export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number; signal: number; histogram: number } {
  if (prices.length < slowPeriod + signalPeriod) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  const emaFast = calculateEMA(prices, fastPeriod);
  const emaSlow = calculateEMA(prices, slowPeriod);
  const macd = emaFast - emaSlow;

  // Signal Line (EMA von MACD)
  const macdValues = [macd];
  const signal = calculateEMA(macdValues, signalPeriod);
  const histogram = macd - signal;

  return {
    macd: Math.round(macd * 100) / 100,
    signal: Math.round(signal * 100) / 100,
    histogram: Math.round(histogram * 100) / 100,
  };
}

/**
 * Berechnet EMA (Exponential Moving Average)
 * @param prices Array von Werten
 * @param period Anzahl der Perioden
 * @returns EMA Wert
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices[prices.length - 1] || 0;
  }

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return Math.round(ema * 100) / 100;
}

/**
 * Prüft ob Volumen-Spike vorhanden
 * @param volumes Array von Volumen-Werten
 * @param threshold Multiplikator für Durchschnitt (Standard: 1.5)
 * @returns true wenn Spike erkannt
 */
export function detectVolumeSpike(volumes: number[], threshold: number = 1.5): boolean {
  if (volumes.length < 2) return false;

  const avgVolume = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1);
  const currentVolume = volumes[volumes.length - 1];

  return currentVolume > avgVolume * threshold;
}

