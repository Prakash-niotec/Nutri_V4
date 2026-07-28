import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';

const DB_NAME = 'nutrilens_ingredients.db';

let db: SQLite.SQLiteDatabase | null = null;

export const initIngredientDatabase = async () => {
    if (db) return; // Already initialized

    const dbDir = FileSystem.documentDirectory + 'SQLite/';
    const dbPath = dbDir + DB_NAME;

    try {
        const dirInfo = await FileSystem.getInfoAsync(dbDir);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
        }

        const dbInfo = await FileSystem.getInfoAsync(dbPath);
        if (!dbInfo.exists || dbInfo.size === 0) {
            const asset = Asset.fromModule(require('../../../assets/db/nutrilens_ingredients.db'));
            await asset.downloadAsync();
            const sourceUri = asset.localUri || asset.uri;
            if (sourceUri) {
                await FileSystem.copyAsync({
                    from: sourceUri,
                    to: dbPath
                });
            }
        }

        db = await SQLite.openDatabaseAsync(DB_NAME);
        console.log('[SQLite] Ingredient Database initialized.');
    } catch (err) {
        console.warn('[SQLite] DB Init warning:', err);
    }
};

interface ScientificIngredientEntry {
    commonName: string;
    allergens: string[];
    additives: string[];
}

const SCIENTIFIC_EN_DICTIONARY: Record<string, ScientificIngredientEntry> = {
    // E300 - E309 Vitamins & Antioxidants
    'e300': { commonName: 'Vitamin C (Ascorbic Acid)', allergens: [], additives: ['en:e300'] },
    'ascorbic acid': { commonName: 'Vitamin C (Ascorbic Acid)', allergens: [], additives: ['en:e300'] },
    'l-ascorbic acid': { commonName: 'Vitamin C (Ascorbic Acid)', allergens: [], additives: ['en:e300'] },
    'e306': { commonName: 'Vitamin E (Tocopherol)', allergens: [], additives: ['en:e306'] },
    'alpha-tocopherol': { commonName: 'Vitamin E (Tocopherol)', allergens: [], additives: ['en:e306'] },
    'tocopherol': { commonName: 'Vitamin E (Tocopherol)', allergens: [], additives: ['en:e306'] },
    'pyridoxine': { commonName: 'Vitamin B6', allergens: [], additives: [] },
    'cyanocobalamin': { commonName: 'Vitamin B12', allergens: [], additives: [] },
    'thiamine': { commonName: 'Vitamin B1', allergens: [], additives: [] },
    'riboflavin': { commonName: 'Vitamin B2 (Riboflavin)', allergens: [], additives: ['en:e101'] },
    'e101': { commonName: 'Vitamin B2 (Riboflavin)', allergens: [], additives: ['en:e101'] },
    'cholecalciferol': { commonName: 'Vitamin D3', allergens: [], additives: [] },
    'folic acid': { commonName: 'Vitamin B9 (Folic Acid)', allergens: [], additives: [] },
    'niacin': { commonName: 'Vitamin B3 (Niacin)', allergens: [], additives: [] },
    'niacinamide': { commonName: 'Vitamin B3 (Niacinamide)', allergens: [], additives: [] },

    // Minerals & Salts
    'calcium carbonate': { commonName: 'Calcium Carbonate', allergens: [], additives: ['en:e170'] },
    'e170': { commonName: 'Calcium Carbonate', allergens: [], additives: ['en:e170'] },
    'sodium chloride': { commonName: 'Salt (Sodium Chloride)', allergens: [], additives: [] },
    'nacl': { commonName: 'Salt', allergens: [], additives: [] },
    'ferrous sulfate': { commonName: 'Iron (Ferrous Sulfate)', allergens: [], additives: [] },
    'sodium hydrogen carbonate': { commonName: 'Baking Soda (Sodium Bicarbonate)', allergens: [], additives: ['en:e500'] },
    'sodium bicarbonate': { commonName: 'Baking Soda (Sodium Bicarbonate)', allergens: [], additives: ['en:e500'] },
    'e500': { commonName: 'Sodium Bicarbonate', allergens: [], additives: ['en:e500'] },

    // Emulsifiers & Thickeners
    'e322': { commonName: 'Soy Lecithin (E322)', allergens: ['en:soya', 'soy'], additives: ['en:e322'] },
    'soy lecithin': { commonName: 'Soy Lecithin', allergens: ['en:soya', 'soy'], additives: ['en:e322'] },
    'soya lecithin': { commonName: 'Soy Lecithin', allergens: ['en:soya', 'soy'], additives: ['en:e322'] },
    'lecithin': { commonName: 'Lecithin', allergens: ['en:soya', 'soy'], additives: ['en:e322'] },
    'e471': { commonName: 'Mono and Diglycerides of Fatty Acids (E471)', allergens: [], additives: ['en:e471'] },
    'mono and diglycerides': { commonName: 'Emulsifier E471', allergens: [], additives: ['en:e471'] },
    'e415': { commonName: 'Xanthan Gum (E415)', allergens: [], additives: ['en:e415'] },
    'xanthan gum': { commonName: 'Xanthan Gum', allergens: [], additives: ['en:e415'] },
    'e412': { commonName: 'Guar Gum (E412)', allergens: [], additives: ['en:e412'] },
    'guar gum': { commonName: 'Guar Gum', allergens: [], additives: ['en:e412'] },
    'e407': { commonName: 'Carrageenan (E407)', allergens: [], additives: ['en:e407'] },

    // Colors & Flavor Enhancers
    'e100': { commonName: 'Curcumin / Turmeric Color (E100)', allergens: [], additives: ['en:e100'] },
    'curcumin': { commonName: 'Turmeric Extract (Curcumin)', allergens: [], additives: ['en:e100'] },
    'e102': { commonName: 'Tartrazine Color (E102)', allergens: [], additives: ['en:e102'] },
    'tartrazine': { commonName: 'Tartrazine Color (E102)', allergens: [], additives: ['en:e102'] },
    'e110': { commonName: 'Sunset Yellow Color (E110)', allergens: [], additives: ['en:e110'] },
    'e129': { commonName: 'Allura Red Color (E129)', allergens: [], additives: ['en:e129'] },
    'e133': { commonName: 'Brilliant Blue Color (E133)', allergens: [], additives: ['en:e133'] },
    'e621': { commonName: 'Monosodium Glutamate / MSG (E621)', allergens: [], additives: ['en:e621'] },
    'monosodium glutamate': { commonName: 'Monosodium Glutamate (MSG)', allergens: [], additives: ['en:e621'] },
    'msg': { commonName: 'Monosodium Glutamate (MSG)', allergens: [], additives: ['en:e621'] },

    // Preservatives
    'e250': { commonName: 'Sodium Nitrite Preservative (E250)', allergens: [], additives: ['en:e250'] },
    'sodium nitrite': { commonName: 'Sodium Nitrite Preservative', allergens: [], additives: ['en:e250'] },
    'e202': { commonName: 'Potassium Sorbate (E202)', allergens: [], additives: ['en:e202'] },
    'potassium sorbate': { commonName: 'Potassium Sorbate Preservative', allergens: [], additives: ['en:e202'] },
    'e211': { commonName: 'Sodium Benzoate (E211)', allergens: [], additives: ['en:e211'] },
    'sodium benzoate': { commonName: 'Sodium Benzoate Preservative', allergens: [], additives: ['en:e211'] },

    // Sweeteners
    'e951': { commonName: 'Aspartame Sweetener (E951)', allergens: [], additives: ['en:e951'] },
    'aspartame': { commonName: 'Aspartame Sweetener', allergens: [], additives: ['en:e951'] },
    'e955': { commonName: 'Sucralose Sweetener (E955)', allergens: [], additives: ['en:e955'] },
    'sucralose': { commonName: 'Sucralose Sweetener', allergens: [], additives: ['en:e955'] },
    'e950': { commonName: 'Acesulfame K Sweetener (E950)', allergens: [], additives: ['en:e950'] },
    'acesulfame k': { commonName: 'Acesulfame Potassium', allergens: [], additives: ['en:e950'] },
    'acesulfame potassium': { commonName: 'Acesulfame Potassium', allergens: [], additives: ['en:e950'] },
    'e960': { commonName: 'Steviol Glycosides / Stevia (E960)', allergens: [], additives: ['en:e960'] },
    'steviol glycosides': { commonName: 'Stevia Sweetener', allergens: [], additives: ['en:e960'] },
};

