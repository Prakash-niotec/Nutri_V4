import { evaluateKidneyDiseaseRule } from '../rules/kidneyDiseaseRule';
import { NutritionFacts, DetectedIngredient } from '../types';

describe('Kidney Disease Rule', () => {
  const baseNutrition: NutritionFacts = {
    servingSizeG: 100, calories: 100, totalSugarG: 0, addedSugarG: 0,
    sodiumMg: 0, saturatedFatG: 0, transFatG: 0, totalCarbsG: 0, 
    fiberG: 0, cholesterolMg: 0, potassiumMg: 0, proteinG: 0
  };
  const baseIngredients: DetectedIngredient[] = [];

  it('returns safe when variables are low', () => {
    const result = evaluateKidneyDiseaseRule({ ...baseNutrition, sodiumMg: 100, potassiumMg: 150, proteinG: 10 }, baseIngredients);
    expect(result.severity).toBe('safe');
  });

  it('returns avoid when sodium is high', () => {
    const result = evaluateKidneyDiseaseRule({ ...baseNutrition, sodiumMg: 200, potassiumMg: 100, proteinG: 10 }, baseIngredients);
    expect(result.severity).toBe('avoid');
  });

  it('returns caution if a renal dangerous additive is found', () => {
    const badIngredients: DetectedIngredient[] = [{ rawText: 'phosphoric acid', normalized: 'phosphoric acid' }];
    const result = evaluateKidneyDiseaseRule(baseNutrition, badIngredients);
    expect(result.severity).toBe('caution');
  });
});
