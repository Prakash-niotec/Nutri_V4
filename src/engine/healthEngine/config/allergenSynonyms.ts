import { Allergen } from '../types';

export const ALLERGEN_SYNONYMS: Record<Allergen, string[]> = {
  peanuts: ['peanut', 'peanuts', 'groundnut', 'arachis oil'],
  treeNuts: ['almond', 'cashew', 'walnut', 'pecan', 'pistachio', 'hazelnut', 'macadamia'],
  milk: ['milk', 'whey', 'casein', 'lactose', 'butter', 'cream', 'ghee'],
  eggs: ['egg', 'albumin', 'ovalbumin', 'egg white', 'egg yolk'],
  soy: ['soy', 'soya', 'soybean', 'soy lecithin', 'edamame'],
  wheatGluten: ['wheat', 'gluten', 'flour', 'malt', 'semolina', 'spelt'],
  fish: ['fish', 'anchovy', 'cod', 'tuna', 'salmon', 'fish oil'],
  shellfish: ['shrimp', 'prawn', 'crab', 'lobster', 'shellfish', 'mollusk'],
  sesame: ['sesame', 'tahini', 'sesame oil'],
  sulfites: ['sulfite', 'sulphite', 'sodium bisulfite', 'potassium metabisulfite'],
};
