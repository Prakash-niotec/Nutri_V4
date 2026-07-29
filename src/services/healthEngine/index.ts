import { DetectedFoodData, UserHealthProfile, HealthEvaluationResult } from './types';
import { evaluateAllergenRules } from './rules/allergenRules';
import { evaluateConditionRules } from './rules/conditionRules';
import { evaluateDietaryRestrictions } from './rules/dietaryRestrictionRules';
import { evaluateNutritionalThresholds } from './rules/nutritionalThresholdRules';
import { aggregateResults } from './scoring/aggregateResults';

export * from './types';

/**
 * Main entry point for evaluating food safety based on a user's health profile.
 * 
 * @param food Detected food data resembling OCR/Object Detection output.
 * @param profile User health profile (allergies, medical conditions, etc.)
 * @returns HealthEvaluationResult containing verdicts, flagged ingredients, and risk scores.
 */
export const evaluateFoodSafety = (food: DetectedFoodData, profile: UserHealthProfile): HealthEvaluationResult => {
    const allergenResults = evaluateAllergenRules(food, profile);
    const conditionResults = evaluateConditionRules(food, profile);
    const dietaryResults = evaluateDietaryRestrictions(food, profile);
    const nutritionalResults = evaluateNutritionalThresholds(food, profile);

    // Unrecognized / Novel Nutrient Safety Warning
    const unknownNutrientResults: any[] = [];
    const knownKeys = ["energy", "calories", "sugar", "total sugar", "added sugar", "fat", "total fat", "saturated fat", "trans fat", "sodium", "salt", "protein", "carbohydrates", "carbs", "fiber", "fibre", "calcium", "iron", "potassium", "magnesium", "zinc", "monounsaturated fat", "polyunsaturated fat", "cholesterol", "polyols"];

    if (food.allNutrientItems) {
      food.allNutrientItems.forEach(item => {
        const lowerLabel = (item.label || "").toLowerCase();
        const isKnown = knownKeys.some(k => lowerLabel.includes(k));
        if (!isKnown && lowerLabel.length > 2) {
          unknownNutrientResults.push({
            ruleId: 'UNRECOGNIZED_NUTRIENT',
            severity: 'MEDIUM',
            ingredient: item.label,
            reason: `⚠️ Unrecognized Nutrient: '${item.label}' is not in our safety evaluation database. Please search details or consult medical guidance before consuming.`,
          });
        }
      });
    }

    const allResults = [
        ...allergenResults,
        ...conditionResults,
        ...dietaryResults,
        ...nutritionalResults,
        ...unknownNutrientResults
    ];

    return aggregateResults(allResults);
};
