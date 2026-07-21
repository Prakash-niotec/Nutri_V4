import { evaluateAllergenRule, resolveAllergensInIngredient } from '../rules/allergenRule';
import { DetectedIngredient, Allergen } from '../types';

describe('Allergen Rule', () => {
  it('correctly maps synonyms to core allergens', () => {
    const ing: DetectedIngredient = { rawText: 'WHEY PROTEIN ISOLATE', normalized: 'whey protein isolate' };
    const resolved = resolveAllergensInIngredient(ing);
    expect(resolved).toContain('milk');
  });

  it('triggers an avoid result if matched', () => {
    const inputs: DetectedIngredient[] = [
      { rawText: 'peanut', normalized: 'roasted peanuts' },
      { rawText: 'salt', normalized: 'salt' }
    ];
    const userAllergens: Allergen[] = ['peanuts', 'milk'];

    const results = evaluateAllergenRule(inputs, userAllergens);
    expect(results).toHaveLength(2);

    const peanutResult = results.find(r => r.allergen === 'peanuts');
    expect(peanutResult?.severity).toBe('avoid');

    const milkResult = results.find(r => r.allergen === 'milk');
    expect(milkResult?.severity).toBe('safe');
  });
});
