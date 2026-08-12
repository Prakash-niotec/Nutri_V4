export interface NutrientMapItem {
  label: string;
  value: number;
  unit: string;
  normalizedKey?: string;
}

export interface CrossValidationMetadata {
  servingSize?: string | null;
  servingsPerPack?: string | null;
  netWeight?: string | null;
}

export interface ValidationResult {
  healedPer100gItems: NutrientMapItem[];
  healedPerServingItems: NutrientMapItem[];
  correctionsApplied: string[];
}

/**
 * Parses numeric grams or ml from serving size string (e.g., "Serving size: 20 g" -> 20)
 */
export function extractServingGrams(servingSizeStr?: string | null): number {
  if (!servingSizeStr) return 0;
  const match = servingSizeStr.match(/(\d+(?:\.\d+)?)\s*(?:g|ml|grams?|milliliters?)/i);
  if (match) {
    const val = parseFloat(match[1]);
    return isNaN(val) ? 0 : val;
  }
  return 0;
}

/**
 * Layer 3 & Layer 4 Self-Healing Engine for Nutrition Data.
 * Enforces Proportional Ratio Alignment, Sub-Nutrient Boundaries, and Atwater Energy Equivalence.
 */
export function validateAndHealNutritionData(
  per100gItems: NutrientMapItem[],
  perServingItems: NutrientMapItem[],
  metadata: CrossValidationMetadata = {}
): ValidationResult {
  const corrections: string[] = [];
  const healed100 = per100gItems.map(i => ({ ...i }));
  const healedServ = perServingItems.map(i => ({ ...i }));

  const servingGrams = extractServingGrams(metadata.servingSize);
  const expectedRatio = servingGrams > 0 && servingGrams !== 100 ? servingGrams / 100 : 0;

  // -------------------------------------------------------------
  // Layer 3A: Cross-Column Proportional Ratio Auto-Correction
  // -------------------------------------------------------------
  if (expectedRatio > 0 && healed100.length > 0 && healedServ.length > 0) {
    healed100.forEach(item100 => {
      const matchServ = healedServ.find(
        s => s.label.toLowerCase().replace(/[^a-z]/g, '') === item100.label.toLowerCase().replace(/[^a-z]/g, '')
      );

      if (matchServ && item100.value > 0 && matchServ.value > 0) {
        const observedRatio = matchServ.value / item100.value;
        const margin = Math.abs(observedRatio - expectedRatio) / expectedRatio;

        // If observed ratio deviates by > 40% from expected serving ratio
        if (margin > 0.40) {
          const recalculatedServ = Math.round(item100.value * expectedRatio * 100) / 100;
          const recalculated100 = Math.round((matchServ.value / expectedRatio) * 100) / 100;

          // Case A: Per Serving value is impossibly bloated (exceeds total serving weight, e.g. 63.2g fat in a 20g serving)
          if (servingGrams > 0 && matchServ.value > servingGrams) {
            corrections.push(
              `Auto-corrected ${matchServ.label} Per Serving from ${matchServ.value}${matchServ.unit} to ${recalculatedServ}${matchServ.unit} based on ${servingGrams}g serving ratio`
            );
            matchServ.value = recalculatedServ;
          }
          // Case B: Per 100g value is truncated (Per 100g value < Per Serving value, e.g. 4.4g Total Sugar vs 8.9g Per Serving)
          else if (item100.value < matchServ.value) {
            corrections.push(
              `Auto-corrected ${item100.label} Per 100g from ${item100.value}${item100.unit} to ${recalculated100}${item100.unit} based on ${servingGrams}g serving ratio`
            );
            item100.value = recalculated100;
          } else {
            matchServ.value = recalculatedServ;
          }
        }
      }
    });
  }

  // -------------------------------------------------------------
  // Layer 3B: Sub-Nutrient Invariant Boundary Enforcement
  // -------------------------------------------------------------
  const enforceBoundaries = (list: NutrientMapItem[], colName: string) => {
    const getItem = (keyKw: string) => list.find(i => i.label.toLowerCase().includes(keyKw));

    const carbs = getItem('carbohydrate') || getItem('carb');
    const sugar = getItem('sugar');
    const fiber = getItem('fiber') || getItem('fibre');
    const fat = getItem('fat');
    const satFat = getItem('saturated') || getItem('sat');

    // 1. Total Sugar <= Total Carbohydrates
    if (carbs && sugar && sugar.value > carbs.value && carbs.value > 0) {
      corrections.push(
        `Auto-corrected ${sugar.label} (${colName}) from ${sugar.value}g to ${carbs.value}g to respect Carbohydrate parent boundary`
      );
      sugar.value = carbs.value;
    }

    // 2. Dietary Fiber <= Total Carbohydrates
    if (carbs && fiber && fiber.value > carbs.value && carbs.value > 0) {
      corrections.push(
        `Auto-corrected ${fiber.label} (${colName}) from ${fiber.value}g to ${carbs.value}g to respect Carbohydrate parent boundary`
      );
      fiber.value = carbs.value;
    }

    // 3. Saturated Fat <= Total Fat
    if (fat && satFat && satFat.value > fat.value && fat.value > 0) {
      corrections.push(
        `Auto-corrected ${satFat.label} (${colName}) from ${satFat.value}g to ${fat.value}g to respect Total Fat parent boundary`
      );
      satFat.value = fat.value;
    }
  };

  enforceBoundaries(healed100, 'Per 100g');
  enforceBoundaries(healedServ, 'Per Serving');

  // -------------------------------------------------------------
  // Layer 4: Atwater Energy Equivalence Verification Engine
  // -------------------------------------------------------------
  const verifyAtwaterEnergy = (list: NutrientMapItem[]) => {
    const getItemVal = (keyKw: string) => {
      const it = list.find(i => i.label.toLowerCase().includes(keyKw));
      return it ? it.value : 0;
    };

    const energyItem = list.find(i => i.label.toLowerCase().includes('energy'));
    const carbs = getItemVal('carbohydrate') || getItemVal('carb');
    const protein = getItemVal('protein');
    const fat = getItemVal('fat');

    if (energyItem && carbs > 0 && fat > 0) {
      const calculatedKcal = Math.round(4 * carbs + 4 * protein + 9 * fat);
      const listedKcal = energyItem.value;

      if (listedKcal > 0 && Math.abs(listedKcal - calculatedKcal) / listedKcal > 0.25) {
        const fatItem = list.find(i => i.label.toLowerCase().includes('fat') && !i.label.toLowerCase().includes('sat') && !i.label.toLowerCase().includes('trans'));
        if (fatItem && fatItem.value > 30 && calculatedKcal > listedKcal * 1.5) {
          const healedFat = Math.round((fatItem.value / 10) * 100) / 100;
          corrections.push(
            `Atwater Engine auto-corrected ${fatItem.label} from ${fatItem.value}g to ${healedFat}g to satisfy Atwater Energy Balance (${listedKcal} kcal)`
          );
          fatItem.value = healedFat;
        }
      }
    }
  };

  verifyAtwaterEnergy(healed100);
  verifyAtwaterEnergy(healedServ);

  return {
    healedPer100gItems: healed100,
    healedPerServingItems: healedServ,
    correctionsApplied: corrections,
  };
}
