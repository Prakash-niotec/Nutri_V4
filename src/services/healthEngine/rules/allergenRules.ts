import { DetectedFoodData, UserHealthProfile, RuleResult, Allergy } from '../types';
import { ALLERGEN_SYNONYMS } from '../utils/ingredientSynonyms';
import { hasFuzzyMatch } from '../utils/matchers';

/**
 * Evaluates a product against a user's allergies.
 * Matches detected ingredients, allergen tags, and object detection labels.
 * Any match results in a CRITICAL severity and AVOID verdict.
 */
export const evaluateAllergenRules = (
    food: DetectedFoodData,
    profile: UserHealthProfile
): RuleResult[] => {
    const results: RuleResult[] = [];
    const { allergies } = profile;

    if (!allergies || allergies.length === 0) {
        return results;
    }

    const { detectedIngredients = [], detectedAllergenTags = [], objectDetectionLabel } = food;
    const searchableText = [
        ...detectedIngredients,
        ...detectedAllergenTags,
        ...(objectDetectionLabel ? [objectDetectionLabel] : []),
    ];

    if (searchableText.length === 0) {
        return results;
    }

    const matchedAllergens: string[] = [];
    const flaggedIngredients: RuleResult['flaggedIngredients'] = [];

    for (const allergy of allergies) {
        const synonyms = ALLERGEN_SYNONYMS[allergy as Allergy] || [allergy];

        for (const synonym of synonyms) {
            if (hasFuzzyMatch(searchableText, synonym)) {
                if (!matchedAllergens.includes(allergy)) {
                    matchedAllergens.push(allergy);
                }

                const matchingTargets = searchableText.filter(t => hasFuzzyMatch([t], synonym));
                for (const target of matchingTargets) {
                    // deduplicate warnings for same exact string
                    const exists = flaggedIngredients.find(f => f.ingredient === target && f.matchedRule === 'ALLERGEN_MATCH');
                    if (!exists) {
                        flaggedIngredients.push({
                            ingredient: target,
                            severity: 'CRITICAL',
                            reason: `Contains allergen: ${allergy} (matched via '${synonym}')`,
                            matchedRule: 'ALLERGEN_MATCH',
                        });
                    }
                }
            }
        }
    }

    if (matchedAllergens.length > 0 || flaggedIngredients.length > 0) {
        results.push({
            flaggedIngredients,
            matchedAllergens,
        });
    }

    return results;
};
