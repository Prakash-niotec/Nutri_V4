import { NutritionFacts, DetectedIngredient, RuleResult } from '../types';
import { CONDITION_THRESHOLDS } from '../config/thresholds';
import { INGREDIENT_WATCHLISTS } from '../config/ingredientWatchlists';

export function evaluateHighCholesterolRule(nutrition: NutritionFacts, ingredients: DetectedIngredient[]): RuleResult {
  const satFatMax = CONDITION_THRESHOLDS.highCholesterol.satFatGMax!;
  const transFatMax = CONDITION_THRESHOLDS.highCholesterol.transFatGMax!;
  const cholMax = CONDITION_THRESHOLDS.highCholesterol.cholesterolMgMax!;

  if (nutrition.saturatedFatG > satFatMax || nutrition.transFatG > transFatMax || nutrition.cholesterolMg > cholMax) {
    return {
      ruleId: 'cholesterol-macros',
      condition: 'highCholesterol',
      severity: 'avoid',
      reason: `Saturated Fats, Trans Fats, or Dietary Cholesterol exceed safe lipid limits.`,
    };
  }

  const watchlist = INGREDIENT_WATCHLISTS.highCholesterol;
  const flagged = ingredients.find(ing => watchlist.some(w => ing.normalized.includes(w)));
  if (flagged) {
    return {
      ruleId: 'cholesterol-ingredient',
      condition: 'highCholesterol',
      severity: 'avoid',
      reason: `High cholesterol or saturated additive detected: ${flagged.rawText}.`,
    };
  }

  return {
    ruleId: 'cholesterol-safe',
    condition: 'highCholesterol',
    severity: 'safe',
    reason: 'Zero hazardous lipid ingredients located.',
  };
}
