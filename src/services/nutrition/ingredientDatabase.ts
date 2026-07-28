import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';

const DB_NAME = 'nutrilens_ingredients.db';

let db: SQLite.SQLiteDatabase | null = null;

export const initIngredientDatabase = async () => {
    if (db) return; // Already initialized

    const dbDir = FileSystem.documentDirectory + 'SQLite/';
    const dbPath = dbDir + DB_NAME;

    // Check if directory exists
    const dirInfo = await FileSystem.getInfoAsync(dbDir);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
    }

    // Check if DB exists, if not, copy it from assets
    const dbInfo = await FileSystem.getInfoAsync(dbPath);
    if (!dbInfo.exists) {
        const asset = Asset.fromModule(require('../../../assets/db/nutrilens_ingredients.db'));
        await asset.downloadAsync();
        await FileSystem.copyAsync({
            from: asset.localUri || asset.uri || '',
            to: dbPath
        });
    }

    db = await SQLite.openDatabaseAsync(DB_NAME);
    console.log('[SQLite] Ingredient Database initialized.');
};

const parseJsonField = (field: any) => {
    if (!field) return [];
    try {
        return JSON.parse(field);
    } catch (e) {
        return [];
    }
};

export const searchIngredients = (term: string) => {
    if (!db) return [];
    if (!term || typeof term !== 'string') return [];
    const queryTerm = `%${term}%`;

    try {
        let results = db.getAllSync(`
            SELECT * FROM ingredients_library 
            WHERE product_name LIKE ? OR ingredients_en LIKE ?
            LIMIT 10
        `, [queryTerm, queryTerm]) as any[];

        if (results.length === 0) {
            const tokens = term.split(/[\s,]+/).filter(t => t.length > 3);
            if (tokens.length > 0) {
                const conditions = tokens.map(() => `ingredients_en LIKE ? OR product_name LIKE ?`).join(' OR ');
                const params = tokens.flatMap(t => [`%${t}%`, `%${t}%`]);
                const fuzzyResults = db.getAllSync(`
                    SELECT * FROM ingredients_library
                    WHERE ${conditions}
                    LIMIT 10
                `, params) as any[];

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
        const matches = searchIngredients(raw);
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
