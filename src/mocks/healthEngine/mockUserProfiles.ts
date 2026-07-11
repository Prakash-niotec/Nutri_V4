import { UserHealthProfile } from '../../services/healthEngine/types';

// Profile 1: completely healthy, no restrictions
export const userHealthyAdult: UserHealthProfile = {
    userId: 'user_healthy',
    allergies: [],
    medicalConditions: [],
    dietaryRestrictions: [],
    ageGroup: 'adult',
};

// Profile 2: Allergic to Peanuts, Tree Nuts, Dairy (Allergy heavy)
export const userNutDairyAllergy: UserHealthProfile = {
    userId: 'user_nut_dairy',
    allergies: ['peanuts', 'tree_nuts', 'dairy'],
    medicalConditions: [],
    dietaryRestrictions: [],
    ageGroup: 'child',
};

// Profile 3: Heart Disease, High Blood Pressure, High Cholesterol (Condition heavy)
export const userHeartBPCholesterol: UserHealthProfile = {
    userId: 'user_heart_bp_chol',
    allergies: [],
    medicalConditions: ['heart_disease', 'high_blood_pressure', 'high_cholesterol'],
    dietaryRestrictions: [],
    ageGroup: 'senior',
};

// Profile 4: Diabetes & Kidney Disease
export const userDiabetesKidney: UserHealthProfile = {
    userId: 'user_diabetes_kidney',
    allergies: ['fish', 'seafood'],
    medicalConditions: ['diabetes', 'kidney_disease'],
    dietaryRestrictions: [],
    ageGroup: 'adult',
};

// Profile 5: Vegan with Wheat & Sesame Allergy
export const userVeganWheatSesame: UserHealthProfile = {
    userId: 'user_vegan',
    allergies: ['wheat', 'sesame', 'egg', 'dairy', 'gluten'],
    medicalConditions: [],
    dietaryRestrictions: ['vegan'],
    ageGroup: 'adult',
};

export const MOCK_PROFILES = [
    userHealthyAdult,
    userNutDairyAllergy,
    userHeartBPCholesterol,
    userDiabetesKidney,
    userVeganWheatSesame,
];
