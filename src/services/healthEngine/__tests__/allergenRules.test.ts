import { evaluateAllergenRules } from '../rules/allergenRules';
import { DetectedFoodData, UserHealthProfile } from '../types';

describe('allergenRules', () => {
    it('should return empty if no allergens in profile', () => {
        const food: DetectedFoodData = { detectedIngredients: ['peanut'] };
        const profile: UserHealthProfile = { userId: '1', allergies: [], medicalConditions: [], dietaryRestrictions: [] };
        expect(evaluateAllergenRules(food, profile)).toEqual([]);
    });

    it('should flag ingredients if allergen matched', () => {
        const food: DetectedFoodData = { detectedIngredients: ['peanut butter', 'sugar'] };
        const profile: UserHealthProfile = { userId: '1', allergies: ['peanuts'], medicalConditions: [], dietaryRestrictions: [] };
        const results = evaluateAllergenRules(food, profile);
        expect(results.length).toBe(1);
        expect(results[0].matchedAllergens).toContain('peanuts');
        expect(results[0].flaggedIngredients[0].severity).toBe('CRITICAL');
    });

    it('should handle synonyms', () => {
        const food: DetectedFoodData = { detectedIngredients: ['whey'] };
        const profile: UserHealthProfile = { userId: '1', allergies: ['dairy'], medicalConditions: [], dietaryRestrictions: [] };
        const results = evaluateAllergenRules(food, profile);
        expect(results[0].matchedAllergens).toContain('dairy');
    });
});
