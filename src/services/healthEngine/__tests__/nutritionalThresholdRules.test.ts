import { evaluateNutritionalThresholds } from '../rules/nutritionalThresholdRules';
import { DetectedFoodData, UserHealthProfile } from '../types';

describe('nutritionalThresholdRules', () => {
    it('flags generally high sugar', () => {
        const food: DetectedFoodData = { detectedIngredients: [], nutritionFacts: { sugar_g: 22 } };
        const profile: UserHealthProfile = { userId: '1', allergies: [], medicalConditions: [], dietaryRestrictions: [], ageGroup: 'adult' };
        const results = evaluateNutritionalThresholds(food, profile);

        expect(results.length).toBe(1);
        expect(results[0].flaggedIngredients[0].ingredient).toContain('Sugar');
    });
});
