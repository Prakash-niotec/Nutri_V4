/**
 * Normalizes a string for matching (lowercase, trims)
 */
export const normalizeString = (str: string): string => {
    return str.toLowerCase().trim();
};

/**
 * Checks if a search keyword substring exists within any of the target strings.
 * Case-insensitive.
 */
export const hasFuzzyMatch = (targets: string[], keyword: string): boolean => {
    const normKeyword = normalizeString(keyword);
    return targets.some((t) => normalizeString(t).includes(normKeyword));
};

/**
 * Checks if any of the given keywords exist in any of the target arrays.
 */
export const hasAnyFuzzyMatch = (targets: string[], keywords: string[]): string | undefined => {
    for (const keyword of keywords) {
        if (hasFuzzyMatch(targets, keyword)) {
            return keyword;
        }
    }
    return undefined;
};
