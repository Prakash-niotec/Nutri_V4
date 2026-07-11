import { evaluateFoodSafety } from '../index';
import { MOCK_PRODUCTS } from '../../../mocks/healthEngine/mockDetectedFood';
import { MOCK_PROFILES } from '../../../mocks/healthEngine/mockUserProfiles';

describe('Health Engine Integration', () => {
    it('evaluates all mock combinations without throwing', () => {
        MOCK_PRODUCTS.forEach(food => {
            MOCK_PROFILES.forEach(profile => {
                const result = evaluateFoodSafety(food, profile);
                expect(result).toBeDefined();
                expect(result.overallVerdict).toMatch(/SAFE|CAUTION|AVOID/);
                expect(typeof result.riskScore).toBe('number');
            });
        });
    });

    it('identifies peanut butter cup as AVOID for nut allergy', () => {
        const food = MOCK_PRODUCTS.find(p => p.productName === 'Peanut Butter Chocolate Cup')!;
        const profile = MOCK_PROFILES.find(p => p.userId === 'user_nut_dairy')!;
        const result = evaluateFoodSafety(food, profile);

        expect(result.overallVerdict).toBe('AVOID');
        expect(result.matchedAllergens).toContain('peanuts');
    });
});
