import { evaluateConditionRules } from '../rules/conditionRules';
import { DetectedFoodData, UserHealthProfile } from '../types';

describe('conditionRules', () => {
    it('warns for high sugar if diabetic', () => {
        const food: DetectedFoodData = {
            detectedIngredients: ['sugar'],
            nutritionFacts: { sugar_g: 20 }
        };
        const profile: UserHealthProfile = { userId: '1', allergies: [], medicalConditions: ['diabetes'], dietaryRestrictions: [] };
        const results = evaluateConditionRules(food, profile);

        expect(results.length).toBe(1);
        expect(results[0].conditionWarnings?.[0].condition).toBe('diabetes');
    });

    it('warns for high sodium if high blood pressure', () => {
        const food: DetectedFoodData = {
            detectedIngredients: ['msg'],
            nutritionFacts: { sodium_mg: 800 }
        };
        const profile: UserHealthProfile = { userId: '1', allergies: [], medicalConditions: ['high_blood_pressure'], dietaryRestrictions: [] };
        const results = evaluateConditionRules(food, profile);

        expect(results[0].conditionWarnings?.[0].condition).toBe('high_blood_pressure');
    });
});
