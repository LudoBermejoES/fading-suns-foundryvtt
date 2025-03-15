/**
 * Helper functions for combat calculations
 */

/**
 * Attack property types
 * @enum {string}
 */
export const ATTACK_PROPERTIES = {
  BLASTER: "blaster",
  SHOCK: "shock",
  SLAM: "slam",
  HARD: "hard",
  FLAME: "flame",
  LASER: "laser",
  SONIC: "sonic",
  ULTRA_HARD: "ultraHard"
};

/**
 * Maps attack property names in Spanish to their enum values
 * @type {Object}
 */
export const ATTACK_PROPERTY_MAP = {
  // Spanish names
  "bláster": ATTACK_PROPERTIES.BLASTER,
  "blaster": ATTACK_PROPERTIES.BLASTER,
  "descarga": ATTACK_PROPERTIES.SHOCK,
  "golpe": ATTACK_PROPERTIES.SLAM,
  "endurecida": ATTACK_PROPERTIES.HARD,
  "fuego": ATTACK_PROPERTIES.FLAME,
  "láser": ATTACK_PROPERTIES.LASER,
  "laser": ATTACK_PROPERTIES.LASER,
  "sónica": ATTACK_PROPERTIES.SONIC,
  "sonica": ATTACK_PROPERTIES.SONIC,
  "superendurecida": ATTACK_PROPERTIES.ULTRA_HARD,
  
  // English names
  "blaster": ATTACK_PROPERTIES.BLASTER,
  "shock": ATTACK_PROPERTIES.SHOCK,
  "slam": ATTACK_PROPERTIES.SLAM,
  "hard": ATTACK_PROPERTIES.HARD,
  "flame": ATTACK_PROPERTIES.FLAME,
  "laser": ATTACK_PROPERTIES.LASER,
  "sonic": ATTACK_PROPERTIES.SONIC,
  "ultrahard": ATTACK_PROPERTIES.ULTRA_HARD
};

/**
 * Maps attack properties to their corresponding armor resistance properties
 * @type {Object}
 */
export const ARMOR_RESISTANCE_MAP = {
  [ATTACK_PROPERTIES.BLASTER]: "BlasterResistance",
  [ATTACK_PROPERTIES.SHOCK]: "ShockResistance",
  [ATTACK_PROPERTIES.SLAM]: "SlamResistance",
  [ATTACK_PROPERTIES.HARD]: "HardResistance",
  [ATTACK_PROPERTIES.FLAME]: "FlameResistance",
  [ATTACK_PROPERTIES.LASER]: "LaserResistance",
  [ATTACK_PROPERTIES.SONIC]: "SonicResistance",
  [ATTACK_PROPERTIES.ULTRA_HARD]: "UltraHardResistance"
};

/**
 * Parses the Features field of a weapon to extract attack properties
 * @param {string} featuresText - The text from the weapon's Features field
 * @returns {Array<string>} Array of attack property types found
 */
export function parseAttackProperties(featuresText) {
  if (!featuresText) return [];
  
  const properties = [];
  const lowercaseFeatures = featuresText.toLowerCase();
  
  // Check for each possible property in the features text
  Object.keys(ATTACK_PROPERTY_MAP).forEach(propertyName => {
    if (lowercaseFeatures.includes(propertyName.toLowerCase())) {
      const propertyType = ATTACK_PROPERTY_MAP[propertyName];
      if (!properties.includes(propertyType)) {
        properties.push(propertyType);
      }
    }
  });
  
  return properties;
}

/**
 * Calculates the effective resistance value based on attack properties and armor
 * @param {number} baseResistance - The base body resistance value
 * @param {Array<string>} attackProperties - Array of attack property types
 * @param {Object} armorResistances - Object containing armor resistance values
 * @returns {number} The effective resistance value
 */
export function calculateEffectiveResistance(baseResistance, attackProperties, armorResistances) {
  if (!attackProperties || attackProperties.length === 0) {
    // No special attack properties, use base resistance
    return baseResistance;
  }
  
  // Start with base resistance
  let effectiveResistance = baseResistance;
  let hasProtection = false;
  
  // Check each attack property
  for (const property of attackProperties) {
    const resistanceProperty = ARMOR_RESISTANCE_MAP[property];
    
    if (resistanceProperty && armorResistances && armorResistances[resistanceProperty]) {
      // Armor has specific protection against this property
      const specificResistance = Number(armorResistances[resistanceProperty]) || 0;
      
      // Use the specific resistance if it's higher than the current effective resistance
      if (specificResistance > effectiveResistance) {
        effectiveResistance = specificResistance;
      }
      
      hasProtection = true;
    }
  }
  
  // If no protection against any of the attack properties, reduce resistance by half
  if (!hasProtection && attackProperties.length > 0) {
    effectiveResistance = Math.floor(effectiveResistance / 2);
  }
  
  // Special case for sonic attacks - they ignore armor unless specifically protected
  if (attackProperties.includes(ATTACK_PROPERTIES.SONIC) && 
      (!armorResistances || !armorResistances.SonicResistance)) {
    effectiveResistance = 0;
  }
  
  return effectiveResistance;
}

/**
 * Maps a resistance value to a resistance level name
 * @param {number} resistanceValue - The numerical resistance value
 * @returns {string} The resistance level name
 */
export function getResistanceLevel(resistanceValue) {
  if (resistanceValue <= 0) return "Effortless";
  if (resistanceValue <= 2) return "Easy";
  if (resistanceValue <= 4) return "Hard";
  if (resistanceValue <= 6) return "Demanding";
  if (resistanceValue <= 8) return "Tough";
  if (resistanceValue <= 10) return "Severe";
  if (resistanceValue <= 12) return "Herculean";
  return "Miraculous";
} 