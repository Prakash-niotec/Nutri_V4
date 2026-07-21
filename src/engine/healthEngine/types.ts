export type HealthCondition =
  | 'diabetes'
  | 'highBloodPressure'
  | 'heartDisease'
  | 'kidneyDisease'
  | 'highCholesterol';

export type Allergen =
  | 'peanuts'
  | 'treeNuts'
  | 'milk'
  | 'eggs'
  | 'soy'
  | 'wheatGluten'
  | 'fish'
  | 'shellfish'
  | 'sesame'
  | 'sulfites';

export interface UserHealthProfile {
  conditions: HealthCondition[];
  allergens: Allergen[];
}

export interface NutritionFacts {
  servingSizeG: number;
  calories: number;
  totalSugarG: number;
  addedSugarG: number;
  sodiumMg: number;
  saturatedFatG: number;
  transFatG: number;
  totalCarbsG: number;
  fiberG: number;
  cholesterolMg: number;
  potassiumMg: number;
  proteinG: number;
}

export interface DetectedIngredient {
  rawText: string;      
  normalized: string;   
}

export interface FoodInput {
  productName: string;
  nutrition: NutritionFacts;
  ingredients: DetectedIngredient[];
}

export type Severity = 'safe' | 'caution' | 'avoid';

export interface RuleResult {
  ruleId: string;
  condition?: HealthCondition;
  allergen?: Allergen;
  severity: Severity;
  reason: string;
}

export interface HealthEngineVerdict {
  overallSeverity: Severity;
  results: RuleResult[];
  triggeredAllergens: Allergen[];
  triggeredConditions: HealthCondition[];
}
