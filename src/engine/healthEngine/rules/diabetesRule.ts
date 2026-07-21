import { NutritionFacts, DetectedIngredient, RuleResult } from '../types';
import { CONDITION_THRESHOLDS } from '../config/thresholds';
import { INGREDIENT_WATCHLISTS } from '../config/ingredientWatchlists';

export function evaluateDiabetesRule(nutrition: NutritionFacts, ingredients: DetectedIngredient[]): RuleResult {
  const maxSugar = CONDITION_THRESHOLDS.diabetes.addedSugarGMax!;
  const maxCarbs = CONDITION_THRESHOLDS.diabetes.totalCarbsGMax!;
  
  if (nutrition.addedSugarG > maxSugar || nutrition.totalCarbsG > maxCarbs) {
    return {
      ruleId: 'diabetes-macros',
      condition: 'diabetes',
      severity: 'avoid',
      reason: `Sugar (${nutrition.addedSugarG}g) or Carbs (${nutrition.totalCarbsG}g) per serving exceeds safe limits (${maxSugar}g, ${maxCarbs}g).`,
    };
  }

  const watchlist = INGREDIENT_WATCHLISTS.diabetes;
  const flagged = ingredients.find(ing => watchlist.some(w => ing.normalized.includes(w)));
  if (flagged) {
    return {
      ruleId: 'diabetes-ingredient',
      condition: 'diabetes',
      severity: 'caution',
      reason: `Flagged additive detected: ${flagged.rawText} which can spike glycemic index.`,
    };
  }

  return {
    ruleId: 'diabetes-safe',
    condition: 'diabetes',
    severity: 'safe',
    reason: 'Macros are safe and no high-glycemic additives detected.',
  };
}
