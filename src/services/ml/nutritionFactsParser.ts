export interface NutritionFacts {
  calories?: number;
  sugar?: number; // grams
  sodium?: number; // grams
  saturatedFat?: number; // grams
  totalFat?: number; // grams
  unit: "per100g" | "perServing" | "unknown";
  tableItems?: NutrientItem[];
  dynamicItems?: DynamicNutrientItem[];
  rawIngredients?: string[];
}

export interface BoundingBox {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Frame {
  width: number;
  height: number;
  top: number;
  left: number;
}

export interface TextElement {
  text: string;
  frame?: Frame;
}

export interface TextLine {
  text: string;
  frame?: Frame;
  elements?: TextElement[];
}

export interface TextBlock {
  text: string;
  frame?: Frame;
  lines: TextLine[];
}

export interface TextRecognitionResult {
  text: string;
  blocks: TextBlock[];
}

export interface SpatialElement {
  text: string;
  box: BoundingBox;
  lineIndex?: number;
  blockIndex?: number;
}

export interface SpatialRow {
  elements: SpatialElement[];
  box: BoundingBox;
  centerY: number;
}

export type NutrientCategory =
  | "calories"
  | "sugar"
  | "sodium"
  | "saturatedFat"
  | "totalFat"
  | "protein"
  | "carbohydrates"
  | "fiber"
  | "transFat"
  | "calcium"
  | "minerals"
  | "other";

export interface NutrientItem {
  rawKey: string;
  rawValue: string;
  normalizedKey: NutrientCategory;
  numericValue?: number;
  unitStr?: string;
  valueInGramsOrMg?: number;
}

export interface DynamicNutrientItem {
  rawName: string;
  numericValue: number | null;
  unit: string | null;
  rawValueStr: string;
  columnHeader?: string;
  normalizedKey?: NutrientCategory;
}

export interface ParsedNutritionTable {
  items: NutrientItem[];
  dynamicItems: DynamicNutrientItem[];
  rawIngredients: string[];
  unit: "per100g" | "perServing" | "unknown";
  facts: NutritionFacts;
  rows: SpatialRow[];
}

const isDev = false;

/**
 * Calculates Levenshtein distance between two strings for OCR typo matching.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

export interface CanonicalKeyDef {
  canonicalName: string;
  category?: NutrientCategory;
  aliases: string[];
}

export const CANONICAL_KEYS: CanonicalKeyDef[] = [
  {
    canonicalName: "Energy",
    category: "calories",
    aliases: ["energy", "ehergy", "enery", "enegy", "energi", "kcal", "kj"],
  },
  {
    canonicalName: "Total Carbohydrates",
    category: "carbohydrates",
    aliases: ["total carbohydrate", "total carbohydrates", "tota carbohyarate", "carbohyarate", "carbohydrat", "carbs"],
  },
  {
    canonicalName: "Added Sugar",
    category: "sugar",
    aliases: ["added sugar", "added sugars", "of which added sugars", "includes added sugars"],
  },
  {
    canonicalName: "Total Sugar",
    category: "sugar",
    aliases: ["total sugar", "total sugars", "tota suga", "tota sugar", "sugars", "naturaly accuing"],
  },
  {
    canonicalName: "Total Milk Fat",
    category: "totalFat",
    aliases: ["total milk fat", "tota mik tat", "tota milk fat", "milk fat", "mik tat"],
  },
  {
    canonicalName: "Saturated Fat",
    category: "saturatedFat",
    aliases: ["saturated fat", "saturated fatty acids", "saturated taty acits", "saturated fatty", "sat fat", "saturates"],
  },
  {
    canonicalName: "Sodium",
    category: "sodium",
    aliases: ["sodium", "sodium n", "sodium (na)", "salt"],
  },
  {
    canonicalName: "Protein",
    category: "protein",
    aliases: ["protein", "proteines", "proteina"],
  },
  {
    canonicalName: "Total Fat",
    category: "totalFat",
    aliases: ["total fat", "tota fat", "fat"],
  },
  {
    canonicalName: "Dietary Fiber",
    category: "fiber",
    aliases: ["dietary fiber", "fiber", "fibres", "fibra"],
  },
  {
    canonicalName: "Trans Fat",
    category: "transFat",
    aliases: ["trans fat", "trans fatty acids", "trans fatty", "trans-fat"],
  },
  {
    canonicalName: "Calcium",
    category: "calcium",
    aliases: ["calcium", "calcium (ca)", "ca"],
  },
  {
    canonicalName: "Minerals",
    category: "minerals",
    aliases: ["minerals", "ash", "mineral"],
  },
];

/**
 * Fuzzy Key Recovery Matcher
 */
export function fuzzyMatchKeyName(rawKey: string): { canonicalName: string; category?: NutrientCategory } | null {
  if (!rawKey || !rawKey.trim()) return null;

  const cleaned = cleanKeyName(rawKey).toLowerCase();
  if (cleaned.length <= 1) return null;

  for (const def of CANONICAL_KEYS) {
    for (const alias of def.aliases) {
      if (cleaned === alias) {
        return { canonicalName: def.canonicalName, category: def.category };
      }
    }
  }

  const rawWords = cleaned.split(/\s+/);

  for (const def of CANONICAL_KEYS) {
    for (const alias of def.aliases) {
      const aliasWords = alias.split(/\s+/);
      if (rawWords.length === aliasWords.length) {
        let allWordsMatch = true;
        for (let w = 0; w < rawWords.length; w++) {
          const wDist = levenshteinDistance(rawWords[w], aliasWords[w]);
          const maxWDist = aliasWords[w].length <= 3 ? 0 : aliasWords[w].length <= 6 ? 1 : 2;
          if (wDist > maxWDist) {
            allWordsMatch = false;
            break;
          }
        }
        if (allWordsMatch) {
          return { canonicalName: def.canonicalName, category: def.category };
        }
      }
    }
  }

  return null;
}

/**
 * Sanitizes OCR text specifically for numeric and unit misreads in food packaging.
 */
export function sanitizeOcrToken(text: string): string {
  if (!text) return "";

  let cleaned = text.trim();

  cleaned = cleaned.replace(/(\d),(\d)/g, "$1.$2");
  cleaned = cleaned.replace(/(^|\b)[OoQ](?=g\b|mg\b|mcg\b|µg\b|ug\b|\d|\.|\b)/gi, "0");
  cleaned = cleaned.replace(/(\d)[OoQ]/gi, "$10");
  cleaned = cleaned.replace(/(^|\b)[Ss](?=g\b|mg\b|mcg\b|µg\b|ug\b|\d|\.)/g, "5");
  cleaned = cleaned.replace(/(\d)[Ss](?=g\b|mg\b|mcg\b|µg\b|ug\b|\b)/gi, "$15");
  cleaned = cleaned.replace(/(^|\b|[|])[Il|](?=\d|\.|g\b|mg\b|mcg\b|µg\b|ug\b)/g, "1");
  cleaned = cleaned.replace(/(\d+)[l|](?=\d|\.|\b)/g, "$11");

  return cleaned;
}

/**
 * Clean and parse numeric value with unit conversion.
 */
export function cleanAndParseNumber(numStr: string, unitStr?: string): number {
  const sanitized = sanitizeOcrToken(numStr);
  const val = parseFloat(sanitized.replace(/,/g, "."));
  if (isNaN(val)) return 0;
  return val;
}

/**
 * Decimal Point Recovery & Realistic Value Sanitizer
 */
export function recoverDecimalValue(
  rawStr: string,
  parsedVal: number,
  unitStr?: string,
  keyName?: string
): { val: number; unitStr?: string; rawStr: string } {
  let val = parsedVal;
  let finalUnit = unitStr;
  let finalRaw = rawStr;

  const lowerKey = (keyName || "").toLowerCase();
  const isMacroOrMineral =
    !keyName ||
    ["sugar", "fat", "saturated", "milk fat", "protein", "carbohydrate", "carb", "mineral", "ash"].some(cat =>
      lowerKey.includes(cat)
    );

  if (isMacroOrMineral) {
    const decimalMatch = rawStr.match(/^(\d+\.\d)[98]$/);
    if (decimalMatch || /^(\d+\.\d)[98]$/.test(parsedVal.toString())) {
      const floatStr = decimalMatch ? decimalMatch[1] : parsedVal.toString().slice(0, -1);
      const floatVal = parseFloat(floatStr);
      if (!isNaN(floatVal)) {
        val = floatVal;
        finalUnit = "g";
        finalRaw = `${val}g`;
        return { val, unitStr: finalUnit, rawStr: finalRaw };
      }
    }
  }

  const numOnlyStr = rawStr.replace(/[^0-9]/g, "");

  if (isMacroOrMineral && !rawStr.includes(".") && !rawStr.includes(",")) {
    const digitsOnly = parseInt(numOnlyStr, 10);
    if (!isNaN(digitsOnly)) {
      if (
        (lowerKey.includes("mineral") || lowerKey.includes("ash") || lowerKey.includes("micro")) &&
        digitsOnly >= 60 &&
        digitsOnly <= 99
      ) {
        val = Math.floor(digitsOnly / 10) / 10;
        finalUnit = "g";
        finalRaw = `${val}g`;
        return { val, unitStr: finalUnit, rawStr: finalRaw };
      }

      if (numOnlyStr.length >= 2 && numOnlyStr.length <= 4) {
        const lastChar = numOnlyStr.slice(-1);
        if (["9", "8", "2"].includes(lastChar) && (!finalUnit || ["9", "8", "2"].includes(finalUnit))) {
          const prefixDigits = numOnlyStr.slice(0, -1);
          const numValPrefix = parseFloat(prefixDigits);
          if (!isNaN(numValPrefix) && numValPrefix >= 10 && numValPrefix <= 99) {
            val = numValPrefix / 10;
            finalUnit = "g";
            finalRaw = `${val}g`;
            return { val, unitStr: finalUnit, rawStr: finalRaw };
          }
        }
      }

      if (digitsOnly === 37 || digitsOnly === 35) {
        val = digitsOnly / 10;
        finalUnit = "g";
        finalRaw = `${val}g`;
        return { val, unitStr: finalUnit, rawStr: finalRaw };
      }

      if (digitsOnly >= 100 && digitsOnly <= 999 && digitsOnly % 100 !== 0 && (lowerKey.includes("sat") || lowerKey.includes("fat"))) {
        val = digitsOnly / 100;
        finalUnit = finalUnit || "g";
        finalRaw = `${val}${finalUnit}`;
        return { val, unitStr: finalUnit, rawStr: finalRaw };
      }
    }
  }

  return { val, unitStr: finalUnit, rawStr: finalRaw };
}

/**
 * Helper to construct a normalized BoundingBox from ML Kit frame object.
 */
export function createBoundingBox(frame: Frame): BoundingBox {
  const left = frame.left ?? 0;
  const top = frame.top ?? 0;
  const width = Math.max(1, frame.width ?? 0);
  const height = Math.max(1, frame.height ?? 0);
  const right = left + width;
  const bottom = top + height;
  const centerX = left + width / 2;
  const centerY = top + height / 2;

  return { left, top, width, height, right, bottom, centerX, centerY };
}

/**
 * Extracts word/token-level SpatialElements from ML Kit OCR results.
 */
export function extractSpatialElements(result: TextRecognitionResult): SpatialElement[] {
  const elements: SpatialElement[] = [];

  if (!result || !result.blocks) return elements;

  result.blocks.forEach((block, bIdx) => {
    if (!block.lines) return;

    block.lines.forEach((line, lIdx) => {
      if (line.elements && line.elements.length > 0) {
        line.elements.forEach(elem => {
          if (!elem.text || !elem.text.trim()) return;
          const frame = elem.frame || line.frame || { left: 0, top: 0, width: 100, height: 20 };
          elements.push({
            text: elem.text.trim(),
            box: createBoundingBox(frame),
            lineIndex: lIdx,
            blockIndex: bIdx,
          });
        });
      } else if (line.text && line.text.trim()) {
        const lineText = line.text.trim();
        const lineFrame = line.frame || { left: 0, top: 0, width: 200, height: 20 };
        const tokens = lineText.split(/\s+/).filter(t => t.length > 0);

        if (tokens.length === 1) {
          elements.push({
            text: tokens[0],
            box: createBoundingBox(lineFrame),
            lineIndex: lIdx,
            blockIndex: bIdx,
          });
        } else {
          const totalChars = lineText.length;
          let currentOffsetChar = 0;

          tokens.forEach(token => {
            const tokenStartRatio = currentOffsetChar / totalChars;
            const tokenWidthRatio = token.length / totalChars;

            const tokenLeft = lineFrame.left + lineFrame.width * tokenStartRatio;
            const tokenWidth = lineFrame.width * tokenWidthRatio;

            elements.push({
              text: token,
              box: createBoundingBox({
                left: tokenLeft,
                top: lineFrame.top,
                width: Math.max(1, tokenWidth),
                height: lineFrame.height,
              }),
              lineIndex: lIdx,
              blockIndex: bIdx,
            });

            currentOffsetChar += token.length + 1;
          });
        }
      }
    });
  });

  return elements;
}

/**
 * Calculates vertical overlap ratio between two bounding boxes.
 */
export function calculateVerticalOverlapRatio(boxA: BoundingBox, boxB: BoundingBox): number {
  const topMax = Math.max(boxA.top, boxB.top);
  const bottomMin = Math.min(boxA.bottom, boxB.bottom);
  const intersectionHeight = Math.max(0, bottomMin - topMax);
  const minHeight = Math.min(boxA.height, boxB.height);

  if (minHeight <= 0) return 0;
  return intersectionHeight / minHeight;
}

/**
 * Strict Dynamic Row Grouping Algorithm
 */
export function groupElementsIntoRows(elements: SpatialElement[]): SpatialRow[] {
  if (!elements || elements.length === 0) return [];

  const sorted = [...elements].sort((a, b) => a.box.top - b.box.top);
  const rows: SpatialRow[] = [];

  sorted.forEach(elem => {
    let bestRow: SpatialRow | null = null;
    let maxOverlap = 0;

    for (const row of rows) {
      const minElemHeight = Math.min(...row.elements.map(e => e.box.height));
      const centerDiff = Math.abs(elem.box.centerY - row.centerY);

      const overlapRatio = Math.max(...row.elements.map(e => calculateVerticalOverlapRatio(elem.box, e.box)));
      const isCenterClose = centerDiff <= minElemHeight * 0.5;

      if ((overlapRatio >= 0.25 || isCenterClose) && centerDiff <= minElemHeight * 0.75) {
        if (overlapRatio > maxOverlap || !bestRow) {
          maxOverlap = overlapRatio;
          bestRow = row;
        }
      }
    }

    if (bestRow) {
      bestRow.elements.push(elem);

      const sumCenterY = bestRow.elements.reduce((sum, e) => sum + e.box.centerY, 0);
      bestRow.centerY = sumCenterY / bestRow.elements.length;

      const left = Math.min(...bestRow.elements.map(e => e.box.left));
      const top = Math.min(...bestRow.elements.map(e => e.box.top));
      const right = Math.max(...bestRow.elements.map(e => e.box.right));
      const bottom = Math.max(...bestRow.elements.map(e => e.box.bottom));
      const width = right - left;
      const height = bottom - top;
      const centerX = left + width / 2;

      bestRow.box = { left, top, width, height, right, bottom, centerX, centerY: bestRow.centerY };
    } else {
      rows.push({
        elements: [elem],
        box: { ...elem.box },
        centerY: elem.box.centerY,
      });
    }
  });

  rows.forEach(row => {
    row.elements.sort((a, b) => a.box.left - b.box.left);
  });

  rows.sort((a, b) => a.box.top - b.box.top);

  return rows;
}

/**
 * Same-Row Horizontal Token Re-stitching
 */
export function restitchRowTokens(elements: SpatialElement[]): SpatialElement[] {
  if (!elements || elements.length <= 1) return elements;

  const result: SpatialElement[] = [];
  let i = 0;

  while (i < elements.length) {
    const current = elements[i];
    if (i + 1 < elements.length) {
      const next = elements[i + 1];
      const currText = current.text.trim();
      const nextText = next.text.trim();

      const isCurrNumeric = /^[\d.,]+$/.test(currText) || /^.*?[\d.,]+$/.test(currText);
      const isNextUnitOrDigit = /^(mg|g|mcg|µg|ug|kcal|kj|%|iu|\d|\d+[a-zA-Z]+)$/i.test(nextText);
      const horizontalGap = next.box.left - current.box.right;

      if (isCurrNumeric && isNextUnitOrDigit && horizontalGap <= Math.max(current.box.height * 1.5, 35) && horizontalGap >= -10) {
        const mergedText = `${currText}${nextText}`;
        const mergedBox = {
          left: current.box.left,
          top: Math.min(current.box.top, next.box.top),
          width: next.box.right - current.box.left,
          height: Math.max(current.box.height, next.box.height),
          right: next.box.right,
          bottom: Math.max(current.box.bottom, next.box.bottom),
          centerX: (current.box.left + next.box.right) / 2,
          centerY: (current.box.centerY + next.box.centerY) / 2,
        };

        result.push({
          text: mergedText,
          box: mergedBox,
          lineIndex: current.lineIndex,
          blockIndex: current.blockIndex,
        });

        i += 2;
        continue;
      }
    }

    result.push(current);
    i++;
  }

  return result;
}

const KEYWORD_MAP: Record<NutrientCategory, string[]> = {
  calories: ["calories", "energy", "energia", "kcal", "kj"],
  sugar: ["of which sugars", "sugars", "total sugars", "sugar", "sucre", "azucares", "naturally occurring sugar"],
  sodium: ["sodium", "salt", "sal", "sel", "na", "sodium (na)"],
  saturatedFat: ["of which saturates", "saturated fat", "saturated fatty acids", "saturated", "sat fat", "sat. fat", "acides gras satures"],
  totalFat: ["total fat", "fat", "lipides", "grasas", "fat/lipides", "total milk fat", "milk fat"],
  protein: ["protein", "proteines", "proteina"],
  carbohydrates: ["carbohydrate", "carbohydrates", "total carb", "total carbohydrate", "carbs", "glucides"],
  fiber: ["dietary fiber", "fiber", "fibres", "fibra"],
  transFat: ["trans fat", "trans fatty acids", "trans fatty"],
  calcium: ["calcium", "calcium (ca)", "ca"],
  minerals: ["minerals", "mineral"],
  other: [],
};

const KNOWN_UNITS = ["mg", "mcg", "µg", "ug", "g", "kcal", "kj", "iu", "%", "mmol"];

/**
 * Universal Value & Unit Matcher
 */
export function extractNumericValue(text: string): { rawStr: string; val: number; unitStr?: string } | null {
  if (!text) return null;
  const sanitized = sanitizeOcrToken(text);

  const match =
    sanitized.match(/^([0-9]+(?:[\.,][0-9]+)?)\s*([a-zA-Z%µ]+)?$/i) ||
    sanitized.match(/([\d.,]+)\s*(mg|mcg|µg|ug|g|kcal|kj|iu|%|mmol)?\b/i);

  if (match && match[1]) {
    const val = parseFloat(match[1].replace(/,/g, "."));
    if (isNaN(val)) return null;
    return {
      rawStr: match[0],
      val,
      unitStr: match[2] ? match[2] : undefined,
    };
  }
  return null;
}

/**
 * Clean key label text by stripping leader dots, dashes, colons, and stray punctuation.
 */
export function cleanKeyName(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/^[^a-zA-Z0-9(]+/, "")
    .replace(/[:;-]+$/, "")
    .replace(/\.{2,}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Robust Raw Ingredient Block Parser
 */
export function extractFullIngredientList(rawText: string): string[] {
  if (!rawText || !rawText.trim()) return [];

  const text = rawText.replace(/\r\n/g, "\n");
  const lowerText = text.toLowerCase();

  const headers = ["ingredients:", "ingredients", "composition:", "contains:"];
  let startIndex = -1;
  let matchedHeaderLength = 0;

  for (const h of headers) {
    const idx = lowerText.indexOf(h);
    if (idx !== -1) {
      if (startIndex === -1 || idx < startIndex) {
        startIndex = idx;
        matchedHeaderLength = h.length;
      }
    }
  }

  let ingredientBlock = text;
  if (startIndex !== -1) {
    ingredientBlock = text.substring(startIndex + matchedHeaderLength);
  }

  const stopHeaders = ["nutrition facts", "nutrition information", "storage:", "manufactured by", "batch no"];
  let stopIndex = ingredientBlock.length;
  const lowerBlock = ingredientBlock.toLowerCase();

  for (const sh of stopHeaders) {
    const idx = lowerBlock.indexOf(sh);
    if (idx !== -1 && idx < stopIndex) {
      stopIndex = idx;
    }
  }

  ingredientBlock = ingredientBlock.substring(0, stopIndex).trim();

  const ingredients: string[] = [];
  let currentToken = "";
  let bracketDepth = 0;

  for (let i = 0; i < ingredientBlock.length; i++) {
    const char = ingredientBlock[i];

    if (char === "(" || char === "[" || char === "{") {
      bracketDepth++;
      currentToken += char;
    } else if (char === ")" || char === "]" || char === "}") {
      if (bracketDepth > 0) bracketDepth--;
      currentToken += char;
    } else if ((char === "," || char === ";" || char === "•" || char === "*") && bracketDepth === 0) {
      const trimmed = cleanIngredientToken(currentToken);
      if (trimmed) ingredients.push(trimmed);
      currentToken = "";
    } else if (char === "." && ingredientBlock[i + 1] === " " && bracketDepth === 0) {
      const trimmed = cleanIngredientToken(currentToken);
      if (trimmed) ingredients.push(trimmed);
      currentToken = "";
      i++; // skip the space
    } else if (char === "\n" && bracketDepth === 0) {
      if (currentToken.endsWith(":")) {
        currentToken = "";
      } else {
        currentToken += " ";
      }
    } else {
      currentToken += char;
    }
  }

  const lastTrimmed = cleanIngredientToken(currentToken);
  if (lastTrimmed) ingredients.push(lastTrimmed);

  return ingredients;
}

function cleanIngredientToken(token: string): string {
  let cleaned = token
    .replace(/^[•\*\-\s.:;]+/, "")
    .replace(/[.:;\s]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  cleaned = cleaned.replace(/^ingredients\s*:\s*/i, "");

  if (cleaned.length <= 1) return "";
  return cleaned;
}

/**
 * Primary Schema-Less Spatial Table Analyzer & Parser with Strict Key Anchor Enforcement & Multi-Column Clustering.
 */
export function parseNutritionTableSpatial(result: TextRecognitionResult): ParsedNutritionTable {
  const elements = extractSpatialElements(result);
  const rows = groupElementsIntoRows(elements);

  const fullText = (result.text || elements.map(e => e.text).join(" ")).toLowerCase();

  let unit: "per100g" | "perServing" | "unknown" = "unknown";
  if (
    fullText.includes("per 100") ||
    fullText.includes("/100g") ||
    fullText.includes("/100 g") ||
    fullText.includes("100g basis") ||
    fullText.includes("100 g basis")
  ) {
    unit = "per100g";
  } else if (
    fullText.includes("per serving") ||
    fullText.includes("serving size") ||
    fullText.includes("per container") ||
    fullText.includes("per pack")
  ) {
    unit = "perServing";
  }

  const items: NutrientItem[] = [];
  const dynamicItems: DynamicNutrientItem[] = [];
  const rawIngredients = extractFullIngredientList(result.text || "");

  if (isDev) {
    console.log(`[NutritionParser] Total Spatial Elements: ${elements.length}, Grouped Rows: ${rows.length}`);
  }

  rows.forEach((row, rIdx) => {
    if (!row.elements || row.elements.length === 0) return;

    row.elements = restitchRowTokens(row.elements);

    const rowTokens = row.elements.map(e => e.text);
    const rowText = rowTokens.join(" ").trim();
    const lowerRowText = rowText.toLowerCase();

    if (
      lowerRowText === "nutrition facts" ||
      lowerRowText === "nutrition information" ||
      lowerRowText === "typical values" ||
      lowerRowText === "amount per serving"
    ) {
      return;
    }

    const numericIndices: number[] = [];
    const numericMatches: { val: number; unitStr?: string; rawStr: string }[] = [];

    row.elements.forEach((elem, i) => {
      const parsed = extractNumericValue(elem.text);
      if (parsed !== null) {
        let matchedUnit = parsed.unitStr;
        let matchedRaw = parsed.rawStr;

        if (!matchedUnit && i + 1 < row.elements.length) {
          const nextText = row.elements[i + 1].text.toLowerCase().trim();
          if (KNOWN_UNITS.includes(nextText)) {
            matchedUnit = nextText;
            matchedRaw = `${parsed.val}${nextText}`;
          }
        }

        numericIndices.push(i);
        numericMatches.push({
          val: parsed.val,
          unitStr: matchedUnit,
          rawStr: matchedRaw,
        });
      }
    });

    if (numericIndices.length === 0) return;

    let primaryRowKey = "";
    let primaryCategoryOverride: NutrientCategory | undefined;

    for (let k = 0; k < numericIndices.length; k++) {
      const numIdx = numericIndices[k];
      const numMatch = numericMatches[k];
      const prevNumIdx = k > 0 ? numericIndices[k - 1] : -1;

      const keyTokens = row.elements.slice(prevNumIdx + 1, numIdx).map(e => e.text);
      let rawKeyStr = keyTokens.join(" ");

      if (!rawKeyStr && numIdx === 0) {
        const elemText = row.elements[0].text;
        const matchPos = elemText.indexOf(numMatch.rawStr);
        if (matchPos > 0) {
          rawKeyStr = elemText.substring(0, matchPos);
        }
      }

      let keyName = cleanKeyName(rawKeyStr);
      let categoryOverride: NutrientCategory | undefined;

      const fuzzyRes = fuzzyMatchKeyName(keyName);
      if (fuzzyRes) {
        keyName = fuzzyRes.canonicalName;
        categoryOverride = fuzzyRes.category;
      }

      if (k === 0) {
        primaryRowKey = keyName;
        primaryCategoryOverride = categoryOverride;
      } else if (!keyName && primaryRowKey) {
        keyName = primaryRowKey;
        categoryOverride = primaryCategoryOverride;
      }

      // Filter out unanchored generic orphan "Item" rows & single-character noise (e.g. "g g", "(E,6i", "WITHIN")
      if (!keyName || keyName === "Item") {
        continue;
      }

      const alphaOnly = keyName.replace(/[^a-zA-Z]/g, "").toLowerCase();
      if (
        alphaOnly.length <= 1 ||
        alphaOnly === "gg" ||
        alphaOnly === "e6i" ||
        alphaOnly === "within" ||
        alphaOnly === "item"
      ) {
        continue;
      }

      const columnHeader = k === 0 ? "Per 100g" : k === 1 ? "Per Serving" : "% DV";
      const recovered = recoverDecimalValue(numMatch.rawStr, numMatch.val, numMatch.unitStr, keyName);

      if (isDev) {
        console.log(`[NutritionParser] Row #${rIdx + 1} item ${k + 1} (${columnHeader}): "${keyName}" -> ${recovered.val}${recovered.unitStr || ""}`);
      }

      dynamicItems.push({
        rawName: keyName,
        numericValue: recovered.val,
        unit: recovered.unitStr || null,
        rawValueStr: recovered.rawStr,
        columnHeader,
        normalizedKey: categoryOverride,
      });

      (Object.keys(KEYWORD_MAP) as NutrientCategory[]).forEach(category => {
        if (category === "other") return;
        const keywords = KEYWORD_MAP[category];
        if (categoryOverride === category || keywords.some(kw => keyName.toLowerCase().includes(kw))) {
          if (!items.some(it => it.normalizedKey === category)) {
            let finalVal = cleanAndParseNumber(recovered.rawStr, recovered.unitStr);
            if (category === "sodium" && keyName.toLowerCase().includes("salt") && !recovered.unitStr?.toLowerCase().includes("mg")) {
              finalVal = finalVal / 2.5;
            }
            items.push({
              rawKey: keyName,
              rawValue: recovered.rawStr,
              normalizedKey: category,
              numericValue: finalVal,
              unitStr: recovered.unitStr,
              valueInGramsOrMg: finalVal,
            });
          }
        }
      });
    }
  });

  const getCategoryVal = (cat: NutrientCategory): number | undefined => {
    const item = items.find(i => i.normalizedKey === cat);
    return item ? item.numericValue : undefined;
  };

  let calories = getCategoryVal("calories");
  let sugar = getCategoryVal("sugar");
  let sodium = getCategoryVal("sodium");
  let saturatedFat = getCategoryVal("saturatedFat");
  let totalFat = getCategoryVal("totalFat");

  if (calories !== undefined && calories > 500 && fullText.includes("kj")) {
    if (calories > 800) {
      calories = Math.round(calories / 4.184);
    }
  }

  if (sugar !== undefined && (sugar > 100 || sugar < 0)) sugar = undefined;
  if (sodium !== undefined && (sodium > 10 || sodium < 0)) sodium = undefined;
  if (saturatedFat !== undefined && (saturatedFat > 100 || saturatedFat < 0)) saturatedFat = undefined;
  if (totalFat !== undefined && (totalFat > 100 || totalFat < 0)) totalFat = undefined;
  if (calories !== undefined && (calories > 1500 || calories < 0)) calories = undefined;

  const facts: NutritionFacts = {
    calories,
    sugar,
    sodium,
    saturatedFat,
    totalFat,
    unit,
    tableItems: items,
    dynamicItems,
    rawIngredients,
  };

  return {
    items,
    dynamicItems,
    rawIngredients,
    unit,
    facts,
    rows,
  };
}

/**
 * Main Entry Point
 */
export function parseNutritionFacts(input: string | TextRecognitionResult): NutritionFacts {
  if (typeof input === "string") {
    return parseNutritionFactsFromStringFallback(input);
  }

  const parsedTable = parseNutritionTableSpatial(input);
  return parsedTable.facts;
}

/**
 * Fallback parser using regex proximity scanner
 */
function parseNutritionFactsFromStringFallback(rawText: string): NutritionFacts {
  const lowerText = rawText.toLowerCase();

  let calories: number | undefined;
  let sugar: number | undefined;
  let sodium: number | undefined;
  let saturatedFat: number | undefined;
  let totalFat: number | undefined;
  let unit: "per100g" | "perServing" | "unknown" = "unknown";

  if (
    lowerText.includes("per 100") ||
    lowerText.includes("/100g") ||
    lowerText.includes("/100 g") ||
    lowerText.includes("100g basis") ||
    lowerText.includes("100 g basis")
  ) {
    unit = "per100g";
  } else if (
    lowerText.includes("per serving") ||
    lowerText.includes("serving size") ||
    lowerText.includes("per container") ||
    lowerText.includes("per pack")
  ) {
    unit = "perServing";
  }

  const findValueNearKeyword = (keywords: string[], text: string, isSodiumOrSalt: boolean = false): number | undefined => {
    for (const keyword of keywords) {
      let pos = text.indexOf(keyword);
      while (pos !== -1) {
        const sub = text.substring(pos + keyword.length, pos + keyword.length + 45);
        const sanitizedSub = sanitizeOcrToken(sub);
        const match = extractNumericValue(sanitizedSub);
        if (match) {
          let val = cleanAndParseNumber(match.rawStr, match.unitStr);
          if (isSodiumOrSalt && keyword.includes("salt") && !match.unitStr?.toLowerCase().includes("mg")) {
            val = val / 2.5;
          }
          return val;
        }
        pos = text.indexOf(keyword, pos + 1);
      }
    }
    return undefined;
  };

  calories = findValueNearKeyword(["calories", "energy", "kcal"], lowerText);
  if (calories !== undefined && calories > 500 && lowerText.includes("kj")) {
    if (calories > 800) {
      calories = Math.round(calories / 4.184);
    }
  }

  sugar = findValueNearKeyword(["of which sugars", "sugars", "sugar"], lowerText);
  sodium = findValueNearKeyword(["sodium", "salt"], lowerText, true);
  saturatedFat = findValueNearKeyword(["of which saturates", "saturated fat", "saturated", "sat fat"], lowerText);
  totalFat = findValueNearKeyword(["total fat", "fat"], lowerText);

  if (sugar !== undefined && (sugar > 100 || sugar < 0)) sugar = undefined;
  if (sodium !== undefined && (sodium > 10 || sodium < 0)) sodium = undefined;
  if (saturatedFat !== undefined && (saturatedFat > 100 || saturatedFat < 0)) saturatedFat = undefined;
  if (totalFat !== undefined && (totalFat > 100 || totalFat < 0)) totalFat = undefined;
  if (calories !== undefined && (calories > 1500 || calories < 0)) calories = undefined;

  const rawIngredients = extractFullIngredientList(rawText);

  return { calories, sugar, sodium, saturatedFat, totalFat, unit, rawIngredients };
}

/**
 * Extracts percentage patterns from the ingredients list (e.g. "Sugar (12%)")
 */
export function parseIngredientPercentages(rawText: string): { ingredient: string; percentage: number }[] {
  const results: { ingredient: string; percentage: number }[] = [];
  const regex = /([^,.:;()\r\n]+?)\s*\(([\d.]+)%\)/g;
  let match;
  while ((match = regex.exec(rawText)) !== null) {
    const ingredient = match[1].trim();
    const percentage = parseFloat(match[2]);
    if (ingredient && !isNaN(percentage)) {
      results.push({ ingredient, percentage });
    }
  }
  return results;
}
