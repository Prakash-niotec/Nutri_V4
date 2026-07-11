import { DetectedFoodData } from '../../services/healthEngine/types';

// Fixture 1: Completely clean product
export const foodCleanApple: DetectedFoodData = {
    productName: 'Organic Gala Apple',
    detectedIngredients: ['apple'],
    nutritionFacts: {
        servingSize: '1 medium (182g)',
        calories: 95,
        sugar_g: 19,
        sodium_mg: 2,
        saturatedFat_g: 0,
        totalCarbs_g: 25,
        protein_g: 0.5,
    },
    objectDetectionLabel: 'apple',
    confidence: 0.98,
};

// Fixture 2: Multiple critical allergens
export const foodPeanutButterCup: DetectedFoodData = {
    productName: 'Peanut Butter Chocolate Cup',
    detectedIngredients: ['milk chocolate', 'sugar', 'cocoa butter', 'chocolate', 'skim milk', 'milk fat', 'lactose', 'lecithin', 'pgpr', 'peanuts', 'sugar', 'dextrose', 'salt', 'tbhq', 'citric acid'],
    detectedAllergenTags: ['Contains Peanuts', 'Contains Milk', 'Contains Soy'],
    nutritionFacts: {
        servingSize: '2 cups (42g)',
        calories: 210,
        sugar_g: 22,
        sodium_mg: 150,
        saturatedFat_g: 4.5,
        totalCarbs_g: 24,
        protein_g: 5,
    },
    confidence: 0.95,
};

// Fixture 3: Borderline sugar case
export const foodGranolaBar: DetectedFoodData = {
    productName: 'Oats & Honey Granola Bar',
    detectedIngredients: ['whole grain oats', 'sugar', 'canola oil', 'rice flour', 'honey', 'salt', 'brown sugar syrup', 'baking soda', 'soy lecithin', 'natural flavor'],
    detectedAllergenTags: ['Contains Soy'],
    nutritionFacts: {
        servingSize: '2 bars (42g)',
        calories: 190,
        sugar_g: 11,
        sodium_mg: 140,
        saturatedFat_g: 1,
        totalCarbs_g: 29,
        protein_g: 3,
    },
};

// Fixture 4: Very high sodium and saturated fat
export const foodRamenNoodles: DetectedFoodData = {
    productName: 'Instant Ramen Noodles (Beef Flavor)',
    detectedIngredients: ['enriched wheat flour', 'palm oil', 'salt', 'msg', 'soy sauce', 'hydrolyzed corn protein', 'beef extract', 'caramel color', 'disodium guanylate', 'disodium inosinate'],
    detectedAllergenTags: ['Contains Wheat', 'Contains Soy'],
    nutritionFacts: {
        servingSize: '1 package (85g)',
        calories: 380,
        sugar_g: 1,
        sodium_mg: 1820,
        saturatedFat_g: 7,
        totalCarbs_g: 53,
        protein_g: 8,
    },
};

// Fixture 5: Refined carbs + High Sugar
export const foodFrostedDonut: DetectedFoodData = {
    productName: 'Frosted Donut',
    detectedIngredients: ['white flour', 'sugar', 'water', 'palm oil', 'corn syrup', 'eggs', 'yeast', 'salt', 'whey', 'soy lecithin', 'artificial flavor'],
    detectedAllergenTags: ['Contains Wheat', 'Contains Milk', 'Contains Eggs', 'Contains Soy'],
    nutritionFacts: {
        servingSize: '1 donut (60g)',
        calories: 260,
        sugar_g: 20,
        sodium_mg: 200,
        saturatedFat_g: 6,
        totalCarbs_g: 30,
        protein_g: 3,
    },
};

// Fixture 6: Seafood + Fish
export const foodShrimpFriedRice: DetectedFoodData = {
    productName: 'Shrimp Fried Rice',
    detectedIngredients: ['rice', 'shrimp', 'peas', 'carrots', 'egg', 'soy sauce', 'sesame oil', 'onion', 'garlic'],
    detectedAllergenTags: ['Contains Crustacean Shellfish', 'Contains Eggs', 'Contains Soy', 'Contains Sesame'],
    objectDetectionLabel: 'shrimp',
    confidence: 0.9,
    nutritionFacts: {
        calories: 320,
        sugar_g: 2,
        sodium_mg: 850,
        saturatedFat_g: 1.5,
        totalCarbs_g: 45,
        protein_g: 12,
    },
};

// Fixture 7: High Potassium / Phosphates
export const foodPreservedMeat: DetectedFoodData = {
    productName: 'Canned Ham',
    detectedIngredients: ['pork', 'water', 'salt', 'sugar', 'sodium phosphates', 'sodium ascorbate', 'sodium nitrite'],
    nutritionFacts: {
        servingSize: '2 oz (56g)',
        calories: 180,
        sugar_g: 1,
        sodium_mg: 790,
        saturatedFat_g: 6,
        totalCarbs_g: 1,
        protein_g: 7,
    },
};

// Fixture 8: Tree nut heavy product
export const foodMixedNuts: DetectedFoodData = {
    productName: 'Salted Mixed Nuts',
    detectedIngredients: ['peanuts', 'almonds', 'cashews', 'brazil nuts', 'pecans', 'peanut oil', 'sea salt'],
    detectedAllergenTags: ['Contains Peanuts', 'Contains Tree Nuts'],
    nutritionFacts: {
        servingSize: '1 oz (28g)',
        calories: 170,
        sugar_g: 1,
        sodium_mg: 90,
        saturatedFat_g: 2,
        totalCarbs_g: 5,
        protein_g: 6,
    },
};

export const MOCK_PRODUCTS = [
    foodCleanApple,
    foodPeanutButterCup,
    foodGranolaBar,
    foodRamenNoodles,
    foodFrostedDonut,
    foodShrimpFriedRice,
    foodPreservedMeat,
    foodMixedNuts,
];
