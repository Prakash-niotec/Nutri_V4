const THRESHOLDS = {
    sodium_100g: { high: 0.6, low: 0.1 },
    sugars_100g: { high: 22.5, low: 5 },
    sat_fat_100g: { high: 5, low: 1.5 },
    cholesterol_100g: { high: 0.06, low: 0.02 },
    potassium_100g: { high: 0.3 }
};

const CONDITION_RULES = {
    high_blood_pressure: ['sodium_100g'],
    diabetes: ['sugars_100g'],
    heart_disease: ['sat_fat_100g', 'cholesterol_100g'],
    high_cholesterol: ['sat_fat_100g', 'cholesterol_100g'],
    kidney_disease: ['potassium_100g', 'sodium_100g']
};

module.exports = { THRESHOLDS, CONDITION_RULES };
