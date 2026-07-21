const { THRESHOLDS, CONDITION_RULES } = require('./thresholds');

const evaluateProduct = (product, userConditions = [], userAllergens = []) => {
    const result = {
        safe: true,
        conditionFlags: [],
        allergenFlags: [],
        traceWarnings: []
    };

    if (!product) {
        result.safe = false;
        return result;
    }

    // 1. Check individual conditions against thresholds
    userConditions.forEach(condition => {
        const relevantNutrients = CONDITION_RULES[condition];
        if (relevantNutrients) {
            relevantNutrients.forEach(nutrient => {
                const value = product[nutrient];
                const thresholdData = THRESHOLDS[nutrient];

                if (thresholdData) {
                    if (value === null || value === undefined) {
                        // Missing data must not be treated as safe
                        result.conditionFlags.push({
                            condition,
                            nutrient,
                            value: null,
                            threshold: thresholdData.high
                        });
                        result.safe = false;
                    } else if (value > thresholdData.high) {
                        // Over the high threshold
                        result.conditionFlags.push({
                            condition,
                            nutrient,
                            value,
                            threshold: thresholdData.high
                        });
                        result.safe = false;
                    }
                }
            });
        }
    });

    // 2. Cross-check product allergens & traces against user Allergens
    const productAllergens = product.allergens_tags || [];
    const productTraces = product.traces_tags || [];

    userAllergens.forEach(userAllergen => {
        const formattedUserAllergen = userAllergen.toLowerCase();

        const isDirectMatch = productAllergens.some(a =>
            a.toLowerCase().includes(formattedUserAllergen)
        );

        if (isDirectMatch) {
            result.allergenFlags.push(userAllergen);
            result.safe = false;
        }

        const isTraceMatch = productTraces.some(t =>
            t.toLowerCase().includes(formattedUserAllergen)
        );

        if (isTraceMatch) {
            result.traceWarnings.push(userAllergen);
            result.safe = false;
        }
    });

    return result;
};

module.exports = { evaluateProduct };
