import { DetectedFoodData, UserHealthProfile, RuleResult, FlaggedIngredient } from '../types';
import { hasFuzzyMatch } from '../utils/matchers';

const DIETARY_MAP: Record<string, { avoid: string[], name: string }> = {
    vegan: {
        name: 'Vegan',
        avoid: ['meat', 'beef', 'pork', 'chicken', 'poultry', 'fish', 'seafood', 'egg', 'milk', 'cheese', 'honey', 'gelatin', 'whey', 'casein', 'shellfish', 'shrimp', 'crab']
    },
    halal: {
        name: 'Halal',
        avoid: ['pork', 'bacon', 'ham', 'alcohol', 'wine', 'beer', 'gelatin', 'vanilla extract']
    },
    low_sodium: {
        name: 'Low-Sodium',
        avoid: ['salt', 'msg', 'monosodium glutamate', 'soy sauce', 'sodium benzoate']
    }
};

/**
 * Checks for dietary restriction conflicts (Vegan, Halal, etc.)
 */
export const evaluateDietaryRestrictions = (food: DetectedFoodData, profile: UserHealthProfile): RuleResult[] => {
    const results: RuleResult[] = [];
    const { dietaryRestrictions = [] } = profile;
    if (dietaryRestrictions.length === 0) return results;

    const { detectedIngredients = [] } = food;
    const flags: FlaggedIngredient[] = [];

    for (const restriction of dietaryRestrictions) {
        const normalizedRest = restriction.toLowerCase();
        const mapped = Object.keys(DIETARY_MAP).find(k => k === normalizedRest || k.replace('_', '-') === normalizedRest);

        if (mapped) {
            const config = DIETARY_MAP[mapped];
            detectedIngredients.forEach(ingredient => {
                if (ingredient.length > 80) return; // Skip raw unparsed text block paragraphs
                const matchedKeyword = config.avoid.find(kw => hasFuzzyMatch([ingredient], kw));
                if (matchedKeyword) {
                    const displayIng = ingredient.length > 40 ? matchedKeyword : ingredient;
                    flags.push({
                        ingredient: displayIng,
                        severity: 'MEDIUM',
                        reason: `Conflicts with ${config.name} diet (contains '${displayIng}')`,
                        matchedRule: `DIET_${mapped.toUpperCase()}`
                    });
                }
            });
        }
    }

    if (flags.length > 0) {
        results.push({ flaggedIngredients: flags });
    }

    return results;
};
