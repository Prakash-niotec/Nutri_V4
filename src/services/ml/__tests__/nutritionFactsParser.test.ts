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

    it('anchors sub-indented "of which Total Sugar" to canonical Total Sugar category', () => {
      const { fuzzyMatchKeyName } = require('../nutritionFactsParser');
      const match = fuzzyMatchKeyName('of which Total Sugar');
      expect(match).not.toBeNull();
      expect(match?.category).toBe('sugar');
      expect(match?.canonicalName).toBe('Total Sugar');
    });
  });

  describe('2-Decimal Number Precision & Decimal Point Recovery', () => {
    it('preserves valid sub-gram 2-decimal values like 0.18g, 2.33g, 0.04g while trimming misread unit g digit 9 on macros (5.39 -> 5.3g)', () => {
      expect(recoverDecimalValue('0.18g', 0.18, 'g', 'saturated fat').val).toBe(0.18);
      expect(recoverDecimalValue('5.39', 5.39, 'g', 'sugar').val).toBe(5.3);
      expect(recoverDecimalValue('2.33g', 2.33, 'g', 'fat').val).toBe(2.33);
      expect(recoverDecimalValue('0.04g', 0.04, 'g', 'trans fat').val).toBe(0.04);
    });

    it('universally fixes 0.0g or 0g across ALL nutrients (Trans Fat, Sodium, Sat Fat, Added Sugar, Protein) when OCR reads 9g or 0.09', () => {
      expect(recoverDecimalValue('0.0g', 9, 'g', 'added sugar').val).toBe(0);
      expect(recoverDecimalValue('0.0g', 0.09, 'g', 'added sugar').val).toBe(0);
      expect(recoverDecimalValue('0.0g', 9, 'g', 'trans fat').val).toBe(0);
      expect(recoverDecimalValue('0.0mg', 9, 'mg', 'sodium').val).toBe(0);
      expect(recoverDecimalValue('0.0g', 0.08, 'g', 'saturated fat').val).toBe(0);
      expect(recoverDecimalValue('0g', 9, 'g', 'protein').val).toBe(0);
    });

    it('correctly recovers 3-digit integer misreads where g was read as 9 without dot (549 -> 54.9g, 379 -> 3.7g, 359 -> 3.5g, 079 -> 0.7g)', () => {
      expect(recoverDecimalValue('549', 549, 'g', 'carbohydrate').val).toBe(54.9);
      expect(recoverDecimalValue('379', 379, 'g', 'total sugar').val).toBe(3.7);
      expect(recoverDecimalValue('359', 359, 'g', 'protein').val).toBe(3.5);
      expect(recoverDecimalValue('079', 79, 'g', 'minerals').val).toBe(0.7);
    });

    it('trims misread unit g digit 9 on 2-decimal floats for 1-column labels (3.79 -> 3.7g, 5.49 -> 5.4g, 0.79 -> 0.7g)', () => {
      expect(recoverDecimalValue('3.79', 3.79, 'g', 'total sugar').val).toBe(3.7);
      expect(recoverDecimalValue('5.49', 5.49, 'g', 'carbohydrate').val).toBe(5.4);
      expect(recoverDecimalValue('0.79', 0.79, 'g', 'minerals').val).toBe(0.7);
    });

    it('preserves valid 2-decimal numbers like 6.32g total fat, 1.58g protein, 5.34g sat fat, 11.46g carbs, 26.72g sat fat', () => {
      expect(recoverDecimalValue('6.32g', 6.32, 'g', 'total fat').val).toBe(6.32);
      expect(recoverDecimalValue('1.58g', 1.58, 'g', 'protein').val).toBe(1.58);
      expect(recoverDecimalValue('5.34g', 5.34, 'g', 'saturated fat').val).toBe(5.34);
      expect(recoverDecimalValue('11.46g', 11.46, 'g', 'carbohydrates').val).toBe(11.46);
      expect(recoverDecimalValue('26.72g', 26.72, 'g', 'saturated fat').val).toBe(26.72);
      expect(recoverDecimalValue('0.18g', 0.18, 'g', 'saturated fat').val).toBe(0.18);
      expect(recoverDecimalValue('0.04g', 0.04, 'g', 'trans fat').val).toBe(0.04);
    });

    it('correctly recovers 3-digit per serving integer 632 to 6.32g total fat and 158 to 1.58g protein', () => {
      expect(recoverDecimalValue('632', 632, 'g', 'total fat').val).toBe(6.32);
      expect(recoverDecimalValue('158', 158, 'g', 'protein').val).toBe(1.58);
      expect(recoverDecimalValue('449', 449, 'g', 'total sugar').val).toBe(44.9);
    });

    it('recovers missing decimal dot for 2-digit numbers like 79g saturated fat -> 7.9g', () => {
      const res = recoverDecimalValue('79g', 79, 'g', 'saturated fat');
      expect(res.val).toBe(7.9);
      expect(res.unitStr).toBe('g');
    });
  });

  describe('Ingredient List Safety & Header Extraction', () => {
    it('returns empty array when no explicit ingredient header exists in OCR text', () => {
      const { extractFullIngredientList } = require('../nutritionFactsParser');
      const textWithoutHeader = 'Energy 281kJ Carbohydrate 5.4g Protein 3.5g';
      expect(extractFullIngredientList(textWithoutHeader)).toEqual([]);
    });

    it('correctly extracts ingredients when explicit header exists', () => {
      const { extractFullIngredientList } = require('../nutritionFactsParser');
      const textWithHeader = 'Nutrition Facts... Ingredient : Cow\'s Milk, Water';
      const extracted = extractFullIngredientList(textWithHeader);
      expect(extracted).toContain('Cow\'s Milk');
    });
  });
});
