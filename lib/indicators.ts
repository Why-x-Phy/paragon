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

  // Berechne EMA Fast und EMA Slow für alle Perioden
  // Wichtig: EMAs müssen sequenziell berechnet werden (jeder Wert hängt vom vorherigen ab)
  const emaFastValues: number[] = [];
  const emaSlowValues: number[] = [];
  
  // Berechne EMA Fast sequenziell
  for (let i = fastPeriod - 1; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    emaFastValues.push(calculateEMA(slice, fastPeriod));
  }
  
  // Berechne EMA Slow sequenziell
  for (let i = slowPeriod - 1; i < prices.length; i++) {
    const slice = prices.slice(0, i + 1);
    emaSlowValues.push(calculateEMA(slice, slowPeriod));
  }

  // Berechne MACD-Werte (nur wo beide EMAs verfügbar sind)
  // Starte ab dem Punkt, wo beide EMAs verfügbar sind (nach slowPeriod)
  const macdValues: number[] = [];
  const offset = slowPeriod - fastPeriod; // Offset zwischen Fast und Slow EMA
  
  // Beide EMAs sind ab slowPeriod verfügbar
  // Fast EMA hat mehr Werte (startet früher), Slow EMA hat weniger Werte
  for (let i = 0; i < emaSlowValues.length; i++) {
    const fastIdx = offset + i; // Fast EMA Index (offset wegen früherem Start)
    if (fastIdx >= 0 && fastIdx < emaFastValues.length) {
      macdValues.push(emaFastValues[fastIdx] - emaSlowValues[i]);
    }
  }

  // Aktuelle MACD-Werte (letzte Werte)
  const macd = macdValues.length > 0 ? macdValues[macdValues.length - 1] : 0;

  // Signal Line (EMA von MACD-Werten über signalPeriod)
  // Die Signal Line ist eine EMA der MACD-Werte
  const signal = macdValues.length >= signalPeriod 
    ? calculateEMA(macdValues, signalPeriod)
    : macdValues.length > 0 
      ? macdValues.reduce((a, b) => a + b, 0) / macdValues.length 
      : macd;
  
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

/**
 * Berechnet Liquidationszonen basierend auf Preisbewegungen, Volumen und Support/Resistance
 * @param prices Array von Schlusskursen
 * @param volumes Array von Volumen-Werten
 * @param highs Array von Höchstkursen
 * @param lows Array von Tiefstkursen
 * @returns Liquidationszonen mit Preisniveaus, Intensität und Liquidationssumme
 */
export function calculateLiquidationZones(
  prices: number[],
  volumes: number[],
  highs: number[],
  lows: number[]
): { price: number; intensity: number; type: "long" | "short"; liquidationAmount: number }[] {
  if (prices.length < 20) {
    return [];
  }

  const zones: { price: number; intensity: number; type: "long" | "short"; liquidationAmount: number }[] = [];
  const currentPrice = prices[prices.length - 1];
  const priceRange = Math.max(...highs) - Math.min(...lows);
  const zoneSize = priceRange * 0.02; // 2% des Preisbereichs pro Zone

  // Identifiziere Support- und Resistance-Levels
  const supportLevels: number[] = [];
  const resistanceLevels: number[] = [];

  // Finde lokale Minima (Support) und Maxima (Resistance)
  for (let i = 2; i < prices.length - 2; i++) {
    const isLocalMin = prices[i] < prices[i - 1] && prices[i] < prices[i - 2] &&
                       prices[i] < prices[i + 1] && prices[i] < prices[i + 2];
    const isLocalMax = prices[i] > prices[i - 1] && prices[i] > prices[i - 2] &&
                       prices[i] > prices[i + 1] && prices[i] > prices[i + 2];

    if (isLocalMin && prices[i] < currentPrice) {
      supportLevels.push(prices[i]);
    }
    if (isLocalMax && prices[i] > currentPrice) {
      resistanceLevels.push(prices[i]);
    }
  }

  // Berechne durchschnittliche Volumen für Intensitäts-Bewertung
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

  // Erstelle Liquidationszonen für Support-Levels (Long-Liquidations)
  supportLevels.forEach((level) => {
    const nearbyVolumes = volumes.filter((_, idx) => 
      Math.abs(prices[idx] - level) < zoneSize
    );
    const zoneVolume = nearbyVolumes.length > 0 
      ? nearbyVolumes.reduce((a, b) => a + b, 0) / nearbyVolumes.length 
      : 0;
    
    const intensity = Math.min(1, (zoneVolume / avgVolume) * 0.5 + 0.3);
    
    // Berechne Liquidationssumme: Volumen in der Zone * Preis * Intensitäts-Faktor
    // Verwende einen Multiplikator basierend auf der Intensität, um realistische Liquidationssummen zu schätzen
    // Typischerweise sind Liquidationssummen 0.1-5% des Handelsvolumens in der Zone
    const liquidationMultiplier = intensity * 0.02; // 0-2% des Volumens
    const liquidationAmount = zoneVolume * level * liquidationMultiplier;
    
    if (intensity > 0.3 && liquidationAmount > 10000) { // Nur große Cluster (> $10k)
      zones.push({
        price: level,
        intensity,
        type: "long",
        liquidationAmount
      });
    }
  });

  // Erstelle Liquidationszonen für Resistance-Levels (Short-Liquidations)
  resistanceLevels.forEach((level) => {
    const nearbyVolumes = volumes.filter((_, idx) => 
      Math.abs(prices[idx] - level) < zoneSize
    );
    const zoneVolume = nearbyVolumes.length > 0 
      ? nearbyVolumes.reduce((a, b) => a + b, 0) / nearbyVolumes.length 
      : 0;
    
    const intensity = Math.min(1, (zoneVolume / avgVolume) * 0.5 + 0.3);
    
    // Berechne Liquidationssumme: Volumen in der Zone * Preis * Intensitäts-Faktor
    const liquidationMultiplier = intensity * 0.02; // 0-2% des Volumens
    const liquidationAmount = zoneVolume * level * liquidationMultiplier;
    
    if (intensity > 0.3 && liquidationAmount > 10000) { // Nur große Cluster (> $10k)
      zones.push({
        price: level,
        intensity,
        type: "short",
        liquidationAmount
      });
    }
  });

  // Sortiere nach Liquidationssumme (höchste zuerst)
  zones.sort((a, b) => b.liquidationAmount - a.liquidationAmount);

  // Nimm die Top 5 Liquidationszonen
  return zones.slice(0, 5);
}

