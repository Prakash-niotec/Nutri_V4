import { DetectedFoodData, UserHealthProfile, RuleResult, FlaggedIngredient } from '../types';
import {
    HIGH_SUGAR_THRESHOLD_G_ADULT,
    HIGH_SUGAR_THRESHOLD_G_CHILD,
    HIGH_SODIUM_THRESHOLD_MG_ADULT,
    HIGH_SODIUM_THRESHOLD_MG_CHILD,
    HIGH_SATURATED_FAT_THRESHOLD_G_ADULT,
    HIGH_SATURATED_FAT_THRESHOLD_G_CHILD
} from '../scoring/riskScoreConfig';

/**
 * General warnings for high sugar, sodium, or fat factoring in age groups.
 */
export const evaluateNutritionalThresholds = (food: DetectedFoodData, profile: UserHealthProfile): RuleResult[] => {
    const results: RuleResult[] = [];
    const flags: FlaggedIngredient[] = [];
    const isChild = profile.ageGroup === 'child';

    const maxSugar = isChild ? HIGH_SUGAR_THRESHOLD_G_CHILD : HIGH_SUGAR_THRESHOLD_G_ADULT;
    const maxSodium = isChild ? HIGH_SODIUM_THRESHOLD_MG_CHILD : HIGH_SODIUM_THRESHOLD_MG_ADULT;
    const maxFat = isChild ? HIGH_SATURATED_FAT_THRESHOLD_G_CHILD : HIGH_SATURATED_FAT_THRESHOLD_G_ADULT;

    const { nutritionFacts } = food;
    if (!nutritionFacts) return results;

    if (nutritionFacts.sugar_g !== undefined && nutritionFacts.sugar_g > maxSugar) {
        flags.push({
            ingredient: 'Sugar (Nutrition)',
            severity: 'LOW',
            reason: `Contains high sugar (${nutritionFacts.sugar_g}g). Max is ${maxSugar}g.`,
            matchedRule: 'GENERAL_SUGAR'
        });
    }

    if (nutritionFacts.sodium_mg !== undefined && nutritionFacts.sodium_mg > maxSodium) {
        flags.push({
            ingredient: 'Sodium (Nutrition)',
            severity: 'LOW',
            reason: `Contains high sodium (${nutritionFacts.sodium_mg}mg). Max is ${maxSodium}mg.`,
            matchedRule: 'GENERAL_SODIUM'
        });
    }

    if (nutritionFacts.saturatedFat_g !== undefined && nutritionFacts.saturatedFat_g > maxFat) {
        flags.push({
            ingredient: 'Saturated Fat (Nutrition)',
            severity: 'LOW',
            reason: `Contains high saturated fat (${nutritionFacts.saturatedFat_g}g). Max is ${maxFat}g.`,
            matchedRule: 'GENERAL_SAT_FAT'
        });
    }

    if (flags.length > 0) {
        results.push({ flaggedIngredients: flags, riskScoreDelta: flags.length * 5 });
    }

    return results;
};
