import { evaluateConditionRules, HEALTH_CONDITION_RULES, CONDITION_CONFLICTS } from '../rules/conditionRules';
import { DetectedFoodData, UserHealthProfile } from '../types';

describe('Health Condition Rules Engine (v2)', () => {
  it('exports HEALTH_CONDITION_RULES and CONDITION_CONFLICTS', () => {
    expect(HEALTH_CONDITION_RULES.diabetes).toBeDefined();
    expect(HEALTH_CONDITION_RULES.highBloodPressure).toBeDefined();
    expect(HEALTH_CONDITION_RULES.heartDisease).toBeDefined();
    expect(HEALTH_CONDITION_RULES.highCholesterol).toBeDefined();
    expect(HEALTH_CONDITION_RULES.kidneyDisease).toBeDefined();
    expect(CONDITION_CONFLICTS.length).toBeGreaterThan(0);
  });

  describe('1. Diabetes Rule Evaluation', () => {
    it('flags added sugar in ingredients with position weighting', () => {
      const food: DetectedFoodData = {
        detectedIngredients: ['Sugar', 'Wheat flour', 'Palm oil'],
        nutritionFacts: { sugar_g: 15 }
      };
      const profile: UserHealthProfile = {
        userId: 'u1',
        allergies: [],
        medicalConditions: ['diabetes'],
        dietaryRestrictions: []
      };

      const results = evaluateConditionRules(food, profile);
      expect(results.length).toBeGreaterThan(0);
      const flags = results[0].flaggedIngredients;
      expect(flags.some(f => f.ingredient === 'Sugar')).toBe(true);
      // High position weighting since Sugar is 1st ingredient
      const sugarFlag = flags.find(f => f.ingredient === 'Sugar');
      expect(sugarFlag?.severity).toBe('HIGH');
    });
  });

  describe('2. Chronic Kidney Disease (CKD) Unmeasurable Proxy Detection', () => {
    it('flags phosphorus additives as proxy flags even without numeric phosphorus on label', () => {
      const food: DetectedFoodData = {
        detectedIngredients: ['Carbonated water', 'High fructose corn syrup', 'Phosphoric acid', 'Caramel color'],
        allNutrientItems: []
      };
      const profile: UserHealthProfile = {
        userId: 'u2',
        allergies: [],
        medicalConditions: ['kidney_disease'],
        dietaryRestrictions: []
      };

      const results = evaluateConditionRules(food, profile);
      expect(results.length).toBeGreaterThan(0);
      const flags = results[0].flaggedIngredients;
      const phosFlag = flags.find(f => f.ingredient === 'Phosphoric acid');
      expect(phosFlag).toBeDefined();
      expect(phosFlag?.reason).toContain('unmeasurable on standard panel');
    });
  });

  describe('3. Reference-Only Guardrails Filtering', () => {
    it('does NOT trigger failure on referenceOnly daily recommended targets', () => {
      const food: DetectedFoodData = {
        detectedIngredients: ['Rice', 'Vegetables'],
        nutritionFacts: { sodium_mg: 100 } // Below single-product limit (120mg), but reference target is 2000mg
      };
      const profile: UserHealthProfile = {
        userId: 'u3',
        allergies: [],
        medicalConditions: ['high_blood_pressure'],
        dietaryRestrictions: []
      };

      const results = evaluateConditionRules(food, profile);
      // 100mg sodium is safe (<= 120mg), so no failure flags should be generated
      expect(results.length).toBe(0);
    });
  });

  describe('4. Comorbidity Conflict Resolution', () => {
    it('applies comorbidity override warning when user has Diabetes and CKD', () => {
      const food: DetectedFoodData = {
        detectedIngredients: ['Sugar', 'Bran'],
        nutritionFacts: { sugar_g: 12 }
      };
      const profile: UserHealthProfile = {
        userId: 'u4',
        allergies: [],
        medicalConditions: ['diabetes', 'kidney_disease'],
        dietaryRestrictions: []
      };

      const results = evaluateConditionRules(food, profile);
      expect(results.length).toBeGreaterThan(0);
      const warnings = results.flatMap(r => r.conditionWarnings || []);
      expect(warnings.some(w => w.condition === 'COMORBIDITY_OVERRIDE')).toBe(true);
    });
  });
});
