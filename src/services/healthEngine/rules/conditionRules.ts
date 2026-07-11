import { DetectedFoodData, UserHealthProfile, RuleResult, ConditionWarning, FlaggedIngredient } from '../types';
import { hasFuzzyMatch } from '../utils/matchers';
import {
    HIGH_SUGAR_THRESHOLD_G_ADULT,
    HIGH_SODIUM_THRESHOLD_MG_ADULT,
    HIGH_SATURATED_FAT_THRESHOLD_G_ADULT,
    HIGH_PROTEIN_THRESHOLD_G,
    REFINED_CARBS_KEYWORDS,
    HIGH_SODIUM_KEYWORDS,
    TRANS_FAT_KEYWORDS,
    POTASSIUM_PHOSPHATE_KEYWORDS
} from '../scoring/riskScoreConfig';

const checkDiabetes = (food: DetectedFoodData): RuleResult | null => {
    const { nutritionFacts, detectedIngredients = [] } = food;
    const flags: FlaggedIngredient[] = [];
    const warnings: ConditionWarning[] = [];

    if (nutritionFacts?.sugar_g !== undefined) {
        if (nutritionFacts.sugar_g > HIGH_SUGAR_THRESHOLD_G_ADULT) {
            flags.push({
                ingredient: 'Sugar (Nutrition)',
                severity: nutritionFacts.sugar_g > HIGH_SUGAR_THRESHOLD_G_ADULT * 1.5 ? 'HIGH' : 'MEDIUM',
                reason: `High sugar content (${nutritionFacts.sugar_g}g).`,
                matchedRule: 'DIABETES_SUGAR',
            });
        }
    }

    detectedIngredients.forEach(ingredient => {
        if (REFINED_CARBS_KEYWORDS.some(kw => hasFuzzyMatch([ingredient], kw))) {
            flags.push({
                ingredient,
                severity: 'MEDIUM',
                reason: 'Contains refined carbohydrates.',
                matchedRule: 'DIABETES_REFINED_CARBS',
            });
        }
    });

    if (flags.length > 0) {
        warnings.push({ condition: 'diabetes', message: 'Contains high sugar or refined carbs.' });
        return { flaggedIngredients: flags, conditionWarnings: warnings };
    }
    return null;
};

const checkHighBloodPressure = (food: DetectedFoodData): RuleResult | null => {
    const { nutritionFacts, detectedIngredients = [] } = food;
    const flags: FlaggedIngredient[] = [];
    const warnings: ConditionWarning[] = [];

    if (nutritionFacts?.sodium_mg !== undefined) {
        if (nutritionFacts.sodium_mg > HIGH_SODIUM_THRESHOLD_MG_ADULT) {
            flags.push({
                ingredient: 'Sodium (Nutrition)',
                severity: nutritionFacts.sodium_mg > HIGH_SODIUM_THRESHOLD_MG_ADULT * 1.5 ? 'HIGH' : 'MEDIUM',
                reason: `High sodium content (${nutritionFacts.sodium_mg}mg).`,
                matchedRule: 'HBP_SODIUM'
            });
        }
    }

    detectedIngredients.forEach(ingredient => {
        if (HIGH_SODIUM_KEYWORDS.some(kw => hasFuzzyMatch([ingredient], kw))) {
            flags.push({
                ingredient,
                severity: 'MEDIUM',
                reason: 'Contains sodium-rich additives.',
                matchedRule: 'HBP_SODIUM_INGREDIENT'
            });
        }
    });

    if (flags.length > 0) {
        warnings.push({ condition: 'high_blood_pressure', message: 'Product is high in sodium.' });
        return { flaggedIngredients: flags, conditionWarnings: warnings };
    }
    return null;
};

const checkHeartDisease = (food: DetectedFoodData): RuleResult | null => {
    const { nutritionFacts, detectedIngredients = [] } = food;
    const flags: FlaggedIngredient[] = [];
    const warnings: ConditionWarning[] = [];

    if (nutritionFacts?.saturatedFat_g !== undefined && nutritionFacts.saturatedFat_g > HIGH_SATURATED_FAT_THRESHOLD_G_ADULT) {
        flags.push({
            ingredient: 'Saturated Fat (Nutrition)',
            severity: 'MEDIUM',
            reason: `High saturated fat (${nutritionFacts.saturatedFat_g}g).`,
            matchedRule: 'HEART_SAT_FAT'
        });
    }

    if (nutritionFacts?.sodium_mg !== undefined && nutritionFacts.sodium_mg > HIGH_SODIUM_THRESHOLD_MG_ADULT) {
        flags.push({
            ingredient: 'Sodium (Nutrition)',
            severity: 'MEDIUM',
            reason: `High sodium content (${nutritionFacts.sodium_mg}mg).`,
            matchedRule: 'HEART_SODIUM'
        });
    }

    detectedIngredients.forEach(ingredient => {
        if (TRANS_FAT_KEYWORDS.some(kw => hasFuzzyMatch([ingredient], kw))) {
            flags.push({
                ingredient,
                severity: 'HIGH',
                reason: 'Contains trans fats.',
                matchedRule: 'HEART_TRANS_FAT'
            });
        }
    });

    if (flags.length > 0) {
        warnings.push({ condition: 'heart_disease', message: 'Contains high sodium, saturated fat, or trans fats.' });
        return { flaggedIngredients: flags, conditionWarnings: warnings };
    }

    return null;
};

