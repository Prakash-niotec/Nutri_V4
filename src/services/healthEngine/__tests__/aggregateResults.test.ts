import { aggregateResults } from '../scoring/aggregateResults';
import { RuleResult } from '../types';

describe('aggregateResults', () => {
    it('returns SAFE for empty risks', () => {
        const results: RuleResult[] = [];
        const res = aggregateResults(results);
        expect(res.overallVerdict).toBe('SAFE');
        expect(res.riskScore).toBe(0);
    });

    it('returns AVOID for critical flags', () => {
        const results: RuleResult[] = [{
            flaggedIngredients: [{ ingredient: 'peanut', severity: 'CRITICAL', reason: 'allergy', matchedRule: 'rule' }]
        }];
        const res = aggregateResults(results);
        expect(res.overallVerdict).toBe('AVOID');
        expect(res.riskScore).toBeGreaterThanOrEqual(100);
    });
});
