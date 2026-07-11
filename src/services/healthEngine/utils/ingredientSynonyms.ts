import { Allergy } from '../types';

export const ALLERGEN_SYNONYMS: Record<Allergy, string[]> = {
    dairy: ['milk', 'butter', 'cream', 'cheese', 'whey', 'casein', 'lactose', 'ghee', 'yogurt'],
    egg: ['albumin', 'egg white', 'egg yolk', 'mayonnaise', 'meringue', 'egg', 'eggs'],
    tree_nuts: ['almond', 'cashew', 'walnut', 'pistachio', 'hazelnut', 'pecan', 'macadamia', 'brazil nut'],
    fish: ['anchovy', 'cod', 'salmon', 'tuna', 'fish sauce', 'fish oil', 'surimi'],
    gluten: ['wheat', 'barley', 'rye', 'malt', 'semolina', 'spelt', 'triticale'],
    wheat: ['flour', 'semolina', 'durum', 'bulgur', 'farina', 'wheat starch', 'wheat'],
    sesame: ['tahini', 'sesame oil', 'sesame seed', 'benne', 'sesame'],
    seafood: ['shrimp', 'prawn', 'crab', 'lobster', 'mussel', 'oyster', 'clam', 'squid', 'shellfish'],
    peanuts: ['groundnut', 'peanut oil', 'peanut butter', 'arachis oil', 'peanut', 'peanuts'],
    soy: ['soybean', 'soya', 'tofu', 'edamame', 'soy lecithin', 'tamari', 'miso', 'soy'],
};
