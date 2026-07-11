import { evaluateDietaryRestrictions } from '../rules/dietaryRestrictionRules';
import { DetectedFoodData, UserHealthProfile } from '../types';

describe('dietaryRestrictionRules', () => {
    it('flags animal products for vegans', () => {
        const food: DetectedFoodData = { detectedIngredients: ['pork', 'salt'] };
        const profile: UserHealthProfile = { userId: '1', allergies: [], medicalConditions: [], dietaryRestrictions: ['vegan'] };
        const results = evaluateDietaryRestrictions(food, profile);

        expect(results.length).toBe(1);
        expect(results[0].flaggedIngredients[0].ingredient).toBe('pork');
    });
});
