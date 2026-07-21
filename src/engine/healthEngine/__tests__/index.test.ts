import { evaluateFood } from '../index';
import { healthyMockFood, unhealthyMockFood, mockUserProfile } from '../mocks/mockFoodInput';

describe('Health Engine Aggregator V2 Complex Features', () => {
  it('Evaluates unhealthy mock food against profiles', () => {
    const result = evaluateFood(unhealthyMockFood, mockUserProfile);
    expect(result.overallSeverity).toBe('avoid');
    expect(result.triggeredAllergens).toContain('soy'); // from hydrolyzed soy protein
    expect(result.triggeredConditions).toContain('highBloodPressure'); // from sodium + MSG
    expect(result.triggeredConditions).toContain('heartDisease'); // from palm oil + high sat fat
  });

  it('Evaluates healthy mock food as perfectly safe for same user', () => {
    const result = evaluateFood(healthyMockFood, mockUserProfile);
    expect(result.overallSeverity).toBe('safe');
    expect(result.triggeredConditions.length).toBe(0);
  });
});
