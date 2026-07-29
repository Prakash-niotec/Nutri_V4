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
  columnType?: "per100g" | "perServing" | "unknown";
  normalizedKey?: NutrientCategory;
}

export interface TableMetadata {
  servingSize?: string;
  servingsPerPack?: string;
  netWeight?: string;
}

export interface ParsedNutritionTable {
  items: NutrientItem[];
  dynamicItems: DynamicNutrientItem[];
  rawIngredients: string[];
  unit: "per100g" | "perServing" | "unknown";
  facts: NutritionFacts;
  metadata?: TableMetadata;
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
    aliases: ["energy", "ehergy", "enery", "enegy", "energi", "calories", "kcal", "kj", "energy value", "calories from fat"],
  },
  {
    canonicalName: "Total Carbohydrates",
    category: "carbohydrates",
    aliases: ["total carbohydrate", "total carbohydrates", "tota carbohyarate", "carbohyarate", "carbohydrat", "carbohydrates", "carbs", "glucides"],
  },
  {
    canonicalName: "Added Sugar",
    category: "sugar",
    aliases: ["added sugar", "added sugars", "of which added sugars", "includes added sugars", "added"],
  },
  {
    canonicalName: "Total Sugar",
    category: "sugar",
    aliases: ["total sugar", "total sugars", "tota suga", "tota sugar", "sugars", "naturaly accuing", "naturally occurring sugar", "sucre", "azucares"],
  },
  {
    canonicalName: "Total Milk Fat",
    category: "totalFat",
    aliases: ["total milk fat", "tota mik tat", "tota milk fat", "milk fat", "mik tat"],
  },
  {
    canonicalName: "Saturated Fat",
    category: "saturatedFat",
    aliases: ["saturated fat", "saturated fatty acids", "saturated taty acits", "saturated fatty", "sat fat", "sat. fat", "saturates", "acides gras satures"],
  },
  {
    canonicalName: "Trans Fat",
    category: "transFat",
    aliases: ["trans fat", "trans fatty acids", "trans fatty", "trans-fat", "transfat"],
  },
  {
    canonicalName: "Monounsaturated Fat",
    category: "totalFat",
    aliases: ["monounsaturated fat", "monounsaturated fatty acids", "monounsaturates", "mono-unsaturated fat"],
  },
  {
    canonicalName: "Polyunsaturated Fat",
    category: "totalFat",
    aliases: ["polyunsaturated fat", "polyunsaturated fatty acids", "polyunsaturates", "poly-unsaturated fat"],
  },
  {
    canonicalName: "Total Fat",
    category: "totalFat",
    aliases: ["total fat", "tota fat", "fat", "lipides", "grasas", "fat/lipides"],
  },
  {
    canonicalName: "Cholesterol",
    category: "other",
    aliases: ["cholesterol", "cholesterin", "cholestrol"],
  },
  {
    canonicalName: "Sodium",
    category: "sodium",
    aliases: ["sodium", "sodium n", "sodium (na)", "salt", "sal", "sel", "na"],
  },
  {
    canonicalName: "Protein",
    category: "protein",
    aliases: ["protein", "proteines", "proteina", "proteins"],
  },
  {
    canonicalName: "Dietary Fiber",
    category: "fiber",
    aliases: ["dietary fiber", "dietary fibre", "fiber", "fibres", "fibra", "fibre"],
  },
  {
    canonicalName: "Polyols / Sugar Alcohols",
    category: "other",
    aliases: ["polyols", "sugar alcohol", "sugar alcohols", "polyols (sugar alcohols)"],
  },
  {
    canonicalName: "Calcium",
    category: "calcium",
    aliases: ["calcium", "calcium (ca)", "ca"],
  },
  {
    canonicalName: "Iron",
    category: "minerals",
    aliases: ["iron", "iron (fe)", "fe", "ferrum"],
  },
  {
    canonicalName: "Potassium",
    category: "minerals",
    aliases: ["potassium", "potassium (k)", "k"],
  },
  {
    canonicalName: "Magnesium",
    category: "minerals",
    aliases: ["magnesium", "magnesium (mg)", "mg"],
  },
  {
    canonicalName: "Zinc",
    category: "minerals",
    aliases: ["zinc", "zinc (zn)", "zn"],
  },
  {
    canonicalName: "Minerals",
    category: "minerals",
    aliases: ["minerals", "ash", "mineral"],
  },
  {
    canonicalName: "Vitamin A",
    category: "other",
    aliases: ["vitamin a", "vit a", "retinol"],
  },
  {
    canonicalName: "Vitamin C",
    category: "other",
    aliases: ["vitamin c", "vit c", "ascorbic acid"],
  },
  {
    canonicalName: "Vitamin D",
    category: "other",
    aliases: ["vitamin d", "vit d", "vitamin d3", "cholecalciferol"],
  },
  {
    canonicalName: "Vitamin E",
    category: "other",
    aliases: ["vitamin e", "vit e", "tocopherol"],
  },
  {
    canonicalName: "Vitamin B12",
    category: "other",
    aliases: ["vitamin b12", "vit b12", "cyanocobalamin"],
  },
  {
    canonicalName: "Vitamin B6",
    category: "other",
    aliases: ["vitamin b6", "vit b6", "pyridoxine"],
  },
];

