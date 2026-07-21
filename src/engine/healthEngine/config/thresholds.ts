import { HealthCondition } from '../types';

export const CONDITION_THRESHOLDS: Record<HealthCondition, {
  sodiumMgMax?: number;
  addedSugarGMax?: number;
  totalCarbsGMax?: number;
  satFatGMax?: number;
  transFatGMax?: number;
  potassiumMgMax?: number;
  cholesterolMgMax?: number;
  proteinGMax?: number;
}> = {
  diabetes: {
    addedSugarGMax: 5,
    totalCarbsGMax: 45,      
  },
  highBloodPressure: {
    sodiumMgMax: 140,       
  },
  kidneyDisease: {
    potassiumMgMax: 200,
    sodiumMgMax: 140,
    proteinGMax: 15,
  },
  heartDisease: {
    satFatGMax: 1.5,
    transFatGMax: 0,
    sodiumMgMax: 200,
  },
  highCholesterol: {
    satFatGMax: 1.5,
    transFatGMax: 0,
    cholesterolMgMax: 20,
  },
};
