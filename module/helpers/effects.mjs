/**
 * Effect category definitions
 * @typedef {Object} EffectCategory
 * @property {string} type - The category type identifier
 * @property {string} label - The localized label for the category
 * @property {ActiveEffect[]} effects - Array of effects in this category
 */

/**
 * Predefined effect categories
 * @type {Object<string, string>}
 */
export const EFFECT_CATEGORIES = {
  TEMPORARY: 'temporary',
  PASSIVE: 'passive',
  INACTIVE: 'inactive'
};

/**
 * Localization keys for effect categories
 * @type {Object<string, string>}
 */
export const EFFECT_CATEGORY_LABELS = {
  [EFFECT_CATEGORIES.TEMPORARY]: 'FADING_SUNS.Effect.Temporary',
  [EFFECT_CATEGORIES.PASSIVE]: 'FADING_SUNS.Effect.Passive',
  [EFFECT_CATEGORIES.INACTIVE]: 'FADING_SUNS.Effect.Inactive'
};

// Import the effects list and types from activeEffects.js
import effectsList, { EFFECT_TYPES } from '../activeeffects/activeEffects.js';

/**
 * Get effects by their type
 * @param {string} type - The type of effects to retrieve
 * @returns {ActiveEffect[]} An array of effects of the specified type
 */
export function getEffectsByType(type) {
  return effectsList.filter(effect => effect.type === type);
}

/**
 * Get an effect by its title
 * @param {string} title - The title of the effect to retrieve
 * @returns {ActiveEffect|undefined} The effect with the specified title, or undefined if not found
 */
export function getEffectByTitle(title) {
  return effectsList.find(effect => effect.title === title);
}

/**
 * Get all physical effects
 * @returns {ActiveEffect[]} An array of physical effects
 */
export function getPhysicalEffects() {
  return getEffectsByType(EFFECT_TYPES.PHYSICAL);
}

/**
 * Get all mental effects
 * @returns {ActiveEffect[]} An array of mental effects
 */
export function getMentalEffects() {
  return getEffectsByType(EFFECT_TYPES.MENTAL);
}

/**
 * Get all social effects
 * @returns {ActiveEffect[]} An array of social effects
 */
export function getSocialEffects() {
  return getEffectsByType(EFFECT_TYPES.SOCIAL);
}

/**
 * Create categorized active effects data structure for UI rendering
 * @param {ActiveEffect[]|Generator<ActiveEffect>} effects - A collection or generator of Active Effect documents to prepare sheet data for
 * @return {Object<string, EffectCategory>} Data for rendering
 */
export function createEffectCategories(effects) {
  // Define effect header categories
  const categories = {
    [EFFECT_CATEGORIES.TEMPORARY]: {
      type: EFFECT_CATEGORIES.TEMPORARY,
      label: game.i18n.localize(EFFECT_CATEGORY_LABELS[EFFECT_CATEGORIES.TEMPORARY]),
      effects: [],
    },
    [EFFECT_CATEGORIES.PASSIVE]: {
      type: EFFECT_CATEGORIES.PASSIVE,
      label: game.i18n.localize(EFFECT_CATEGORY_LABELS[EFFECT_CATEGORIES.PASSIVE]),
      effects: [],
    },
    [EFFECT_CATEGORIES.INACTIVE]: {
      type: EFFECT_CATEGORIES.INACTIVE,
      label: game.i18n.localize(EFFECT_CATEGORY_LABELS[EFFECT_CATEGORIES.INACTIVE]),
      effects: [],
    },
  };

  // Iterate over active effects, classifying them into categories
  for (const effect of effects) {
    if (!effect) continue;
    
    if (effect.disabled) {
      categories[EFFECT_CATEGORIES.INACTIVE].effects.push(effect);
    } else if (effect.isTemporary) {
      categories[EFFECT_CATEGORIES.TEMPORARY].effects.push(effect);
    } else {
      categories[EFFECT_CATEGORIES.PASSIVE].effects.push(effect);
    }
  }

  // Sort each category by the effect sort property
  sortEffectCategories(categories);
  
  return categories;
}

/**
 * Sort effects within each category
 * @param {Object<string, EffectCategory>} categories - The categories containing effects to sort
 * @private
 */
function sortEffectCategories(categories) {
  for (const category of Object.values(categories)) {
    category.effects.sort((a, b) => (a.sort || 0) - (b.sort || 0));
  }
}

/**
 * Get a specific effect category
 * @param {Object<string, EffectCategory>} categories - The effect categories
 * @param {string} categoryType - The category type to retrieve
 * @returns {EffectCategory|null} The requested category or null if not found
 */
export function getEffectCategory(categories, categoryType) {
  return categories[categoryType] || null;
}

/**
 * Count the total number of effects across all categories
 * @param {Object<string, EffectCategory>} categories - The effect categories
 * @returns {number} The total count of effects
 */
export function countTotalEffects(categories) {
  return Object.values(categories).reduce((count, category) => {
    return count + category.effects.length;
  }, 0);
}

/**
 * Alias for createEffectCategories to maintain backward compatibility
 * @deprecated Use createEffectCategories instead
 */
export function prepareActiveEffectCategories(effects) {
  return createEffectCategories(effects);
}