/**
 * Fuzzy Key Recovery Matcher
 */
export function fuzzyMatchKeyName(rawKey: string): { canonicalName: string; category?: NutrientCategory } | null {
  if (!rawKey || !rawKey.trim()) return null;

  const cleaned = cleanKeyName(rawKey).toLowerCase();
  if (cleaned.length <= 1) return null;

  // Direct Keyword Matching for Saturated Fat & Trans Fat sub-indented rows
  if (cleaned.includes("saturated") || cleaned.includes("saturates")) {
    return { canonicalName: "Saturated Fat", category: "saturatedFat" };
  }
  if (cleaned.includes("trans fat") || cleaned.includes("trans fatty") || cleaned.includes("trans-fat") || cleaned.includes("transfat")) {
    return { canonicalName: "Trans Fat", category: "transFat" };
  }

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
  cleaned = cleaned.replace(/(\d)[·°'`\s](\d)/g, "$1.$2");
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
 * Decimal Point Recovery, OCR '9' Fix & Realistic Value Sanitizer
 */
export function recoverDecimalValue(
  rawStr: string,
  parsedVal: number,
  unitStr?: string,
  keyName?: string
): { val: number; unitStr?: string; rawStr: string } {
  let val = parsedVal;
  let finalUnit = unitStr;

  const lowerKey = (keyName || "").toLowerCase();

  // 1. Infer default unit based on nutrient key if missing or misrecognized as '9'
  if (!finalUnit || finalUnit.trim() === "9" || finalUnit.trim() === "8") {
    if (lowerKey.includes("energy") || lowerKey.includes("calories")) {
      finalUnit = "kcal";
    } else if (lowerKey.includes("sodium") || lowerKey.includes("calcium") || lowerKey.includes("salt") || lowerKey.includes("iron") || lowerKey.includes("potassium")) {
      finalUnit = "mg";
    } else {
      finalUnit = "g";
    }
  }

  // 2. Fix unit 'g' read as '9' or '8' on single-decimal numbers (e.g. 3.59g -> 3.5g, 1.29g -> 1.2g)
  const valStr = val.toString();
  if (valStr.includes(".")) {
    const parts = valStr.split(".");
    const rawClean = rawStr.trim().toLowerCase();
    if (parts[1].length === 2 && (parts[1].endsWith("9") || parts[1].endsWith("8"))) {
      const firstDecimalDigit = parseInt(parts[1].substring(0, 1), 10);
      const secondDecimalDigit = parseInt(parts[1].substring(1, 2), 10);
      if ((secondDecimalDigit === 9 || secondDecimalDigit === 8) && (rawClean.includes("g") || !unitStr || unitStr === "g")) {
        // Exclude legitimate 2-decimal values like 0.18, 0.25, 0.75 unless rawStr explicitly had '9g'
        if (!(parts[0] === "0" && (firstDecimalDigit === 1 || firstDecimalDigit === 2 || firstDecimalDigit === 7) && secondDecimalDigit === 8)) {
          const fixed = parseFloat(`${parts[0]}.${parts[1].substring(0, 1)}`);
          if (!isNaN(fixed)) {
            val = fixed;
          }
        }
      }
    } else if (parts[1].length === 3 && (parts[1].endsWith("9") || parts[1].endsWith("8"))) {
      const fixed = parseFloat(`${parts[0]}.${parts[1].substring(0, 2)}`);
      if (!isNaN(fixed)) {
        val = fixed;
      }
    }
  }

  // 3. OCR Fix: Added Sugar '9' misrecognized from '0g' or '0'
  if (lowerKey.includes("added sugar")) {
    if (val === 9 && (rawStr.trim() === "9" || rawStr.trim() === "9g")) {
      val = 0;
      finalUnit = "g";
      return { val, unitStr: finalUnit, rawStr: "0 g" };
    }
  }

  // 4. OCR Fix: '4109' read as 4.1g for Fibre / Fat / Carbs
  if (val > 1000 && !rawStr.includes(".") && !rawStr.includes(",")) {
    const str = val.toString();
    if (str.endsWith("9") || str.endsWith("8")) {
      const floatVal = parseFloat(str.substring(0, 1) + "." + str.substring(1, 2));
      if (!isNaN(floatVal) && floatVal < 50) {
        val = floatVal;
        finalUnit = finalUnit || "g";
        return { val, unitStr: finalUnit, rawStr: `${val} ${finalUnit}` };
      }
    }
  }

  // 5. OCR Fix: Missing decimal dot on 2-digit, 3-digit, and 4-digit numbers (e.g. '79' -> 7.9g, '1146' -> 11.46g, '573' -> 57.3g)
  if (!rawStr.includes(".") && !rawStr.includes(",")) {
    const isSatOrTransOrFiber = lowerKey.includes("sat") || lowerKey.includes("trans") || lowerKey.includes("fiber") || lowerKey.includes("fibre");
    if (isSatOrTransOrFiber && val >= 25 && val <= 99) {
      val = Math.round((val / 10) * 100) / 100;
      finalUnit = finalUnit || "g";
      return { val, unitStr: finalUnit, rawStr: `${val} ${finalUnit}` };
    }

    const isMacroKey = lowerKey.includes("sugar") || lowerKey.includes("protein") || lowerKey.includes("fat") || lowerKey.includes("carb");
    if (isMacroKey && val >= 50 && val <= 99) {
      val = Math.round((val / 10) * 100) / 100;
      finalUnit = finalUnit || "g";
      return { val, unitStr: finalUnit, rawStr: `${val} ${finalUnit}` };
    }

    if (val > 100 && isMacroKey) {
      const str = val.toString();
      if (str.length === 4) {
        const floatVal = parseFloat(str.substring(0, 2) + "." + str.substring(2));
        if (!isNaN(floatVal) && floatVal <= 100) {
          val = floatVal;
          finalUnit = finalUnit || "g";
          return { val, unitStr: finalUnit, rawStr: `${val} ${finalUnit}` };
        }
      } else if (str.length === 3) {
        const floatVal = val / 10;
        if (floatVal <= 100) {
          val = floatVal;
          finalUnit = finalUnit || "g";
          return { val, unitStr: finalUnit, rawStr: `${val} ${finalUnit}` };
        }
      }
    }
  }

  val = Math.round(val * 100) / 100;
  return { val, unitStr: finalUnit, rawStr: `${val} ${finalUnit}` };
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

export const NON_NUTRIENT_HEADER_PATTERNS = [
  /serving\s*size/i,
  /servings?\s*per/i,
  /number\s*of\s*servings/i,
  /typical\s*values/i,
  /composition/i,
  /nutritional?\s*(information|facts|declaration|values)/i,
  /amount\s*per/i,
  /reference\s*intake/i,
  /daily\s*value/i,
  /guideline\s*daily/i,
  /recommended\s*(use|daily|intake)/i,
  /directions/i,
  /keep\s*refrigerated/i,
  /best\s*before/i,
  /expiry\s*date/i,
  /mfg\s*date/i,
  /batch\s*(no|number)/i,
  /net\s*(wt|weight|vol|volume|content)/i,
  /drained\s*weight/i,
  /storage/i,
  /manufactured\s*by/i,
  /distributed\s*by/i,
  /country\s*of\s*origin/i,
];

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

  const extractedMetadata: TableMetadata = {};

  rows.forEach((row, rIdx) => {
    if (!row.elements || row.elements.length === 0) return;

    row.elements = restitchRowTokens(row.elements);

    const rowTokens = row.elements.map(e => e.text);
    const rowText = rowTokens.join(" ").trim();
    const lowerRowText = rowText.toLowerCase();

    // Check non-nutrient pattern list
    const isNonNutrient = NON_NUTRIENT_HEADER_PATTERNS.some(pat => pat.test(lowerRowText));
    if (isNonNutrient) {
      if (/serving\s*size/i.test(lowerRowText) && !extractedMetadata.servingSize) {
        extractedMetadata.servingSize = rowText;
      } else if (/servings?\s*per/i.test(lowerRowText) && !extractedMetadata.servingsPerPack) {
        extractedMetadata.servingsPerPack = rowText;
      } else if (/net\s*(wt|weight|vol|volume)/i.test(lowerRowText) && !extractedMetadata.netWeight) {
        extractedMetadata.netWeight = rowText;
      }
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

      if (!keyName && k > 0 && primaryRowKey) {
        keyName = primaryRowKey;
        categoryOverride = primaryCategoryOverride;
      }

      const fuzzyRes = fuzzyMatchKeyName(keyName);
      if (fuzzyRes) {
        keyName = fuzzyRes.canonicalName;
        categoryOverride = fuzzyRes.category;
      } else {
        // Discard un-anchored non-nutrient OCR noise!
        continue;
      }

      if (k === 0) {
        primaryRowKey = keyName;
        primaryCategoryOverride = categoryOverride;
      }

      // Filter out unanchored generic orphan "Item" rows & single-character noise
      if (!keyName || keyName === "Item") {
        continue;
      }

      const alphaOnly = keyName.replace(/[^a-zA-Z]/g, "").toLowerCase();
      if (
        alphaOnly.length <= 1 ||
        alphaOnly === "gg" ||
        alphaOnly === "e6i" ||
        alphaOnly === "within" ||
        alphaOnly === "item" ||
        NON_NUTRIENT_HEADER_PATTERNS.some(p => p.test(keyName))
      ) {
        continue;
      }

      const columnHeader = k === 0 ? "Per 100g" : k === 1 ? "Per Serving" : "% DV";
      const colType: "per100g" | "perServing" | "unknown" = k === 0 ? "per100g" : k === 1 ? "perServing" : "unknown";
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
        columnType: colType,
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
    metadata: extractedMetadata,
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
