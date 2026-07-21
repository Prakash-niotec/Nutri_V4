import { HealthCondition } from '../types';

export const INGREDIENT_WATCHLISTS: Record<HealthCondition, string[]> = {
  diabetes: [
    'high fructose corn syrup', 'corn syrup', 'dextrose', 
    'maltodextrin', 'sucrose', 'glucose syrup'
  ],
  highBloodPressure: [
    'msg', 'monosodium glutamate', 'sodium nitrate', 
    'sodium nitrite', 'baking powder', 'sodium bicarbonate'
  ],
  kidneyDisease: [
    'phosphoric acid', 'sodium phosphate', 
    'potassium chloride', 'potassium sorbate', 'calcium propionate'
  ],
  heartDisease: [
    'partially hydrogenated oil', 'hydrogenated oil', 
    'palm oil', 'shortening', 'margarine'
  ],
  highCholesterol: [
    'partially hydrogenated oil', 'palm oil', 
    'coconut oil', 'lard', 'tallow'
  ],
};
