import { HealthEvaluationResult, RuleResult, Verdict, FlaggedIngredient } from '../types';

export const aggregateResults = (results: RuleResult[]): HealthEvaluationResult => {
    let overallVerdict: Verdict = 'SAFE';
    let riskScore = 0;

    const flaggedIngredients: FlaggedIngredient[] = [];
    const matchedAllergens = new Set<string>();
    const conditionWarningsMap = new Map<string, string>();

    results.forEach(res => {
        if (res.flaggedIngredients) {
            flaggedIngredients.push(...res.flaggedIngredients);
        }
        if (res.matchedAllergens) {
            res.matchedAllergens.forEach(a => matchedAllergens.add(a));
        }
        if (res.conditionWarnings) {
            res.conditionWarnings.forEach(cw => {
                conditionWarningsMap.set(cw.condition, cw.message);
            });
        }
        if (res.riskScoreDelta) {
            riskScore += res.riskScoreDelta;
        }
    });

    let criticalCount = 0;
    let highCount = 0;
    let mediumCount = 0;

    flaggedIngredients.forEach(flag => {
        if (flag.severity === 'CRITICAL') {
            criticalCount++;
            riskScore += 100;
        } else if (flag.severity === 'HIGH') {
            highCount++;
            riskScore += 30;
        } else if (flag.severity === 'MEDIUM') {
            mediumCount++;
            riskScore += 15;
        } else if (flag.severity === 'LOW') {
            riskScore += 5;
        }
    });

    if (riskScore > 100) riskScore = 100;

    if (criticalCount > 0 || highCount > 0 || mediumCount > 0 || flaggedIngredients.length > 0 || riskScore > 0) {
        overallVerdict = 'UNSAFE';
    } else {
        overallVerdict = 'SAFE';
    }

    const summary = criticalCount > 0
        ? `Contains critical allergens: ${Array.from(matchedAllergens).join(', ')}`
        : overallVerdict === 'UNSAFE' ? 'Unsafe to consume based on your profile or nutrient thresholds.'
        : 'Safe to consume based on your profile.';

    return {
        overallVerdict,
        riskScore,
        flaggedIngredients,
        matchedAllergens: Array.from(matchedAllergens),
        conditionWarnings: Array.from(conditionWarningsMap.entries()).map(([condition, message]) => ({ condition, message })),
        summary,
        evaluatedAt: new Date().toISOString()
    };
};
