import { evaluateHighBloodPressureRule } from '../rules/highBloodPressureRule';
import { NutritionFacts, DetectedIngredient } from '../types';

describe('High Blood Pressure Rule', () => {
  const baseNutrition: NutritionFacts = {
    servingSizeG: 100, calories: 100, totalSugarG: 10, addedSugarG: 0,
    sodiumMg: 10, saturatedFatG: 1, transFatG: 0, totalCarbsG: 20, 
    fiberG: 2, cholesterolMg: 0, potassiumMg: 0, proteinG: 0
  };
  const baseIngredients: DetectedIngredient[] = [];

  it('returns safe when sodium is under threshold', () => {
    const result = evaluateHighBloodPressureRule({ ...baseNutrition, sodiumMg: 100 }, baseIngredients);
    expect(result.severity).toBe('safe');
  });

  it('returns avoid when sodium is above threshold', () => {
    const result = evaluateHighBloodPressureRule({ ...baseNutrition, sodiumMg: 150 }, baseIngredients);
    expect(result.severity).toBe('avoid');
  });

  it('returns caution if MSG or hazardous sodium additives are found', () => {
    const badIngredients: DetectedIngredient[] = [{ rawText: 'monosodium glutamate', normalized: 'monosodium glutamate' }];
    const result = evaluateHighBloodPressureRule(baseNutrition, badIngredients);
    expect(result.severity).toBe('caution');
  });
});
