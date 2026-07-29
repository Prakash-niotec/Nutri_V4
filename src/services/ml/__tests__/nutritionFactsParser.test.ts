import { parseNutritionFacts, recoverDecimalValue } from '../nutritionFactsParser';

describe('Nutrient Facts Parser & 2-Decimal Precision Suite', () => {
  describe('Total Sugar vs Added Sugar Priority', () => {
    it('correctly prioritizes Total Sugar over Added Sugar when both are present in spatial OCR', () => {
      const mockOcrResult = {
        text: 'Total Sugars 14.5g\nof which Added Sugars 0g',
        blocks: [
          {
            text: 'Total Sugars 14.5g\nof which Added Sugars 0g',
            lines: [
              { text: 'Total Sugars 14.5g', frame: { left: 10, top: 10, width: 100, height: 30 } },
              { text: 'of which Added Sugars 0g', frame: { left: 10, top: 40, width: 100, height: 30 } }
            ]
          }
        ]
      };

      const parsed = parseNutritionFacts(mockOcrResult);
      expect(parsed.sugar).toBe(14.5);
    });

    it('extracts Total Sugar from fallback text formats like "Sugars (g) 8.2"', () => {
      const parsed = parseNutritionFacts('Sugars (g) 8.2g\nEnergy 200kcal');
      expect(parsed.sugar).toBe(8.2);
    });
  });

  describe('2-Decimal Number Precision & Decimal Point Recovery', () => {
    it('preserves valid 2-decimal values like 0.18g, 5.39g, 2.49g without dropping last digit', () => {
      expect(recoverDecimalValue('0.18g', 0.18, 'g', 'saturated fat').val).toBe(0.18);
      expect(recoverDecimalValue('5.39g', 5.39, 'g', 'sugar').val).toBe(5.39);
      expect(recoverDecimalValue('2.49g', 2.49, 'g', 'fat').val).toBe(2.49);
      expect(recoverDecimalValue('1.89g', 1.89, 'g', 'protein').val).toBe(1.89);
    });

    it('universally fixes 0.0g or 0g across ALL nutrients (Trans Fat, Sodium, Sat Fat, Added Sugar, Protein) when OCR reads 9g or 0.09', () => {
      expect(recoverDecimalValue('0.0g', 9, 'g', 'added sugar').val).toBe(0);
      expect(recoverDecimalValue('0.0g', 0.09, 'g', 'added sugar').val).toBe(0);
      expect(recoverDecimalValue('0.0g', 9, 'g', 'trans fat').val).toBe(0);
      expect(recoverDecimalValue('0.0mg', 9, 'mg', 'sodium').val).toBe(0);
      expect(recoverDecimalValue('0.0g', 0.08, 'g', 'saturated fat').val).toBe(0);
      expect(recoverDecimalValue('0g', 9, 'g', 'protein').val).toBe(0);
    });

    it('recovers missing decimal dot for 2-digit numbers like 79g saturated fat -> 7.9g', () => {
      const res = recoverDecimalValue('79g', 79, 'g', 'saturated fat');
      expect(res.val).toBe(7.9);
      expect(res.unitStr).toBe('g');
    });
  });
});
