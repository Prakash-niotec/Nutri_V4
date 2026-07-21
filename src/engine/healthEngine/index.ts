import { FoodInput, UserHealthProfile, HealthEngineVerdict, RuleResult, Severity } from './types';
import { evaluateDiabetesRule } from './rules/diabetesRule';
import { evaluateHighBloodPressureRule } from './rules/highBloodPressureRule';
import { evaluateKidneyDiseaseRule } from './rules/kidneyDiseaseRule';
import { evaluateHeartDiseaseRule } from './rules/heartDiseaseRule';
import { evaluateHighCholesterolRule } from './rules/highCholesterolRule';
import { evaluateAllergenRule } from './rules/allergenRule';

export function runConditionRule(condition: string, food: FoodInput): RuleResult {
  switch (condition) {
    case 'diabetes':
      return evaluateDiabetesRule(food.nutrition, food.ingredients);
    case 'highBloodPressure':
      return evaluateHighBloodPressureRule(food.nutrition, food.ingredients);
    case 'kidneyDisease':
      return evaluateKidneyDiseaseRule(food.nutrition, food.ingredients);
    case 'heartDisease':
      return evaluateHeartDiseaseRule(food.nutrition, food.ingredients);
    case 'highCholesterol':
      return evaluateHighCholesterolRule(food.nutrition, food.ingredients);
    default:
      // Exhaustiveness fallback
      return {
        ruleId: 'unknown-condition',
        severity: 'safe',
        reason: 'Condition logic not configured.',
      };
  }
}

export function evaluateFood(food: FoodInput, profile: UserHealthProfile): HealthEngineVerdict {
  const results: RuleResult[] = [];

  for (const condition of profile.conditions) {
    results.push(runConditionRule(condition, food));
  }

  const allergenResults = evaluateAllergenRule(food.ingredients, profile.allergens);
  results.push(...allergenResults);

  const overallSeverity = deriveOverallSeverity(results);

  return {
    overallSeverity,
    results,
    triggeredAllergens: allergenResults
      .filter(r => r.severity !== 'safe')
      .map(r => r.allergen!)
      .filter(Boolean),
    triggeredConditions: results
      .filter(r => r.condition && r.severity !== 'safe')
      .map(r => r.condition!),
  };
}

function deriveOverallSeverity(results: RuleResult[]): Severity {
  if (results.some(r => r.severity === 'avoid')) return 'avoid';
  if (results.some(r => r.severity === 'caution')) return 'caution';
  return 'safe';
}
