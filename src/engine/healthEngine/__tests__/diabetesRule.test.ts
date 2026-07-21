import { evaluateDiabetesRule } from '../rules/diabetesRule';
import { NutritionFacts, DetectedIngredient } from '../types';

describe('Diabetes Rule', () => {
  const baseNutrition: NutritionFacts = {
    servingSizeG: 100, calories: 100, totalSugarG: 10, addedSugarG: 0,
    sodiumMg: 10, saturatedFatG: 1, transFatG: 0, totalCarbsG: 20, 
    fiberG: 2, cholesterolMg: 0, potassiumMg: 0, proteinG: 0
  };
  const baseIngredients: DetectedIngredient[] = [];

  it('returns safe when added sugar and carbs are under threshold', () => {
    const result = evaluateDiabetesRule({ ...baseNutrition, addedSugarG: 2, totalCarbsG: 30 }, baseIngredients);
    expect(result.severity).toBe('safe');
  });

  it('returns avoid when added sugar is above threshold', () => {
    const result = evaluateDiabetesRule({ ...baseNutrition, addedSugarG: 8 }, baseIngredients);
    expect(result.severity).toBe('avoid');
  });

  it('returns caution if a glycemic additive is found in ingredients', () => {
    const badIngredients: DetectedIngredient[] = [{ rawText: 'high fructose corn syrup', normalized: 'high fructose corn syrup' }];
    const result = evaluateDiabetesRule(baseNutrition, badIngredients);
    expect(result.severity).toBe('caution');
  });
});
