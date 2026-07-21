import { NutritionFacts, DetectedIngredient, RuleResult } from '../types';
import { CONDITION_THRESHOLDS } from '../config/thresholds';
import { INGREDIENT_WATCHLISTS } from '../config/ingredientWatchlists';

export function evaluateHighBloodPressureRule(nutrition: NutritionFacts, ingredients: DetectedIngredient[]): RuleResult {
  const maxSodium = CONDITION_THRESHOLDS.highBloodPressure.sodiumMgMax!;
  if (nutrition.sodiumMg > maxSodium) {
    return {
      ruleId: 'hbp-sodium',
      condition: 'highBloodPressure',
      severity: 'avoid',
      reason: `Sodium (${nutrition.sodiumMg}mg) exceeds the ${maxSodium}mg safe limit per serving.`,
    };
  }

  const watchlist = INGREDIENT_WATCHLISTS.highBloodPressure;
  const flagged = ingredients.find(ing => watchlist.some(w => ing.normalized.includes(w)));
  if (flagged) {
    return {
      ruleId: 'hbp-ingredient',
      condition: 'highBloodPressure',
      severity: 'caution',
      reason: `Flagged high-sodium additive detected: ${flagged.rawText}.`,
    };
  }

  return {
    ruleId: 'hbp-safe',
    condition: 'highBloodPressure',
    severity: 'safe',
    reason: 'Sodium within safe range and no hidden salts located.',
  };
}
