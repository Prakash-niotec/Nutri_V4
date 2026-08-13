import {
  DetectedFoodData,
  UserHealthProfile,
  RuleResult,
  ConditionWarning,
  FlaggedIngredient,
  MedicalCondition,
  HealthCondition,
  NutrientUnit,
  LabelAvailability,
  NutrientThreshold,
  IngredientRule,
  ConditionRules,
  ConditionConflict,
  Severity
} from '../types';
import { hasFuzzyMatch } from '../utils/matchers';

// Export types for consumers
export type {
  HealthCondition,
  NutrientUnit,
  LabelAvailability,
  NutrientThreshold,
  IngredientRule,
  ConditionRules,
  ConditionConflict
};

// ---------------------------------------------------------------------------
// 1. DIABETES
// ---------------------------------------------------------------------------
const diabetesRules: ConditionRules = {
  avoidIngredients: [
    { term: 'sugar', category: 'addedSugar', positionWeighting: 'high' },
    { term: 'brown sugar', category: 'addedSugar', positionWeighting: 'high' },
    { term: 'glucose', category: 'addedSugar', positionWeighting: 'high' },
    { term: 'fructose', category: 'addedSugar', positionWeighting: 'high' },
    { term: 'sucrose', category: 'addedSugar', positionWeighting: 'high' },
  ],
  safeIngredients: [
    { term: 'oats', category: 'highFibre', positionWeighting: 'moderate' },
    { term: 'bran', category: 'highFibre', positionWeighting: 'moderate' }, // conflicts with CKD — see CONDITION_CONFLICTS
    { term: 'psyllium', category: 'solubleFibre', positionWeighting: 'moderate' },
    { term: 'olive oil', category: 'unsaturatedFat', positionWeighting: 'moderate' },
    { term: 'canola oil', category: 'unsaturatedFat', positionWeighting: 'moderate' },
    { term: 'nuts', category: 'unsaturatedFat', positionWeighting: 'moderate' }, // conflicts with CKD
    { term: 'seeds', category: 'unsaturatedFat', positionWeighting: 'moderate' },
    { term: 'fish', category: 'unsaturatedFat', positionWeighting: 'moderate' },
  ],
  nutrientThresholds: [
    { nutrient: 'fibre', unit: 'g', limit: 4, comparison: 'gte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false, note: 'high-fibre threshold' },
    { nutrient: 'sugar', unit: 'g', limit: 0.5, comparison: 'lte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false, note: '"sugar-free" claim threshold' },
    { nutrient: 'sugar', unit: '%DV', limit: 25, comparison: 'gte', scope: 'perServing', labelAvailability: 'voluntary', referenceOnly: false, note: '"reduced sugar" claim = at least 25% less than regular product' },
  ],
};

// ---------------------------------------------------------------------------
// 2. HIGH BLOOD PRESSURE (HYPERTENSION)
// ---------------------------------------------------------------------------
const highBloodPressureRules: ConditionRules = {
  avoidIngredients: [
    { term: 'sodium', category: 'sodium', positionWeighting: 'high' },
    { term: 'salt', category: 'sodium', positionWeighting: 'high' },
    { term: 'frozen pizza', category: 'processedFood', positionWeighting: 'flagOnly' },
    { term: 'canned soup', category: 'processedFood', positionWeighting: 'flagOnly' },
    { term: 'salted nuts', category: 'sodium', positionWeighting: 'moderate' },
    { term: 'chips', category: 'sodium', positionWeighting: 'flagOnly' },
    { term: 'ham', category: 'sodium', positionWeighting: 'moderate' },
  ],
  safeIngredients: [],
  nutrientThresholds: [
    { nutrient: 'sodium', unit: 'mg', limit: 2000, comparison: 'lte', scope: 'perDay', labelAvailability: 'mandatory', referenceOnly: true, note: 'daily recommended limit — education/UI only' },
    { nutrient: 'sodium', unit: 'mg', limit: 120, comparison: 'lte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false, note: 'ideal (0-5% DV)' },
    { nutrient: 'sodium', unit: 'mg', limit: 121, limitMax: 360, comparison: 'range', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false, note: 'moderate (6-14% DV) — consume in moderation' },
    { nutrient: 'sodium', unit: 'mg', limit: 360, comparison: 'gte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false, note: 'avoid (≥15% DV)' },
  ],
};

// ---------------------------------------------------------------------------
// 3. HEART DISEASE
// ---------------------------------------------------------------------------
const heartDiseaseRules: ConditionRules = {
  avoidIngredients: [
    { term: 'animal fat', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'lard', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'hardened fat', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'hardened oil', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'egg yolk solids', category: 'saturatedFat', positionWeighting: 'moderate' },
    { term: 'cream', category: 'saturatedFat', positionWeighting: 'moderate' },
    { term: 'butter', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'whole-milk solids', category: 'saturatedFat', positionWeighting: 'moderate' },
    { term: 'palm oil', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'palm kernel oil', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'hydrogenated vegetable oil', category: 'transFat', positionWeighting: 'high' },
    { term: 'vegetable shortening', category: 'transFat', positionWeighting: 'high' },
    { term: 'coconut', category: 'saturatedFat', positionWeighting: 'moderate' },
    { term: 'coconut oil', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'cocoa butter', category: 'saturatedFat', positionWeighting: 'moderate' },
    { term: 'sausages', category: 'saturatedFat', positionWeighting: 'flagOnly' },
    { term: 'cured meats', category: 'saturatedFat', positionWeighting: 'flagOnly' },
    { term: 'margarine', category: 'transFat', positionWeighting: 'moderate' }, // stick form; see safe list for liquid form
    { term: 'pastry', category: 'transFat', positionWeighting: 'flagOnly' },
  ],
  safeIngredients: [
    { term: 'liquid vegetable oil', category: 'unsaturatedFat', positionWeighting: 'moderate' },
    { term: 'soft margarine', category: 'unsaturatedFat', positionWeighting: 'moderate' },
  ],
  nutrientThresholds: [
    { nutrient: 'totalFat', unit: '%energy', limit: 20, limitMax: 35, comparison: 'range', scope: 'perDay', labelAvailability: 'mandatory', referenceOnly: true, note: '≈65g on a 2000-kcal diet — education only' },
    { nutrient: 'saturatedFat', unit: '%energy', limit: 10, comparison: 'lte', scope: 'perDay', labelAvailability: 'mandatory', referenceOnly: true, note: 'AHA stricter guidance: 5-6%; max 20g on 2000-kcal diet — education only' },
    { nutrient: 'transFat', unit: '%energy', limit: 1, comparison: 'lte', scope: 'perDay', labelAvailability: 'mandatory', referenceOnly: true, note: 'max 2.2g on 2000-kcal diet — education only' },
    { nutrient: 'saturatedFat', unit: 'g', limit: 2, comparison: 'lte', scope: 'perTablespoon', labelAvailability: 'mandatory', referenceOnly: false, note: 'margarine selection threshold' },
    { nutrient: 'totalFat', unit: '%DV', limit: 5, comparison: 'lte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false },
    { nutrient: 'saturatedFat', unit: '%DV', limit: 5, comparison: 'lte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false },
    { nutrient: 'transFat', unit: '%DV', limit: 5, comparison: 'lte', scope: 'perServing', labelAvailability: 'voluntary', referenceOnly: false, note: 'trans fat has no established %DV on many labels — fall back to gram threshold if %DV absent' },
    { nutrient: 'cholesterol', unit: '%DV', limit: 5, comparison: 'lte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false },
    { nutrient: 'sodium', unit: '%DV', limit: 5, comparison: 'lte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false },
  ],
};

// ---------------------------------------------------------------------------
// 4. HIGH CHOLESTEROL
// ---------------------------------------------------------------------------
const highCholesterolRules: ConditionRules = {
  avoidIngredients: [
    { term: 'animal fat', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'lard', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'hardened fat', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'hardened oil', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'egg yolk solids', category: 'dietaryCholesterol', positionWeighting: 'moderate' },
    { term: 'cream', category: 'saturatedFat', positionWeighting: 'moderate' },
    { term: 'butter', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'whole-milk solids', category: 'saturatedFat', positionWeighting: 'moderate' },
    { term: 'palm oil', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'palm kernel oil', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'hydrogenated vegetable oil', category: 'transFat', positionWeighting: 'high' },
    { term: 'vegetable shortening', category: 'transFat', positionWeighting: 'high' },
    { term: 'coconut', category: 'saturatedFat', positionWeighting: 'moderate' },
    { term: 'coconut oil', category: 'saturatedFat', positionWeighting: 'high' },
    { term: 'cocoa butter', category: 'saturatedFat', positionWeighting: 'moderate' },
  ],
  safeIngredients: [
    { term: 'polyunsaturated fat', category: 'unsaturatedFat', positionWeighting: 'moderate' },
    { term: 'monounsaturated fat', category: 'unsaturatedFat', positionWeighting: 'moderate' },
  ],
  nutrientThresholds: [
    { nutrient: 'totalFat', unit: '%DV', limit: 5, comparison: 'lte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false },
    { nutrient: 'saturatedFat', unit: '%DV', limit: 5, comparison: 'lte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false },
    { nutrient: 'transFat', unit: '%DV', limit: 5, comparison: 'lte', scope: 'perServing', labelAvailability: 'voluntary', referenceOnly: false },
    { nutrient: 'cholesterol', unit: '%DV', limit: 5, comparison: 'lte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false },
  ],
};

// ---------------------------------------------------------------------------
// 5. KIDNEY DISEASE (CKD)
// ---------------------------------------------------------------------------
const kidneyDiseaseRules: ConditionRules = {
  avoidIngredients: [
    // Additive keywords — the ONLY way to detect phosphorus, since it is
    // rarely printed as a numeric value on the Nutrition Facts panel.
    { term: 'phosphate', category: 'phosphorusAdditive', positionWeighting: 'high', isProxyForUnmeasurableNutrient: true },
    { term: 'phosphoric acid', category: 'phosphorusAdditive', positionWeighting: 'high', isProxyForUnmeasurableNutrient: true },
    { term: 'potassium chloride', category: 'potassiumAdditive', positionWeighting: 'high' },
    // Grains
    { term: 'whole wheat bread', category: 'highPhosphorusGrain', positionWeighting: 'flagOnly' },
    { term: 'brown rice', category: 'highPhosphorusGrain', positionWeighting: 'flagOnly' },
    { term: 'bran', category: 'highPhosphorusGrain', positionWeighting: 'moderate' },
    { term: 'bran cereal', category: 'highPhosphorusGrain', positionWeighting: 'flagOnly' },
    { term: 'wheat germ', category: 'highPhosphorusGrain', positionWeighting: 'moderate' },
    { term: 'pancakes', category: 'highPhosphorusGrain', positionWeighting: 'flagOnly' },
    { term: 'waffles', category: 'highPhosphorusGrain', positionWeighting: 'flagOnly' },
    { term: 'biscuits', category: 'highPhosphorusGrain', positionWeighting: 'flagOnly' },
    // Fruits
    { term: 'avocado', category: 'highPotassiumFruit', positionWeighting: 'moderate' },
    { term: 'banana', category: 'highPotassiumFruit', positionWeighting: 'moderate' },
    { term: 'orange', category: 'highPotassiumFruit', positionWeighting: 'moderate' },
    { term: 'orange juice', category: 'highPotassiumFruit', positionWeighting: 'moderate' },
    { term: 'apricot', category: 'highPotassiumFruit', positionWeighting: 'moderate' },
    { term: 'dates', category: 'highPotassiumFruit', positionWeighting: 'moderate' },
    { term: 'raisins', category: 'highPotassiumFruit', positionWeighting: 'moderate' },
    { term: 'prunes', category: 'highPotassiumFruit', positionWeighting: 'moderate' },
    { term: 'cantaloupe', category: 'highPotassiumFruit', positionWeighting: 'flagOnly' },
    { term: 'honeydew', category: 'highPotassiumFruit', positionWeighting: 'flagOnly' },
    { term: 'kiwi', category: 'highPotassiumFruit', positionWeighting: 'flagOnly' },
    { term: 'mango', category: 'highPotassiumFruit', positionWeighting: 'flagOnly' },
    { term: 'nectarine', category: 'highPotassiumFruit', positionWeighting: 'flagOnly' },
    { term: 'papaya', category: 'highPotassiumFruit', positionWeighting: 'flagOnly' },
    // Vegetables
    { term: 'potato', category: 'highPotassiumVeg', positionWeighting: 'moderate' },
    { term: 'sweet potato', category: 'highPotassiumVeg', positionWeighting: 'moderate' },
    { term: 'tomato', category: 'highPotassiumVeg', positionWeighting: 'moderate' },
    { term: 'tomato sauce', category: 'highPotassiumVeg', positionWeighting: 'high' },
    { term: 'swiss chard', category: 'highPotassiumVeg', positionWeighting: 'flagOnly' },
    { term: 'spinach', category: 'highPotassiumVeg', positionWeighting: 'moderate' },
    { term: 'beet greens', category: 'highPotassiumVeg', positionWeighting: 'flagOnly' },
    { term: 'artichoke', category: 'highPotassiumVeg', positionWeighting: 'flagOnly' },
    { term: 'beets', category: 'highPotassiumVeg', positionWeighting: 'flagOnly' },
    { term: 'pumpkin', category: 'highPotassiumVeg', positionWeighting: 'flagOnly' },
    { term: 'winter squash', category: 'highPotassiumVeg', positionWeighting: 'flagOnly' },
    // Dairy
    { term: 'whole milk', category: 'highPhosphorusDairy', positionWeighting: 'moderate' },
    { term: 'cheese', category: 'highPhosphorusDairy', positionWeighting: 'moderate' },
    { term: 'cottage cheese', category: 'highPhosphorusDairy', positionWeighting: 'moderate' },
    { term: 'yogurt', category: 'highPhosphorusDairy', positionWeighting: 'moderate' },
    { term: 'ice cream', category: 'highPhosphorusDairy', positionWeighting: 'moderate' },
    { term: 'pudding', category: 'highPhosphorusDairy', positionWeighting: 'flagOnly' },
    // Protein
    { term: 'hot dog', category: 'processedMeat', positionWeighting: 'high' },
    { term: 'bacon', category: 'processedMeat', positionWeighting: 'high' },
    { term: 'pepperoni', category: 'processedMeat', positionWeighting: 'high' },
    { term: 'jerky', category: 'processedMeat', positionWeighting: 'high' },
    { term: 'sausage', category: 'processedMeat', positionWeighting: 'high' },
    { term: 'legumes', category: 'highPotassiumProtein', positionWeighting: 'moderate' },
    { term: 'nuts', category: 'highPotassiumProtein', positionWeighting: 'moderate' },
    { term: 'organ meat', category: 'highPhosphorusProtein', positionWeighting: 'high' },
    { term: 'sardines', category: 'highPhosphorusProtein', positionWeighting: 'moderate' },
    // Packaged / processed
    { term: 'dark cola', category: 'phosphorusAdditive', positionWeighting: 'flagOnly', isProxyForUnmeasurableNutrient: true },
    { term: 'canned soup', category: 'sodium', positionWeighting: 'flagOnly' },
    { term: 'canned vegetables', category: 'sodium', positionWeighting: 'flagOnly' },
    { term: 'canned beans', category: 'sodium', positionWeighting: 'flagOnly' },
    { term: 'pickles', category: 'sodium', positionWeighting: 'flagOnly' },
    { term: 'olives', category: 'sodium', positionWeighting: 'flagOnly' },
    { term: 'relish', category: 'sodium', positionWeighting: 'flagOnly' },
    { term: 'frozen pizza', category: 'sodium', positionWeighting: 'flagOnly' },
    { term: 'microwaveable meal', category: 'sodium', positionWeighting: 'flagOnly' },
    { term: 'instant noodles', category: 'sodium', positionWeighting: 'flagOnly' },
    { term: 'pretzels', category: 'sodium', positionWeighting: 'flagOnly' },
    { term: 'chips', category: 'sodium', positionWeighting: 'flagOnly' },
    { term: 'crackers', category: 'sodium', positionWeighting: 'flagOnly' },
    { term: 'sports drink', category: 'electrolyte', positionWeighting: 'flagOnly' },
    // Other
    { term: 'salt substitute', category: 'potassiumAdditive', positionWeighting: 'high' }, // conflicts with hypertension guidance
    { term: 'chocolate', category: 'phosphorusAdditive', positionWeighting: 'moderate', isProxyForUnmeasurableNutrient: true },
    { term: 'cocoa', category: 'phosphorusAdditive', positionWeighting: 'moderate', isProxyForUnmeasurableNutrient: true },
    { term: 'beer', category: 'phosphorusAdditive', positionWeighting: 'flagOnly', isProxyForUnmeasurableNutrient: true },
    { term: 'caramel', category: 'phosphorusAdditive', positionWeighting: 'flagOnly', isProxyForUnmeasurableNutrient: true },
  ],
  safeIngredients: [
    { term: 'white bread', category: 'lowPhosphorusGrain', positionWeighting: 'flagOnly' },
    { term: 'bulgur', category: 'lowPhosphorusGrain', positionWeighting: 'flagOnly' },
    { term: 'buckwheat', category: 'lowPhosphorusGrain', positionWeighting: 'flagOnly' },
    { term: 'pearled barley', category: 'lowPhosphorusGrain', positionWeighting: 'flagOnly' },
    { term: 'couscous', category: 'lowPhosphorusGrain', positionWeighting: 'flagOnly' },
    { term: 'white rice', category: 'lowPhosphorusGrain', positionWeighting: 'flagOnly' },
    { term: 'pineapple', category: 'lowPotassiumFruit', positionWeighting: 'flagOnly' },
    { term: 'grapes', category: 'lowPotassiumFruit', positionWeighting: 'flagOnly' },
    { term: 'apple', category: 'lowPotassiumFruit', positionWeighting: 'flagOnly' },
    { term: 'cranberries', category: 'lowPotassiumFruit', positionWeighting: 'flagOnly' },
    { term: 'strawberries', category: 'lowPotassiumFruit', positionWeighting: 'flagOnly' },
    { term: 'blueberries', category: 'lowPotassiumFruit', positionWeighting: 'flagOnly' },
    { term: 'pomegranate', category: 'lowPotassiumFruit', positionWeighting: 'flagOnly' },
    { term: 'roasted red pepper sauce', category: 'lowPotassiumVeg', positionWeighting: 'flagOnly' },
    { term: 'rice milk', category: 'dairyAlternative', positionWeighting: 'flagOnly' }, // unenriched
    { term: 'almond milk', category: 'dairyAlternative', positionWeighting: 'flagOnly' },
    { term: 'oat milk', category: 'dairyAlternative', positionWeighting: 'flagOnly' },
    { term: 'soy milk', category: 'dairyAlternative', positionWeighting: 'flagOnly' },
    { term: 'tofu', category: 'lowPhosphorusProtein', positionWeighting: 'flagOnly' },
    { term: 'goat cheese', category: 'lowPhosphorusDairy', positionWeighting: 'flagOnly' },
    { term: 'grated parmesan', category: 'lowPhosphorusDairy', positionWeighting: 'flagOnly' },
    { term: 'mozzarella', category: 'lowPhosphorusDairy', positionWeighting: 'flagOnly' },
    { term: 'monterey jack', category: 'lowPhosphorusDairy', positionWeighting: 'flagOnly' },
    { term: 'swiss cheese', category: 'lowPhosphorusDairy', positionWeighting: 'flagOnly' },
    { term: 'brie', category: 'lowPhosphorusDairy', positionWeighting: 'flagOnly' },
    { term: 'olive oil', category: 'healthyOil', positionWeighting: 'flagOnly' },
    { term: 'safflower oil', category: 'healthyOil', positionWeighting: 'flagOnly' },
    { term: 'sesame oil', category: 'healthyOil', positionWeighting: 'flagOnly' },
    { term: 'sodium-free spice', category: 'sodiumAlternative', positionWeighting: 'flagOnly' },
    { term: 'lemon-lime soda', category: 'lowPhosphorusBeverage', positionWeighting: 'flagOnly' },
    { term: 'grape soda', category: 'lowPhosphorusBeverage', positionWeighting: 'flagOnly' },
    { term: 'cream soda', category: 'lowPhosphorusBeverage', positionWeighting: 'flagOnly' },
    { term: 'root beer', category: 'lowPhosphorusBeverage', positionWeighting: 'flagOnly' },
  ],
  nutrientThresholds: [
    // Sodium — mandatory on label, real perServing check available
    { nutrient: 'sodium', unit: 'mg', limit: 1500, limitMax: 2300, comparison: 'range', scope: 'perDay', labelAvailability: 'mandatory', referenceOnly: true, note: 'daily target range — education only' },
    { nutrient: 'sodium', unit: 'mg', limit: 120, comparison: 'lte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false, note: 'ideal (0-5% DV) — same band as hypertension' },
    { nutrient: 'sodium', unit: 'mg', limit: 360, comparison: 'gte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false, note: 'avoid (≥15% DV)' },
    // Potassium — mandatory on FDA-style labels since 2016; real perServing check now available
    { nutrient: 'potassium', unit: 'mg', limit: 2000, limitMax: 2500, comparison: 'range', scope: 'perDay', labelAvailability: 'mandatory', referenceOnly: true, note: 'daily target range — education only' },
    { nutrient: 'potassium', unit: '%DV', limit: 5, comparison: 'lte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false, note: 'ideal (≤5% DV) — mirrors sodium banding' },
    { nutrient: 'potassium', unit: '%DV', limit: 6, limitMax: 14, comparison: 'range', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false, note: 'moderate (6-14% DV)' },
    { nutrient: 'potassium', unit: '%DV', limit: 15, comparison: 'gte', scope: 'perServing', labelAvailability: 'mandatory', referenceOnly: false, note: 'avoid (≥15% DV)' },
    // Phosphorus — NOT reliably printed; numeric threshold kept as reference
    // only. Real detection happens via avoidIngredients keyword matches
    // (isProxyForUnmeasurableNutrient: true) above.
    { nutrient: 'phosphorus', unit: 'mg', limit: 800, limitMax: 1000, comparison: 'range', scope: 'perDay', labelAvailability: 'rarelyPrinted', referenceOnly: true, note: 'daily target range — cannot be checked per-product from most labels; use ingredient-keyword flags instead' },
  ],
};

export const HEALTH_CONDITION_RULES: Record<HealthCondition, ConditionRules> = {
  diabetes: diabetesRules,
  highBloodPressure: highBloodPressureRules,
  heartDisease: heartDiseaseRules,
  highCholesterol: highCholesterolRules,
  kidneyDisease: kidneyDiseaseRules,
};

// ---------------------------------------------------------------------------
// CROSS-CONDITION CONFLICT MATRIX
// ---------------------------------------------------------------------------
export const CONDITION_CONFLICTS: ConditionConflict[] = [
  {
    ingredientOrCategory: 'wholeGrains (whole wheat bread, brown rice, bran)',
    recommendedFor: ['diabetes'],
    avoidFor: ['kidneyDisease'],
    note: 'High fibre helps blood glucose control but high phosphorus/potassium content is unsafe for CKD. CKD rule should override.',
  },
  {
    ingredientOrCategory: 'dairy (milk, yogurt, cheese)',
    recommendedFor: [],
    avoidFor: ['kidneyDisease'],
    note: 'Good complete-protein source generally, but high phosphorus/potassium makes it unsafe for CKD. Low-phosphorus cheeses (goat, parmesan, mozzarella, Monterey Jack, Swiss, brie) are an exception.',
  },
  {
    ingredientOrCategory: 'potassiumRichFruitsVeg (avocado, banana, spinach, sweet potato, tomato, apricot, orange)',
    recommendedFor: [],
    avoidFor: ['kidneyDisease'],
    note: 'Generally nutritious for a healthy diet but must be avoided/severely limited for CKD.',
  },
  {
    ingredientOrCategory: 'nutsSeedsLegumes',
    recommendedFor: ['diabetes', 'heartDisease'],
    avoidFor: ['kidneyDisease'],
    note: 'Healthy unsaturated fat source for diabetes/heart health, but high potassium/phosphorus is dangerous for CKD. CKD rule should override.',
  },
  {
    ingredientOrCategory: 'saltSubstitute (potassium chloride based)',
    recommendedFor: ['highBloodPressure'],
    avoidFor: ['kidneyDisease'],
    note: 'Standard advice for reducing sodium intake in hypertension, but causes dangerous potassium spikes in CKD. CKD rule must always override, regardless of hypertension comorbidity.',
  },
];

// ---------------------------------------------------------------------------
// RULE-ENGINE GUARDRAILS
// ---------------------------------------------------------------------------
export const ENGINE_GUARDRAILS: string[] = [
  'Do not approve a product based on a single nutrient axis (e.g. "low fat") without checking sugar/carb thresholds too — many low-fat/fat-free products compensate with added sugar.',
  'Never use a `referenceOnly: true` threshold as a pass/fail check on a single product — those exist for UI/education copy only, since NutriLens has no visibility into the user\'s total daily diet.',
  'Weight ingredient-list matches by `positionWeighting`, not as a flat boolean — a term appearing in the first 1-3 ingredients (`high`) is a materially bigger concern than the same term appearing near the end of a long ingredient list (`flagOnly`).',
  'For nutrients marked `labelAvailability: "rarelyPrinted"` (currently: phosphorus), never attempt a numeric per-serving check — rely solely on `isProxyForUnmeasurableNutrient` ingredient-keyword matches and present the result as a flag/warning, not a precise measurement.',
  'Account for preparation state when matching ingredients: cooked/reduced versions (e.g. cooked spinach) and dried versions (e.g. dried apricots, raisins, prunes) have concentrated nutrient loads compared to fresh/raw equivalents. Do not apply raw-food nutrient assumptions to a cooked or dried packaged product.',
  'Evaluate against realistic total-package consumption, not only the manufacturer-declared "per serving" values — flag when a package contains multiple servings that are commonly consumed in one sitting (e.g. chips, bread).',
  'For users with multiple conditions, always resolve to the most restrictive rule across all their active conditions (see CONDITION_CONFLICTS) rather than averaging or picking the first matched condition.',
  'Verify locally sold packaging (Sri Lanka / SLS-standard labels) actually prints potassium, fibre, and added-sugar fields before relying on `labelAvailability: "mandatory"` — that classification assumes FDA-style labeling and may not hold for all local products.',
];

// Helper mapping for condition keys
const normalizeConditionKey = (cond: MedicalCondition): HealthCondition | null => {
  if (cond === 'diabetes') return 'diabetes';
  if (cond === 'high_blood_pressure' || cond === 'highBloodPressure') return 'highBloodPressure';
  if (cond === 'heart_disease' || cond === 'heartDisease') return 'heartDisease';
  if (cond === 'high_cholesterol' || cond === 'highCholesterol') return 'highCholesterol';
  if (cond === 'kidney_disease' || cond === 'kidneyDisease') return 'kidneyDisease';
  return null;
};

/**
 * Dynamic Rule Evaluator for Health Conditions (v2)
 */
export const evaluateConditionRules = (food: DetectedFoodData, profile: UserHealthProfile): RuleResult[] => {
  const results: RuleResult[] = [];
  if (!profile.medicalConditions || profile.medicalConditions.length === 0) return results;

  const activeHealthConditions: HealthCondition[] = profile.medicalConditions
    .map(normalizeConditionKey)
    .filter((c): c is HealthCondition => c !== null);

  if (activeHealthConditions.length === 0) return results;

  const totalIngredientsCount = food.detectedIngredients?.length || 0;

  activeHealthConditions.forEach(conditionKey => {
    const ruleset = HEALTH_CONDITION_RULES[conditionKey];
    if (!ruleset) return;

    const flags: FlaggedIngredient[] = [];
    const warnings: ConditionWarning[] = [];

    // 1. Ingredient-level Checks with Position Weighting
    if (food.detectedIngredients && food.detectedIngredients.length > 0) {
      ruleset.avoidIngredients.forEach(rule => {
        const matchedIdx = food.detectedIngredients.findIndex(ing => hasFuzzyMatch([ing], rule.term));
        if (matchedIdx !== -1) {
          const matchedIngText = food.detectedIngredients[matchedIdx];
          
          // Calculate positional weight: ingredients 0..2 or first 33% = high position
          let isEarlyInList = matchedIdx <= 2 || (totalIngredientsCount > 0 && matchedIdx < totalIngredientsCount * 0.33);

          let severity: Severity = 'MEDIUM';
          if (rule.positionWeighting === 'high') {
            severity = isEarlyInList ? 'HIGH' : 'MEDIUM';
          } else if (rule.positionWeighting === 'moderate') {
            severity = 'MEDIUM';
          } else if (rule.positionWeighting === 'flagOnly') {
            severity = 'LOW';
          }

          let reasonStr = `Contains ${matchedIngText} (${rule.category}), which should be limited/avoided for ${conditionKey}.`;
          if (rule.isProxyForUnmeasurableNutrient) {
            reasonStr = `Contains ${matchedIngText} (${rule.category} additive — unmeasurable on standard panel).`;
          } else if (isEarlyInList && rule.positionWeighting === 'high') {
            reasonStr = `High priority ingredient: ${matchedIngText} is listed in the top ingredients (${rule.category}).`;
          }

          flags.push({
            ingredient: matchedIngText,
            severity,
            reason: reasonStr,
            matchedRule: `${conditionKey.toUpperCase()}_INGREDIENT_${rule.term.toUpperCase().replace(/\s+/g, '_')}`
          });
        }
      });
    }

    // 2. Numeric Threshold Checks (Filtering out referenceOnly & rarelyPrinted)
    ruleset.nutrientThresholds.forEach(thresh => {
      // Guardrail 2: Never use referenceOnly as pass/fail check on a single product
      if (thresh.referenceOnly) return;

      // Guardrail 4: Rarely printed nutrients (e.g. phosphorus) use keyword proxies instead
      if (thresh.labelAvailability === 'rarelyPrinted') return;

      let val: number | undefined;
      const key = thresh.nutrient.toLowerCase();

      if (key.includes('sugar')) {
        val = food.nutritionFacts?.sugar_g;
      } else if (key.includes('sodium')) {
        val = food.nutritionFacts?.sodium_mg;
      } else if (key.includes('saturatedfat') || key.includes('satfat')) {
        val = food.nutritionFacts?.saturatedFat_g;
      } else if (key.includes('totalfat') || key.includes('fat')) {
        val = food.allNutrientItems?.find(i => /total fat|fat/i.test(i.label))?.value;
      } else if (key.includes('protein')) {
        val = food.nutritionFacts?.protein_g;
      } else if (key.includes('potassium')) {
        val = food.allNutrientItems?.find(i => /potassium/i.test(i.label))?.value;
      } else if (key.includes('fibre') || key.includes('fiber')) {
        val = food.allNutrientItems?.find(i => /fibre|fiber/i.test(i.label))?.value;
      } else if (key.includes('cholesterol')) {
        val = food.allNutrientItems?.find(i => /cholesterol/i.test(i.label))?.value;
      }

      if (val !== undefined) {
        if (thresh.comparison === 'lte' && val > thresh.limit) {
          flags.push({
            ingredient: `${thresh.nutrient} (Nutrition panel)`,
            severity: val > thresh.limit * 1.5 ? 'HIGH' : 'MEDIUM',
            reason: `High ${thresh.nutrient} (${val}${thresh.unit}). Limit for ${conditionKey} is ${thresh.limit}${thresh.unit}.`,
            matchedRule: `${conditionKey.toUpperCase()}_THRESHOLD_${thresh.nutrient.toUpperCase()}`
          });
        } else if (thresh.comparison === 'range' && thresh.limitMax !== undefined) {
          if (val >= thresh.limit && val <= thresh.limitMax) {
            flags.push({
              ingredient: `${thresh.nutrient} (Nutrition panel)`,
              severity: 'LOW',
              reason: `Moderate ${thresh.nutrient} (${val}${thresh.unit}). Consume in moderation for ${conditionKey}.`,
              matchedRule: `${conditionKey.toUpperCase()}_RANGE_${thresh.nutrient.toUpperCase()}`
            });
          }
        }
      }
    });

    if (flags.length > 0) {
      warnings.push({
        condition: conditionKey,
        message: `Product triggered ${flags.length} warning(s) for ${conditionKey}.`
      });
      results.push({ flaggedIngredients: flags, conditionWarnings: warnings });
    }
  });

  // 3. Comorbidity Conflict Resolution (Most Restrictive Override)
  if (activeHealthConditions.length > 1) {
    CONDITION_CONFLICTS.forEach(conflict => {
      const hasAvoidCondition = conflict.avoidFor.some(ac => activeHealthConditions.includes(ac));
      const hasRecommendCondition = conflict.recommendedFor.some(rc => activeHealthConditions.includes(rc));

      if (hasAvoidCondition && hasRecommendCondition) {
        // Enforce most restrictive rule
        results.forEach(res => {
          if (res.conditionWarnings) {
            res.conditionWarnings.push({
              condition: 'COMORBIDITY_OVERRIDE',
              message: `⚠️ Comorbidity Conflict Override: ${conflict.note}`
            });
          }
        });
      }
    });
  }

  return results;
};
