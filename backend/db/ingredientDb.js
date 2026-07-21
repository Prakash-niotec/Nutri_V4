const Database = require('better-sqlite3');
const path = require('path');

// Initialize the database connection (read-only)
const dbPath = path.resolve(__dirname, '../data/nutrilens_ingredients.db');
const db = new Database(dbPath, { readonly: true });

const parseJsonField = (field) => {
    if (!field) return [];
    try {
        return JSON.parse(field);
    } catch (e) {
        return [];
    }
};

const searchIngredients = (term) => {
    if (!term || typeof term !== 'string') return [];
    const queryTerm = `%${term}%`;

    const stmt = db.prepare(`
    SELECT * FROM ingredients_library 
    WHERE product_name LIKE ? OR ingredients_en LIKE ?
    LIMIT 10
  `);

    let results = stmt.all(queryTerm, queryTerm);

    if (results.length === 0) {
        // Fuzzy matching fallback (Task 5)
        // token-based overlap: break term into words > 3 chars and search for them
        const tokens = term.split(/[\s,]+/).filter(t => t.length > 3);
        if (tokens.length > 0) {
            const conditions = tokens.map(() => `ingredients_en LIKE ? OR product_name LIKE ?`).join(' OR ');
            const fuzzyStmt = db.prepare(`
        SELECT * FROM ingredients_library
        WHERE ${conditions}
        LIMIT 10
      `);
            const params = tokens.flatMap(t => [`%${t}%`, `%${t}%`]);
            results = fuzzyStmt.all(...params);

            // Basic post-filtering to enforce a naive "similarity threshold" - if they only share a generic word wait we will just take the top matches and rely on SQLite's exactness for tokens.
            if (results.length > 0) {
                // filter out matches that don't share enough token overlap
                results = results.filter(row => {
                    const productText = ((row.product_name || '') + ' ' + (row.ingredients_en || '')).toLowerCase();
                    const matchedCount = tokens.filter(t => productText.includes(t.toLowerCase())).length;
                    // Accept if at least ~50% of the longer tokens match, or 1 match if only 1-2 tokens exists.
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
};

const getProductById = (id) => {
    const stmt = db.prepare(`SELECT * FROM ingredients_library WHERE rowid = ?`);
    const row = stmt.get(id);
    if (!row) return null;
    return {
        ...row,
        allergens_tags: parseJsonField(row.allergens_tags),
        additives_tags: parseJsonField(row.additives_tags),
        traces_tags: parseJsonField(row.traces_tags)
    };
};

module.exports = {
    db,
    searchIngredients,
    getProductById
};
