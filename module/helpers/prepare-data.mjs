/**
 * Helper functions for preparing data for display in templates
 */

/**
 * Prepares an ordered list of skills with translations and selection status
 * @param {Array} skills - Array of skill keys
 * @param {string} selectedSkill - Currently selected skill
 * @returns {Array} Ordered array of skill objects with key, translated name, and selection status
 */
export function prepareOrderedSkills(skills, selectedSkill) {
  return skills
    .map((key) => ({
      key,
      translated: game.i18n.format(`FADING_SUNS.Skill.${key}`),
      selected: key === selectedSkill,
    }))
    .sort((a, b) =>
      a.translated > b.translated ? 1 : b.translated > a.translated ? -1 : 0,
    );
}

/**
 * Prepares an ordered list of characteristics with translations and selection status
 * @param {Array} characteristics - Array of characteristic keys
 * @param {string} selectedCharacteristic - Currently selected characteristic
 * @returns {Array} Ordered array of characteristic objects with key, translated name, and selection status
 */
export function prepareCharacteristics(characteristics, selectedCharacteristic) {
  return characteristics
    .map((key) => ({
      key,
      translated: game.i18n.format(`FADING_SUNS.CharacteristicLong.${key}`),
      selected: key === selectedCharacteristic,
    }))
    .sort((a, b) =>
      a.translated > b.translated ? 1 : b.translated > a.translated ? -1 : 0,
    );
}

/**
 * Prepares an ordered list of maneuver types with translations and selection status
 * @param {Array} types - Array of maneuver type keys
 * @param {string} selectedType - Currently selected maneuver type
 * @returns {Array} Ordered array of maneuver type objects with key, translated name, and selection status
 */
export function prepareOrderedTypesOfManeuver(types, selectedType) {
  return types
    .map((key) => ({
      key,
      translated: game.i18n.format(`FADING_SUNS.Maneuver.TypeValue.${key}`),
      selected: key === selectedType,
    }))
    .sort((a, b) =>
      a.translated > b.translated ? 1 : b.translated > a.translated ? -1 : 0,
    );
}

/**
 * Prepares an ordered list of power types with translations and selection status
 * @param {Array} types - Array of power type keys
 * @param {string} selectedType - Currently selected power type
 * @returns {Array} Ordered array of power type objects with key, translated name, and selection status
 */
export function prepareOrderedTypesOfPower(types, selectedType) {
  return types
    .map((key) => ({
      key,
      translated: game.i18n.format(`FADING_SUNS.Power.TypeValue.${key}`),
      selected: key === selectedType,
    }))
    .sort((a, b) =>
      a.translated > b.translated ? 1 : b.translated > a.translated ? -1 : 0,
    );
}

/**
 * Prepares an ordered list of power schools with selection status
 * @param {Array} types - Array of power school keys
 * @param {string} selectedType - Currently selected power school
 * @returns {Array} Ordered array of power school objects with key and selection status
 */
export function prepareOrderedSchoolOfPower(types, selectedType) {
  return types
    .map((key) => ({
      key,
      selected: key === selectedType,
    }))
    .sort((a, b) =>
      a.translated > b.translated ? 1 : b.translated > a.translated ? -1 : 0,
    );
} 