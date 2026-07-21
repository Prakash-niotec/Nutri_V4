import { FoodInput, UserHealthProfile } from '../types';

export const healthyMockFood: FoodInput = {
  productName: 'Organic Steel Cut Oats',
  nutrition: {
    servingSizeG: 40,
    calories: 150,
    totalSugarG: 0,
    addedSugarG: 0,
    sodiumMg: 0,
    saturatedFatG: 0.5,
    transFatG: 0,
    totalCarbsG: 27,
    fiberG: 4,
    cholesterolMg: 0,
    potassiumMg: 150,
    proteinG: 5,
  },
  ingredients: [
    { rawText: 'organic steel cut oats', normalized: 'organic steel cut oats' },
  ],
};

export const unhealthyMockFood: FoodInput = {
  productName: 'Instant Ramen Cups',
  nutrition: {
    servingSizeG: 64,
    calories: 290,
    totalSugarG: 3,
    addedSugarG: 2,
    sodiumMg: 1100, // Very high sodium
    saturatedFatG: 5, // High sat fat
    transFatG: 0,
    totalCarbsG: 42,
    fiberG: 2,
    cholesterolMg: 0,
    potassiumMg: 130,
    proteinG: 6,
  },
  ingredients: [
    { rawText: 'enriched wheat flour', normalized: 'enriched wheat flour' },
    { rawText: 'palm oil', normalized: 'palm oil' }, // Heart disease / cholesterol hazard
    { rawText: 'monosodium glutamate', normalized: 'monosodium glutamate' }, // HBP hazard
    { rawText: 'hydrolyzed soy protein', normalized: 'hydrolyzed soy protein' }, // Allergen
  ],
};

export const mockUserProfile: UserHealthProfile = {
  conditions: ['highBloodPressure', 'heartDisease'],
  allergens: ['soy'],
};