const parseJsonField = (field: any) => {
    if (!field) return [];
    try {
        return JSON.parse(field);
    } catch (e) {
        return [];
    }
};

export const searchIngredients = async (term: string) => {
    if (!term || typeof term !== 'string' || !term.trim()) return [];
    const lowerTerm = term.trim().toLowerCase();

    // 1. Direct match against Scientific / E-Number Dictionary
    if (SCIENTIFIC_EN_DICTIONARY[lowerTerm]) {
        const entry = SCIENTIFIC_EN_DICTIONARY[lowerTerm];
        return [{
            product_name: entry.commonName,
            ingredients_en: entry.commonName,
            allergens_tags: entry.allergens,
            additives_tags: entry.additives,
            traces_tags: []
        }];
    }

    if (!db) return [];
    const queryTerm = `%${lowerTerm}%`;

    try {
        let results = (await db.getAllAsync(`
            SELECT * FROM ingredients_library 
            WHERE product_name LIKE ? OR ingredients_en LIKE ?
            LIMIT 10
        `, [queryTerm, queryTerm])) as any[];

        if (results.length === 0) {
            const tokens = term.split(/[\s,]+/).filter(t => t.length > 3);
            if (tokens.length > 0) {
                const conditions = tokens.map(() => `ingredients_en LIKE ? OR product_name LIKE ?`).join(' OR ');
                const params = tokens.flatMap(t => [`%${t}%`, `%${t}%`]);
                const fuzzyResults = (await db.getAllAsync(`
                    SELECT * FROM ingredients_library
                    WHERE ${conditions}
                    LIMIT 10
                `, params)) as any[];

                if (fuzzyResults.length > 0) {
                    results = fuzzyResults.filter((row: any) => {
                        const productText = ((row.product_name || '') + ' ' + (row.ingredients_en || '')).toLowerCase();
                        const matchedCount = tokens.filter(t => productText.includes(t.toLowerCase())).length;
                        const threshold = Math.max(1, Math.floor(tokens.length * 0.5));
                        return matchedCount >= threshold;
                    });
                }
            }
        }

        return results.map(row => ({
            ...row,
            allergens_tags: parseJsonField(row.allergens_tags),
            additives_tags: parseJsonField(row.additives_tags),
            traces_tags: parseJsonField(row.traces_tags)
        }));
    } catch (err) {
        console.error('[SQLite] Error searching ingredients:', err);
        return [];
    }
};

export const normalizeOcrIngredients = async (rawOCRStrings: string[]) => {
    await initIngredientDatabase();
    
    const normalizedList: any[] = [];
    for (const raw of rawOCRStrings) {
        const matches = await searchIngredients(raw);
        if (matches.length > 0) {
            normalizedList.push(matches[0]); // Take top match
        } else {
            // Unmatched ingredient
            normalizedList.push({
                product_name: raw,
                allergens_tags: [],
                additives_tags: [],
                traces_tags: []
            });
        }
    }
    return normalizedList;
};
