import { evaluateHighCholesterolRule } from '../rules/highCholesterolRule';
import { NutritionFacts, DetectedIngredient } from '../types';

describe('High Cholesterol Rule', () => {
  const baseNutrition: NutritionFacts = {
    servingSizeG: 100, calories: 100, totalSugarG: 0, addedSugarG: 0,
    sodiumMg: 0, saturatedFatG: 0, transFatG: 0, totalCarbsG: 0, 
    fiberG: 0, cholesterolMg: 0, potassiumMg: 0, proteinG: 0
  };
  const baseIngredients: DetectedIngredient[] = [];

  it('returns safe when variables are below thresholds', () => {
    const result = evaluateHighCholesterolRule({ ...baseNutrition, saturatedFatG: 1, transFatG: 0, cholesterolMg: 10 }, baseIngredients);
    expect(result.severity).toBe('safe');
  });

  it('returns avoid when cholesterol is too high', () => {
    const result = evaluateHighCholesterolRule({ ...baseNutrition, saturatedFatG: 1, transFatG: 0, cholesterolMg: 30 }, baseIngredients);
    expect(result.severity).toBe('avoid');
  });
  
  it('returns avoid if hazardous additive oil is found', () => {
    const badIngredients: DetectedIngredient[] = [{ rawText: 'palm oil', normalized: 'palm oil' }];
    const result = evaluateHighCholesterolRule(baseNutrition, badIngredients);
    expect(result.severity).toBe('avoid');
  });
});
