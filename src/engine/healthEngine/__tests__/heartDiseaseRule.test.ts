import { evaluateHeartDiseaseRule } from '../rules/heartDiseaseRule';
import { NutritionFacts, DetectedIngredient } from '../types';

describe('Heart Disease Rule', () => {
  const baseNutrition: NutritionFacts = {
    servingSizeG: 100, calories: 100, totalSugarG: 0, addedSugarG: 0,
    sodiumMg: 0, saturatedFatG: 0, transFatG: 0, totalCarbsG: 0, 
    fiberG: 0, cholesterolMg: 0, potassiumMg: 0, proteinG: 0
  };
  const baseIngredients: DetectedIngredient[] = [];

  it('returns safe when fats are low', () => {
    const result = evaluateHeartDiseaseRule({ ...baseNutrition, saturatedFatG: 1, transFatG: 0 }, baseIngredients);
    expect(result.severity).toBe('safe');
  });

  it('returns avoid when saturated fat is too high', () => {
    const result = evaluateHeartDiseaseRule({ ...baseNutrition, saturatedFatG: 2, transFatG: 0 }, baseIngredients);
    expect(result.severity).toBe('avoid');
  });

  it('returns avoid if hazardous oil is found as additive', () => {
    const badIngredients: DetectedIngredient[] = [{ rawText: 'partially hydrogenated oil', normalized: 'partially hydrogenated oil' }];
    const result = evaluateHeartDiseaseRule(baseNutrition, badIngredients);
    expect(result.severity).toBe('avoid');
  });
});
