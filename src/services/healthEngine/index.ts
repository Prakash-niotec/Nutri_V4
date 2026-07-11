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

    const allResults = [
        ...allergenResults,
        ...conditionResults,
        ...dietaryResults,
        ...nutritionalResults
    ];

    return aggregateResults(allResults);
};
