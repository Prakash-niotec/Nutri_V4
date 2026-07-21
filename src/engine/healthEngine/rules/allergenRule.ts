import { DetectedIngredient, RuleResult, Allergen } from '../types';
import { ALLERGEN_SYNONYMS } from '../config/allergenSynonyms';

export function resolveAllergensInIngredient(ingredient: DetectedIngredient): Allergen[] {
  const detected: Allergen[] = [];
  const text = ingredient.normalized.toLowerCase().trim();
  
  for (const [allergen, synonyms] of Object.entries(ALLERGEN_SYNONYMS)) {
    if (synonyms.some(syn => text.includes(syn.toLowerCase()))) {
      detected.push(allergen as Allergen);
    }
  }
  return detected;
}

export function evaluateAllergenRule(ingredients: DetectedIngredient[], userAllergens: Allergen[]): RuleResult[] {
  const results: RuleResult[] = [];

  for (const allergen of userAllergens) {
    let triggered = false;
    for (const ing of ingredients) {
      if (resolveAllergensInIngredient(ing).includes(allergen)) {
        triggered = true;
        results.push({
          ruleId: `allergen-detected-${allergen}`,
          allergen: allergen,
          severity: 'avoid',
          reason: `Contains ingredient '${ing.normalized}' matching avoided allergen: ${allergen}.`,
        });
      }
    }
    
    if (!triggered) {
      results.push({
        ruleId: `allergen-safe-${allergen}`,
        allergen: allergen,
        severity: 'safe',
        reason: `No traced matches found for ${allergen}.`,
      });
    }
  }

  return results;
}
