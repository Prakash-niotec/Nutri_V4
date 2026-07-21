import { NutritionFacts, DetectedIngredient, RuleResult } from '../types';
import { CONDITION_THRESHOLDS } from '../config/thresholds';
import { INGREDIENT_WATCHLISTS } from '../config/ingredientWatchlists';

export function evaluateKidneyDiseaseRule(nutrition: NutritionFacts, ingredients: DetectedIngredient[]): RuleResult {
  const sodiumMax = CONDITION_THRESHOLDS.kidneyDisease.sodiumMgMax!;
  const potassiumMax = CONDITION_THRESHOLDS.kidneyDisease.potassiumMgMax!;
  const proteinMax = CONDITION_THRESHOLDS.kidneyDisease.proteinGMax!;
  
  if (nutrition.sodiumMg > sodiumMax || nutrition.potassiumMg > potassiumMax || nutrition.proteinG > proteinMax) {
    return {
      ruleId: 'kidney-macros',
      condition: 'kidneyDisease',
      severity: 'avoid',
      reason: `Nutrition exceeds strict limits for renal function (Sodium: ${sodiumMax}mg, Potassium: ${potassiumMax}mg, Protein: ${proteinMax}g).`,
    };
  }

  const watchlist = INGREDIENT_WATCHLISTS.kidneyDisease;
  const flagged = ingredients.find(ing => watchlist.some(w => ing.normalized.includes(w)));
  if (flagged) {
    return {
      ruleId: 'kidney-ingredient',
      condition: 'kidneyDisease',
      severity: 'caution',
      reason: `Dangerous renal additive detected: ${flagged.rawText}.`,
    };
  }

  return {
    ruleId: 'kidney-safe',
    condition: 'kidneyDisease',
    severity: 'safe',
    reason: 'Minerals, protein, and ingredients are safely accommodated for kidneys.',
  };
}
