import {
  TextRecognitionResult,
  ParsedNutritionTable,
  parseNutritionTableSpatial,
  DynamicNutrientItem,
  NutrientItem,
  NutritionFacts,
  fuzzyMatchKeyName,
  NutrientCategory,
  cleanAndParseNumber,
} from "./nutritionFactsParser";

export interface FusedNutritionResult {
  facts: NutritionFacts;
  table: ParsedNutritionTable;
  fusedText: string;
  frameCount: number;
}

/**
 * Evaluates the signal-to-noise clarity score of an OCR frame.
 * Single-character tokens (e.g. "g", "u", "9") or garbage non-words degrade frame quality score.
 */
export function evaluateFrameQuality(result: TextRecognitionResult): number {
  if (!result || !result.text || !result.text.trim()) return 0;

  const tokens = result.text.trim().split(/\s+/);
  if (tokens.length === 0) return 0;

  let validTokens = 0;
  let noiseTokens = 0;

  tokens.forEach(tok => {
    const cleaned = tok.replace(/[^a-zA-Z0-9]/g, "");
    if (cleaned.length === 0) return;

    if (cleaned.length === 1 && !/^\d$/.test(cleaned)) {
      noiseTokens += 2;
    } else if (/^\(?([E|e],[0-9]i?)\)?$/.test(tok) || tok.toUpperCase() === "WITHIN" || /^[gG]+$/.test(tok)) {
      noiseTokens += 3;
    } else if (fuzzyMatchKeyName(tok) || /\d+(g|mg|mcg|kcal|kj|%)?/i.test(tok) || cleaned.length >= 3) {
      validTokens += 2;
    } else {
      validTokens += 1;
    }
  });

  const total = validTokens + noiseTokens;
  if (total === 0) return 0;
  return validTokens / total;
}

/**
 * Multi-Frame OCR Voting & Fusion Engine:
 * Combines 3 to 5 rapid consecutive OCR snapshots over ~300ms.
 * - Filters out high-noise blurry frames before multi-frame voting.
 * - Clusters nutrient items across frames based on canonical key name or fuzzy similarity.
 * - Takes the highest completeness / confidence entry for each nutrient.
 * - Filters out transient OCR noise or orphan "Item" rows appearing in only 1 frame.
 */
