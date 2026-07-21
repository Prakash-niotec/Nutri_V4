import { NutritionFacts, DetectedIngredient, RuleResult } from '../types';
import { CONDITION_THRESHOLDS } from '../config/thresholds';
import { INGREDIENT_WATCHLISTS } from '../config/ingredientWatchlists';

export function evaluateHeartDiseaseRule(nutrition: NutritionFacts, ingredients: DetectedIngredient[]): RuleResult {
  const satFatMax = CONDITION_THRESHOLDS.heartDisease.satFatGMax!;
  const transFatMax = CONDITION_THRESHOLDS.heartDisease.transFatGMax!;
  const sodiumMax = CONDITION_THRESHOLDS.heartDisease.sodiumMgMax!;

  if (nutrition.saturatedFatG > satFatMax || nutrition.transFatG > transFatMax || nutrition.sodiumMg > sodiumMax) {
    return {
      ruleId: 'heart-macros',
      condition: 'heartDisease',
      severity: 'avoid',
      reason: `Lipids or sodium exceed safe cardiovascular limits.`,
    };
  }

  const watchlist = INGREDIENT_WATCHLISTS.heartDisease;
  const flagged = ingredients.find(ing => watchlist.some(w => ing.normalized.includes(w)));
  if (flagged) {
    return {
      ruleId: 'heart-ingredient',
      condition: 'heartDisease',
      severity: 'avoid',
      reason: `Hazardous trans/saturated oil detected: ${flagged.rawText}.`,
    };
  }

  return {
    ruleId: 'heart-safe',
    condition: 'heartDisease',
    severity: 'safe',
    reason: 'Fats and sodium are within cardiovascular tolerances.',
  };
}