const checkKidneyDisease = (food: DetectedFoodData): RuleResult | null => {
    const { nutritionFacts, detectedIngredients = [] } = food;
    const flags: FlaggedIngredient[] = [];
    const warnings: ConditionWarning[] = [];

    if (nutritionFacts?.sodium_mg !== undefined && nutritionFacts.sodium_mg > HIGH_SODIUM_THRESHOLD_MG_ADULT) {
        flags.push({
            ingredient: 'Sodium (Nutrition)',
            severity: 'HIGH',
            reason: `High sodium (${nutritionFacts.sodium_mg}mg).`,
            matchedRule: 'KIDNEY_SODIUM'
        });
    }

    if (nutritionFacts?.protein_g !== undefined && nutritionFacts.protein_g > HIGH_PROTEIN_THRESHOLD_G) {
        flags.push({
            ingredient: 'Protein (Nutrition)',
            severity: 'HIGH',
            reason: `High protein (${nutritionFacts.protein_g}g).`,
            matchedRule: 'KIDNEY_PROTEIN'
        });
    }

    detectedIngredients.forEach(ingredient => {
        if (POTASSIUM_PHOSPHATE_KEYWORDS.some(kw => hasFuzzyMatch([ingredient], kw))) {
            flags.push({
                ingredient,
                severity: 'HIGH',
                reason: 'Contains added phosphates or potassium.',
                matchedRule: 'KIDNEY_ADDITIVES'
            });
        }
    });

    if (flags.length > 0) {
        warnings.push({ condition: 'kidney_disease', message: 'Contains sodium, protein, or phosphates.' });
        return { flaggedIngredients: flags, conditionWarnings: warnings };
    }

    return null;
};

const checkHighCholesterol = (food: DetectedFoodData): RuleResult | null => {
    const { nutritionFacts, detectedIngredients = [] } = food;
    const flags: FlaggedIngredient[] = [];
    const warnings: ConditionWarning[] = [];

    if (nutritionFacts?.saturatedFat_g !== undefined && nutritionFacts.saturatedFat_g > HIGH_SATURATED_FAT_THRESHOLD_G_ADULT) {
        flags.push({
            ingredient: 'Saturated Fat (Nutrition)',
            severity: 'MEDIUM',
            reason: `High saturated fat (${nutritionFacts.saturatedFat_g}g).`,
            matchedRule: 'CHOL_SAT_FAT'
        });
    }

    detectedIngredients.forEach(ingredient => {
        if (TRANS_FAT_KEYWORDS.some(kw => hasFuzzyMatch([ingredient], kw))) {
            flags.push({
                ingredient,
                severity: 'HIGH',
                reason: 'Contains trans fats.',
                matchedRule: 'CHOL_TRANS_FAT'
            });
        }
    });

    if (flags.length > 0) {
        warnings.push({ condition: 'high_cholesterol', message: 'Contains saturated or trans fats.' });
        return { flaggedIngredients: flags, conditionWarnings: warnings };
    }

    return null;
};

/**
 * Checks product against user's specific medical conditions.
 */
export const evaluateConditionRules = (food: DetectedFoodData, profile: UserHealthProfile): RuleResult[] => {
    const results: RuleResult[] = [];
    if (!profile.medicalConditions || profile.medicalConditions.length === 0) return results;

    const { medicalConditions } = profile;

    if (medicalConditions.includes('diabetes')) {
        const res = checkDiabetes(food);
        if (res) results.push(res);
    }
    if (medicalConditions.includes('high_blood_pressure')) {
        const res = checkHighBloodPressure(food);
        if (res) results.push(res);
    }
    if (medicalConditions.includes('heart_disease')) {
        const res = checkHeartDisease(food);
        if (res) results.push(res);
    }
    if (medicalConditions.includes('kidney_disease')) {
        const res = checkKidneyDisease(food);
        if (res) results.push(res);
    }
    if (medicalConditions.includes('high_cholesterol')) {
        const res = checkHighCholesterol(food);
        if (res) results.push(res);
    }

    return results;
};
