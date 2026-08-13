export interface ProductMetadata {
    servingSize?: string;
    servingsPerPack?: string;
    netWeight?: string;
}

export interface NutrientDisplayItem {
    label: string;
    value: number;
    unit: string;
    columnType?: 'per100g' | 'perServing' | 'unknown';
}

export interface DetectedFoodData {
    productName?: string;
    detectedIngredients: string[];
    detectedAllergenTags?: string[];
    metadata?: ProductMetadata;
    per100gItems?: NutrientDisplayItem[];
    perServingItems?: NutrientDisplayItem[];
    allNutrientItems?: NutrientDisplayItem[];
    nutritionFacts?: {
        servingSize?: string;
        calories?: number;
        sugar_g?: number;
        sodium_mg?: number;
        saturatedFat_g?: number;
        totalCarbs_g?: number;
        protein_g?: number;
        unit?: 'per100g' | 'perServing' | 'unknown';
    };
    objectDetectionLabel?: string;
    confidence?: number;
}

export type HealthCondition =
  | 'diabetes'
  | 'highBloodPressure'
  | 'heartDisease'
  | 'highCholesterol'
  | 'kidneyDisease';

export type MedicalCondition =
    | 'diabetes'
    | 'high_blood_pressure'
    | 'heart_disease'
    | 'kidney_disease'
    | 'high_cholesterol'
    | HealthCondition;

export type NutrientUnit = 'mg' | 'g' | '%DV' | '%energy';

export type LabelAvailability =
  | 'mandatory'
  | 'voluntary'
  | 'rarelyPrinted';

export interface NutrientThreshold {
  nutrient: string;
  unit: NutrientUnit;
  limit: number;
  limitMax?: number;
  comparison: 'lte' | 'gte' | 'range';
  scope: 'perServing' | 'perDay' | 'perTablespoon' | 'per100g';
  labelAvailability: LabelAvailability;
  referenceOnly: boolean;
  note?: string;
}

export interface IngredientRule {
  term: string;
  category: string;
  positionWeighting: 'high' | 'moderate' | 'flagOnly';
  isProxyForUnmeasurableNutrient?: boolean;
}

export interface ConditionRules {
  avoidIngredients: IngredientRule[];
  safeIngredients: IngredientRule[];
  nutrientThresholds: NutrientThreshold[];
}

export interface ConditionConflict {
  ingredientOrCategory: string;
  recommendedFor: HealthCondition[];
  avoidFor: HealthCondition[];
  note: string;
}

export type Allergy =
    | 'dairy'
    | 'egg'
    | 'tree_nuts'
    | 'fish'
    | 'gluten'
    | 'wheat'
    | 'sesame'
    | 'seafood'
    | 'peanuts'
    | 'soy';

export interface UserHealthProfile {
    userId: string;
    allergies: Allergy[];
    medicalConditions: MedicalCondition[];
    dietaryRestrictions: string[];
    pregnancyStatus?: boolean;
    ageGroup?: 'child' | 'adult' | 'senior';
}

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Verdict = 'SAFE' | 'UNSAFE' | 'CAUTION' | 'AVOID';

export interface FlaggedIngredient {
    ingredient: string;
    severity: Severity;
    reason: string;
    matchedRule: string;
}

export interface ConditionWarning {
    condition: string;
    message: string;
}

export interface HealthEvaluationResult {
    overallVerdict: Verdict;
    riskScore: number;
    flaggedIngredients: FlaggedIngredient[];
    matchedAllergens: string[];
    conditionWarnings: ConditionWarning[];
    summary: string;
    evaluatedAt: string;
}

export interface RuleResult {
    flaggedIngredients: FlaggedIngredient[];
    matchedAllergens?: string[];
    conditionWarnings?: ConditionWarning[];
    riskScoreDelta?: number;
}
