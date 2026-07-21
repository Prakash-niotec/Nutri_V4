// Google ML Kit wrapper turned into the OCR text normalizer and adapter
const { searchIngredients } = require('../../../backend/db/ingredientDb');
const { evaluateProduct } = require('../../../backend/rules/evaluateProduct');

const normalizeText = (rawText) => {
    if (!rawText) return '';
    return rawText
        .toLowerCase()
        .replace(/[^\w\s]/gi, ' ') // strip punctuation
        .replace(/\s+/g, ' ') // replace multiple spaces with single space
        .trim();
};

/**
 * Adapter that processes the raw text from OCR and returns the highest level matched result
 * 
 * @param {string} rawText 
 * @returns {Object|null} matched product from the DB or null if none
 */
const adaptOcrInput = (rawText) => {
    const normalizedText = normalizeText(rawText);
    const matches = searchIngredients(normalizedText);

    // Return the best match to the calling code according to spec (top 1 for now)
    if (matches && matches.length > 0) {
        return matches[0];
    }

    return null;
};

module.exports = {
    adaptOcrInput,
    normalizeText
};