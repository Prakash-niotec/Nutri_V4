import { validateAndHealNutritionData, extractServingGrams } from '../nutritionCrossValidator';

describe('4-Layer Self-Healing Nutrition Cross Validator Engine', () => {
  describe('Serving Size Gram Extraction', () => {
    it('extracts numeric grams correctly from metadata strings', () => {
      expect(extractServingGrams('Serving size: 20 g')).toBe(20);
      expect(extractServingGrams('Serving size: 30.5g')).toBe(30.5);
      expect(extractServingGrams('25 ml')).toBe(25);
      expect(extractServingGrams(null)).toBe(0);
    });
  });

  describe('Layer 3A: Cross-Column Proportional Ratio Auto-Correction', () => {
    it('auto-corrects Per Serving Total Fat from 63.2g to 6.32g when Per 100g is 31.6g and serving size is 20g', () => {
      const per100g = [{ label: 'Total Fat', value: 31.6, unit: ' g' }];
      const perServing = [{ label: 'Total Fat', value: 63.2, unit: ' g' }]; // missing dot bug (63.2g vs 6.32g)

      const result = validateAndHealNutritionData(per100g, perServing, { servingSize: 'Serving size: 20 g' });
      expect(result.healedPerServingItems[0].value).toBe(6.32);
      expect(result.correctionsApplied.length).toBeGreaterThan(0);
    });

    it('auto-corrects Per 100g Total Sugar from 4.4g to 44.5g when Per Serving is 8.9g and serving size is 20g', () => {
      const per100g = [{ label: 'Total Sugar', value: 4.4, unit: ' g' }]; // truncated OCR bug
      const perServing = [{ label: 'Total Sugar', value: 8.9, unit: ' g' }];

      const result = validateAndHealNutritionData(per100g, perServing, { servingSize: 'Serving size: 20 g' });
      expect(result.healedPer100gItems[0].value).toBe(44.5);
      expect(result.correctionsApplied.length).toBeGreaterThan(0);
    });
  });

  describe('Layer 3B: Sub-Nutrient Invariant Boundary Enforcement', () => {
    it('caps Total Sugar to Total Carbohydrates when Sugar > Carbs', () => {
      const per100g = [
        { label: 'Total Carbohydrates', value: 20, unit: ' g' },
        { label: 'Total Sugar', value: 35, unit: ' g' }, // Impossible boundary breach!
      ];
      const result = validateAndHealNutritionData(per100g, [], {});
      expect(result.healedPer100gItems[1].value).toBe(20);
      expect(result.correctionsApplied).toContainEqual(
        expect.stringContaining('to respect Carbohydrate parent boundary')
      );
    });

    it('caps Saturated Fat to Total Fat when Sat Fat > Total Fat', () => {
      const per100g = [
        { label: 'Total Fat', value: 10, unit: ' g' },
        { label: 'Saturated Fat', value: 15, unit: ' g' }, // Impossible boundary breach!
      ];
      const result = validateAndHealNutritionData(per100g, [], {});
      expect(result.healedPer100gItems[1].value).toBe(10);
    });
  });

  describe('Layer 4: Atwater Energy Verification Engine', () => {
    it('auto-corrects bloated Fat value to satisfy 4-4-9 Atwater energy balance', () => {
      const per100g = [
        { label: 'Energy', value: 545, unit: ' kcal' },
        { label: 'Total Carbohydrates', value: 57.3, unit: ' g' },
        { label: 'Protein', value: 7.9, unit: ' g' },
        { label: 'Total Fat', value: 316, unit: ' g' }, // missing dot bug 316g fat -> 545 kcal is impossible!
      ];

      const result = validateAndHealNutritionData(per100g, [], {});
      expect(result.healedPer100gItems[3].value).toBe(31.6);
      expect(result.correctionsApplied).toContainEqual(
        expect.stringContaining('Atwater Engine auto-corrected')
      );
    });
  });
});