export function fuseOcrResults(results: TextRecognitionResult[]): FusedNutritionResult {
  if (!results || results.length === 0) {
    const emptyFacts: NutritionFacts = { unit: "unknown", tableItems: [], dynamicItems: [], rawIngredients: [] };
    return {
      facts: emptyFacts,
      table: {
        items: [],
        dynamicItems: [],
        rawIngredients: [],
        unit: "unknown",
        facts: emptyFacts,
        rows: [],
      },
      fusedText: "",
      frameCount: 0,
    };
  }

  // 1. High-Noise Frame Filtering
  const scoredResults = results.map(r => ({ result: r, quality: evaluateFrameQuality(r) }));
  const validFrames = scoredResults.filter(f => f.quality >= 0.40).map(f => f.result);

  // If 2 out of 3 frames are blurred/corrupt, drop them and rely only on the single highest-clarity frame
  const activeResults = validFrames.length > 0 
    ? validFrames 
    : [results.slice().sort((a, b) => evaluateFrameQuality(b) - evaluateFrameQuality(a))[0]];

  // Parse active high-clarity frames independently with spatial layout analyzer
  const parsedTables = activeResults.map(r => parseNutritionTableSpatial(r));

  // Combine raw text & ingredients across active frames
  const allTexts = activeResults.map(r => r.text || "").filter(t => t.trim().length > 0);
  const fusedText = allTexts.join("\n---\n");

  const ingredientLists = parsedTables.map(t => t.rawIngredients);
  const bestIngredients = ingredientLists.reduce((best, curr) => (curr.length > best.length ? curr : best), []);

  // Determine overall unit basis
  const unitCounts: Record<string, number> = { per100g: 0, perServing: 0, unknown: 0 };
  parsedTables.forEach(t => {
    unitCounts[t.unit] = (unitCounts[t.unit] || 0) + 1;
  });
  const finalUnit: "per100g" | "perServing" | "unknown" =
    unitCounts["per100g"] >= unitCounts["perServing"] && unitCounts["per100g"] > 0
      ? "per100g"
      : unitCounts["perServing"] > 0
      ? "perServing"
      : "unknown";

  // 2. Cluster Dynamic Nutrient Items across active frames
  interface ItemCluster {
    canonicalName: string;
    normalizedKey?: NutrientCategory;
    candidates: { item: DynamicNutrientItem; frameIdx: number; score: number }[];
  }

  const clusters: Map<string, ItemCluster> = new Map();

  parsedTables.forEach((table, frameIdx) => {
    table.dynamicItems.forEach(item => {
      const fuzzyRes = fuzzyMatchKeyName(item.rawName);
      const canonicalName = fuzzyRes ? fuzzyRes.canonicalName : item.rawName;
      const normalizedKey = fuzzyRes?.category || item.normalizedKey;
      const clusterKey = canonicalName.toLowerCase();

      // Calculate completeness score for candidate
      let score = 1;
      if (item.unit) score += 2;
      if (item.numericValue !== null && !isNaN(item.numericValue)) score += 2;
      if (item.rawValueStr && item.rawValueStr.includes(".")) score += 1;
      if (canonicalName !== "Item") score += 3;

      if (!clusters.has(clusterKey)) {
        clusters.set(clusterKey, {
          canonicalName,
          normalizedKey,
          candidates: [],
        });
      }

      clusters.get(clusterKey)!.candidates.push({ item, frameIdx, score });
    });
  });

  // 3. Perform Voting & Noise Filtering across clusters
  const finalDynamicItems: DynamicNutrientItem[] = [];
  const finalTableItems: NutrientItem[] = [];

  const totalFrames = parsedTables.length;

  clusters.forEach((cluster) => {
    const appearanceCount = cluster.candidates.length;

    // Filter out orphan "Item" rows or single-occurrence noise if totalFrames >= 2
    if (totalFrames >= 2 && cluster.canonicalName === "Item" && appearanceCount < 2) {
      return;
    }
    if (totalFrames >= 3 && appearanceCount === 1 && cluster.canonicalName === "Item") {
      return;
    }

    // Select highest scoring candidate from cluster
    cluster.candidates.sort((a, b) => b.score - a.score);
    const bestCandidate = cluster.candidates[0].item;

    let finalNumericVal = bestCandidate.numericValue;
    if (bestCandidate.rawValueStr) {
      finalNumericVal = cleanAndParseNumber(bestCandidate.rawValueStr, bestCandidate.unit || undefined);
    }

    const finalItem: DynamicNutrientItem = {
      rawName: cluster.canonicalName,
      numericValue: finalNumericVal,
      unit: bestCandidate.unit,
      rawValueStr: bestCandidate.rawValueStr,
      normalizedKey: cluster.normalizedKey,
      columnHeader: bestCandidate.columnHeader,
    };

    finalDynamicItems.push(finalItem);

    if (cluster.normalizedKey && cluster.normalizedKey !== "other") {
      if (!finalTableItems.some(i => i.normalizedKey === cluster.normalizedKey)) {
        const numVal = finalNumericVal ?? 0;
        finalTableItems.push({
          rawKey: cluster.canonicalName,
          rawValue: bestCandidate.rawValueStr,
          normalizedKey: cluster.normalizedKey,
          numericValue: numVal,
          unitStr: bestCandidate.unit || undefined,
          valueInGramsOrMg: numVal,
        });
      }
    }
  });

  // 4. Construct legacy macro facts
  const getCatVal = (cat: NutrientCategory): number | undefined => {
    const match = finalTableItems.find(i => i.normalizedKey === cat);
    return match ? match.numericValue : undefined;
  };

  const facts: NutritionFacts = {
    calories: getCatVal("calories"),
    sugar: getCatVal("sugar"),
    sodium: getCatVal("sodium"),
    saturatedFat: getCatVal("saturatedFat"),
    totalFat: getCatVal("totalFat"),
    unit: finalUnit,
    tableItems: finalTableItems,
    dynamicItems: finalDynamicItems,
    rawIngredients: bestIngredients,
  };

  return {
    facts,
    table: {
      items: finalTableItems,
      dynamicItems: finalDynamicItems,
      rawIngredients: bestIngredients,
      unit: finalUnit,
      facts,
      rows: parsedTables[0]?.rows || [],
    },
    fusedText,
    frameCount: activeResults.length,
  };
}
