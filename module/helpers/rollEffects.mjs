/**
 * Helper functions for handling active effects in rolls
 */

import effectsList from '../activeeffects/activeEffects.js';

/**
 * Effect modifier types
 * @enum {string}
 */
export const EFFECT_MODIFIERS = {
  ROLL_DISADVANTAGE: 'rollDisadvantage',
  ROLL_ADVANTAGE: 'rollAdvantage',
  MODIFIER: 'modifier',
  AUTO_FAIL: 'autoFail',
  EXTRA_VP_COST: 'extraVPCost',
  INITIATIVE_ADVANTAGE: 'initiativeAdvantage',
  INITIATIVE_DISADVANTAGE: 'initiativeDisadvantage',
  RANDOM_TARGET: 'randomTarget',
  PERCEPTION_MODIFIER: 'perceptionModifier',
  PHYSICAL_MODIFIER: 'physicalModifier',
  MENTAL_MODIFIER: 'mentalModifier',
  SOCIAL_MODIFIER: 'socialModifier',
  RESISTANCE_MODIFIER: 'resistanceModifier',
  CANNOT_ACT: 'cannotAct'
};

/**
 * Maps effect titles to their modifiers
 * @type {Object}
 */
const EFFECT_MODIFIER_MAP = {
  // Physical effects
  "ATONTADO": {
    [EFFECT_MODIFIERS.PERCEPTION_MODIFIER]: -2,
    [EFFECT_MODIFIERS.PHYSICAL_MODIFIER]: -2
  },
  "ATORMENTADO": {
    [EFFECT_MODIFIERS.PHYSICAL_MODIFIER]: -2,
    [EFFECT_MODIFIERS.EXTRA_VP_COST]: 1
  },
  "ATURDIDO": {
    [EFFECT_MODIFIERS.ROLL_DISADVANTAGE]: true,
    [EFFECT_MODIFIERS.PHYSICAL_MODIFIER]: 0,
    [EFFECT_MODIFIERS.PERCEPTION_MODIFIER]: 0
  },
  "AUDICIÓN REDUCIDA": {
    [EFFECT_MODIFIERS.PERCEPTION_MODIFIER]: -2,
    [EFFECT_MODIFIERS.RESISTANCE_MODIFIER]: {
      type: "sonic",
      value: 2
    }
  },
  "CANSADO": {
    [EFFECT_MODIFIERS.PHYSICAL_MODIFIER]: -2,
    [EFFECT_MODIFIERS.EXTRA_VP_COST]: 1
  },
  "CEGADO": {
    [EFFECT_MODIFIERS.ROLL_DISADVANTAGE]: true
  },
  "DESORIENTADO": {
    [EFFECT_MODIFIERS.RANDOM_TARGET]: true
  },
  "ENSORDECIDO": {
    [EFFECT_MODIFIERS.AUTO_FAIL]: ["hearing"],
    [EFFECT_MODIFIERS.RESISTANCE_MODIFIER]: {
      type: "sonic",
      advantage: true
    }
  },
  "ESTIMULADO": {
    [EFFECT_MODIFIERS.INITIATIVE_ADVANTAGE]: true,
    [EFFECT_MODIFIERS.PERCEPTION_MODIFIER]: 2
  },
  "EUFÓRICO": {
    [EFFECT_MODIFIERS.INITIATIVE_DISADVANTAGE]: true,
    [EFFECT_MODIFIERS.MODIFIER]: -2
  },
  "FLOTANDO": {
    [EFFECT_MODIFIERS.ROLL_DISADVANTAGE]: true
  },
  "INCAPACITADO": {
    [EFFECT_MODIFIERS.CANNOT_ACT]: true
  },
  "INCONSCIENTE": {
    [EFFECT_MODIFIERS.CANNOT_ACT]: true
  },
  "INMOVILIZADO": {
    [EFFECT_MODIFIERS.ROLL_DISADVANTAGE]: ["movement"]
  },
  "MAREADO": {
    [EFFECT_MODIFIERS.MODIFIER]: -2
  },
  "OBSTACULIZADO": {
    [EFFECT_MODIFIERS.PHYSICAL_MODIFIER]: -2
  },
  "PARALIZADO": {
    [EFFECT_MODIFIERS.CANNOT_ACT]: true,
    [EFFECT_MODIFIERS.ROLL_DISADVANTAGE]: ["influence"]
  },
  "VISIÓN REDUCIDA": {
    [EFFECT_MODIFIERS.PHYSICAL_MODIFIER]: -2
  },
  
  // Mental effects
  "ANSIOSO": {
    [EFFECT_MODIFIERS.SOCIAL_MODIFIER]: -2
  },
  "ASUSTADO": {
    [EFFECT_MODIFIERS.MODIFIER]: -2
  },
  "ATERRORIZADO": {
    [EFFECT_MODIFIERS.AUTO_FAIL]: ["offensive"]
  },
  "CONFUSO": {
    [EFFECT_MODIFIERS.MENTAL_MODIFIER]: -2,
    [EFFECT_MODIFIERS.SOCIAL_MODIFIER]: -2
  },
  "DIVERTIDO": {
    [EFFECT_MODIFIERS.ROLL_ADVANTAGE]: ["persuasion"],
    [EFFECT_MODIFIERS.ROLL_DISADVANTAGE]: ["coercion"]
  },
  "ENFADADO": {
    [EFFECT_MODIFIERS.ROLL_DISADVANTAGE]: ["influence"],
    [EFFECT_MODIFIERS.ROLL_ADVANTAGE]: ["coercion"]
  },
  "ENTUSIASMADO": {
    [EFFECT_MODIFIERS.MODIFIER]: 2
  },
  "PENALIZADO": {
    [EFFECT_MODIFIERS.MODIFIER]: -2
  },
  "SUPLANTADO": {
    [EFFECT_MODIFIERS.MODIFIER]: -2
  },
  "TEMERARIO": {
    [EFFECT_MODIFIERS.ROLL_DISADVANTAGE]: ["defensive"]
  },
  "ENGAÑADO": {
    [EFFECT_MODIFIERS.ROLL_ADVANTAGE]: ["persuasion"]
  },
  "ILUMINADO": {
    [EFFECT_MODIFIERS.ROLL_ADVANTAGE]: ["wyrd"]
  },
  
  // Social effects
  "AMIGADO": {
    [EFFECT_MODIFIERS.ROLL_ADVANTAGE]: ["social"]
  },
  "ATÓNITO": {
    [EFFECT_MODIFIERS.ROLL_ADVANTAGE]: ["persuasion"]
  },
  "CAUTIVADO": {
    [EFFECT_MODIFIERS.ROLL_DISADVANTAGE]: ["other"],
    [EFFECT_MODIFIERS.EXTRA_VP_COST]: 1
  },
  "CONVENCIDO": {
    [EFFECT_MODIFIERS.ROLL_ADVANTAGE]: ["persuasion"]
  },
  "CULPABLE": {
    [EFFECT_MODIFIERS.MODIFIER]: -2
  },
  "DESANIMADO": {
    [EFFECT_MODIFIERS.MODIFIER]: -2
  },
  "DESCORAZONADO": {
    [EFFECT_MODIFIERS.MODIFIER]: -2,
    [EFFECT_MODIFIERS.EXTRA_VP_COST]: 999 // Cannot spend VP
  },
  "ENEMISTADO": {
    [EFFECT_MODIFIERS.ROLL_DISADVANTAGE]: ["social"]
  },
  "IMPRESIONADO": {
    [EFFECT_MODIFIERS.SOCIAL_MODIFIER]: -2
  },
  "INCRÉDULO": {
    [EFFECT_MODIFIERS.RESISTANCE_MODIFIER]: {
      type: "influence",
      value: 2
    }
  },
  "INDIGNADO": {
    [EFFECT_MODIFIERS.SOCIAL_MODIFIER]: -2,
    [EFFECT_MODIFIERS.ROLL_ADVANTAGE]: ["coercion"]
  },
  "PACIFICADO": {
    [EFFECT_MODIFIERS.AUTO_FAIL]: ["offensive"]
  },
  "SATISFECHO": {
    [EFFECT_MODIFIERS.SOCIAL_MODIFIER]: 2
  }
};

/**
 * Get effect modifiers for a roll based on active effects on an actor
 * @param {Actor} actor - The actor to check for active effects
 * @param {Object} rollData - Data about the roll being performed
 * @param {Array} disabledEffectIds - Array of effect IDs that should be ignored
 * @returns {Object} An object containing modifiers to apply to the roll
 */
export function getEffectModifiers(actor, rollData, disabledEffectIds = []) {
  if (!actor) return {};
  
  // Initialize modifiers object
  const modifiers = {
    rollDisadvantage: false,
    rollAdvantage: false,
    modifier: 0,
    autoFail: false,
    extraVPCost: 0,
    initiativeAdvantage: false,
    initiativeDisadvantage: false,
    randomTarget: false,
    perceptionModifier: 0,
    physicalModifier: 0,
    mentalModifier: 0,
    socialModifier: 0,
    resistanceModifiers: [],
    cannotAct: false
  };
  
  // Get active effects on the actor, excluding manually disabled ones
  const activeEffects = actor.effects.filter(e => 
    !e.disabled && !disabledEffectIds.includes(e.id)
  );
  
  // Process each active effect
  for (const effect of activeEffects) {
    // Get the effect title
    const effectTitle = effect.name.toUpperCase();
    
    // Get modifiers for this effect
    const effectModifiers = EFFECT_MODIFIER_MAP[effectTitle];
    if (!effectModifiers) continue;
    
    // Apply modifiers
    if (effectModifiers[EFFECT_MODIFIERS.ROLL_DISADVANTAGE]) {
      if (Array.isArray(effectModifiers[EFFECT_MODIFIERS.ROLL_DISADVANTAGE])) {
        // Check if the roll type matches any in the array
        const types = effectModifiers[EFFECT_MODIFIERS.ROLL_DISADVANTAGE];
        if (types.some(type => rollMatchesType(rollData, type))) {
          modifiers.rollDisadvantage = true;
        }
      } else {
        modifiers.rollDisadvantage = true;
      }
    }
    
    if (effectModifiers[EFFECT_MODIFIERS.ROLL_ADVANTAGE]) {
      if (Array.isArray(effectModifiers[EFFECT_MODIFIERS.ROLL_ADVANTAGE])) {
        // Check if the roll type matches any in the array
        const types = effectModifiers[EFFECT_MODIFIERS.ROLL_ADVANTAGE];
        if (types.some(type => rollMatchesType(rollData, type))) {
          modifiers.rollAdvantage = true;
        }
      } else {
        modifiers.rollAdvantage = true;
      }
    }
    
    if (effectModifiers[EFFECT_MODIFIERS.MODIFIER]) {
      modifiers.modifier += effectModifiers[EFFECT_MODIFIERS.MODIFIER];
    }
    
    if (effectModifiers[EFFECT_MODIFIERS.AUTO_FAIL]) {
      if (Array.isArray(effectModifiers[EFFECT_MODIFIERS.AUTO_FAIL])) {
        // Check if the roll type matches any in the array
        const types = effectModifiers[EFFECT_MODIFIERS.AUTO_FAIL];
        if (types.some(type => rollMatchesType(rollData, type))) {
          modifiers.autoFail = true;
        }
      } else {
        modifiers.autoFail = true;
      }
    }
    
    if (effectModifiers[EFFECT_MODIFIERS.EXTRA_VP_COST]) {
      modifiers.extraVPCost += effectModifiers[EFFECT_MODIFIERS.EXTRA_VP_COST];
    }
    
    if (effectModifiers[EFFECT_MODIFIERS.INITIATIVE_ADVANTAGE]) {
      modifiers.initiativeAdvantage = true;
    }
    
    if (effectModifiers[EFFECT_MODIFIERS.INITIATIVE_DISADVANTAGE]) {
      modifiers.initiativeDisadvantage = true;
    }
    
    if (effectModifiers[EFFECT_MODIFIERS.RANDOM_TARGET]) {
      modifiers.randomTarget = true;
    }
    
    if (effectModifiers[EFFECT_MODIFIERS.PERCEPTION_MODIFIER]) {
      modifiers.perceptionModifier += effectModifiers[EFFECT_MODIFIERS.PERCEPTION_MODIFIER];
    }
    
    if (effectModifiers[EFFECT_MODIFIERS.PHYSICAL_MODIFIER]) {
      modifiers.physicalModifier += effectModifiers[EFFECT_MODIFIERS.PHYSICAL_MODIFIER];
    }
    
    if (effectModifiers[EFFECT_MODIFIERS.MENTAL_MODIFIER]) {
      modifiers.mentalModifier += effectModifiers[EFFECT_MODIFIERS.MENTAL_MODIFIER];
    }
    
    if (effectModifiers[EFFECT_MODIFIERS.SOCIAL_MODIFIER]) {
      modifiers.socialModifier += effectModifiers[EFFECT_MODIFIERS.SOCIAL_MODIFIER];
    }
    
    if (effectModifiers[EFFECT_MODIFIERS.RESISTANCE_MODIFIER]) {
      modifiers.resistanceModifiers.push(effectModifiers[EFFECT_MODIFIERS.RESISTANCE_MODIFIER]);
    }
    
    if (effectModifiers[EFFECT_MODIFIERS.CANNOT_ACT]) {
      modifiers.cannotAct = true;
    }
  }
  
  return modifiers;
}

/**
 * Check if a roll matches a specific type
 * @param {Object} rollData - Data about the roll being performed
 * @param {string} type - The type to check against
 * @returns {boolean} Whether the roll matches the type
 */
function rollMatchesType(rollData, type) {
  // Helper function to safely check if a string includes a substring
  const safeIncludes = (value, substring) => {
    // Check if value is a string before using includes
    return typeof value === 'string' && value.includes(substring);
  };

  // Helper function to safely check if a maneuver includes a substring
  const maneuverIncludes = (substring) => {
    return rollData.maneuver && 
           typeof rollData.maneuver === 'object' && 
           rollData.maneuver.name && 
           typeof rollData.maneuver.name === 'string' && 
           rollData.maneuver.name.includes(substring);
  };

  switch (type) {
    case "movement":
      // Check if the roll involves movement
      return safeIncludes(rollData.skill, "athletics") || 
             safeIncludes(rollData.skill, "acrobatics") ||
             maneuverIncludes("dodge");
    
    case "hearing":
      // Check if the roll involves hearing
      return safeIncludes(rollData.skill, "perception") && 
             rollData.characteristic === "per";
    
    case "influence":
      // Check if the roll involves social influence
      return safeIncludes(rollData.skill, "charm") || 
             safeIncludes(rollData.skill, "leadership") || 
             safeIncludes(rollData.skill, "knavery");
    
    case "persuasion":
      // Check if the roll involves persuasion
      return safeIncludes(rollData.skill, "charm") && 
             maneuverIncludes("persuade");
    
    case "coercion":
      // Check if the roll involves coercion
      return safeIncludes(rollData.skill, "leadership") && 
             maneuverIncludes("coerce");
    
    case "offensive":
      // Check if the roll is an offensive action
      return rollData.isWeapon || 
             safeIncludes(rollData.skill, "fight") || 
             safeIncludes(rollData.skill, "shoot");
    
    case "defensive":
      // Check if the roll is a defensive action
      return maneuverIncludes("dodge") || 
             maneuverIncludes("parry");
    
    case "wyrd":
      // Check if the roll involves Wyrd
      return rollData.wyrdPointUsed;
    
    case "social":
      // Check if the roll involves social skills
      return safeIncludes(rollData.skill, "charm") || 
             safeIncludes(rollData.skill, "leadership") || 
             safeIncludes(rollData.skill, "knavery") || 
             safeIncludes(rollData.skill, "etiquette");
    
    case "other":
      // Any roll that doesn't match the above types
      return !rollMatchesType(rollData, "movement") && 
             !rollMatchesType(rollData, "hearing") && 
             !rollMatchesType(rollData, "influence") && 
             !rollMatchesType(rollData, "offensive") && 
             !rollMatchesType(rollData, "defensive") && 
             !rollMatchesType(rollData, "wyrd") && 
             !rollMatchesType(rollData, "social");
    
    default:
      return false;
  }
}

/**
 * Apply effect modifiers to a roll
 * @param {Object} rollData - Data about the roll being performed
 * @param {Object} effectModifiers - Effect modifiers to apply
 * @returns {Object} Updated roll data with modifiers applied
 */
export function applyEffectModifiersToRoll(rollData, effectModifiers) {
  if (!effectModifiers) return rollData;
  
  const updatedRollData = { ...rollData };
  
  // Apply general modifier
  updatedRollData.modifier = (updatedRollData.modifier || 0) + effectModifiers.modifier;
  
  // Apply specific modifiers based on roll type
  if (rollData.characteristic === "per") {
    updatedRollData.modifier += effectModifiers.perceptionModifier;
  }
  
  // Apply physical modifiers to physical actions
  if (rollIsPhysical(rollData)) {
    updatedRollData.modifier += effectModifiers.physicalModifier;
  }
  
  // Apply mental modifiers to mental actions
  if (rollIsMental(rollData)) {
    updatedRollData.modifier += effectModifiers.mentalModifier;
  }
  
  // Apply social modifiers to social actions
  if (rollIsSocial(rollData)) {
    updatedRollData.modifier += effectModifiers.socialModifier;
  }
  
  // Apply roll advantage/disadvantage
  if (effectModifiers.rollAdvantage && effectModifiers.rollDisadvantage) {
    // They cancel each other out
    updatedRollData.rollType = "normal";
  } else if (effectModifiers.rollAdvantage) {
    updatedRollData.rollType = "advantage";
  } else if (effectModifiers.rollDisadvantage) {
    updatedRollData.rollType = "disadvantage";
  }
  
  // Apply auto-fail
  if (effectModifiers.autoFail) {
    updatedRollData.autoFail = true;
  }
  
  // Apply extra VP cost
  updatedRollData.extraVPCost = (updatedRollData.extraVPCost || 0) + effectModifiers.extraVPCost;
  
  // Apply initiative modifiers
  if (rollData.isInitiative) {
    if (effectModifiers.initiativeAdvantage && effectModifiers.initiativeDisadvantage) {
      // They cancel each other out
    } else if (effectModifiers.initiativeAdvantage) {
      updatedRollData.modifier += 2;
    } else if (effectModifiers.initiativeDisadvantage) {
      updatedRollData.modifier -= 2;
    }
  }
  
  // Apply random target
  if (effectModifiers.randomTarget) {
    updatedRollData.randomTarget = true;
  }
  
  // Apply cannot act
  if (effectModifiers.cannotAct) {
    updatedRollData.cannotAct = true;
  }
  
  return updatedRollData;
}

/**
 * Check if a roll is for a physical action
 * @param {Object} rollData - Data about the roll being performed
 * @returns {boolean} Whether the roll is for a physical action
 */
function rollIsPhysical(rollData) {
  const physicalSkills = [
    "athletics", "fight", "melee", "shoot", "slug", "throw", "vigor"
  ];
  
  const physicalCharacteristics = ["str", "dex", "end"];
  
  return physicalSkills.some(skill => rollData.skill?.includes(skill)) ||
         physicalCharacteristics.includes(rollData.characteristic) ||
         rollData.isWeapon;
}

/**
 * Check if a roll is for a mental action
 * @param {Object} rollData - Data about the roll being performed
 * @returns {boolean} Whether the roll is for a mental action
 */
function rollIsMental(rollData) {
  const mentalSkills = [
    "craft", "investigation", "lore", "observe", "science", "tech", "think", "wyrd"
  ];
  
  const mentalCharacteristics = ["int", "wit", "per"];
  
  return mentalSkills.some(skill => rollData.skill?.includes(skill)) ||
         mentalCharacteristics.includes(rollData.characteristic);
}

/**
 * Check if a roll is for a social action
 * @param {Object} rollData - Data about the roll being performed
 * @returns {boolean} Whether the roll is for a social action
 */
function rollIsSocial(rollData) {
  const socialSkills = [
    "arts", "charm", "disguise", "empathy", "etiquette", "impress", "knavery", "leadership"
  ];
  
  const socialCharacteristics = ["pre", "pas", "ext"];
  
  return socialSkills.some(skill => rollData.skill?.includes(skill)) ||
         socialCharacteristics.includes(rollData.characteristic);
}

/**
 * Apply resistance modifiers from effects
 * @param {number} baseResistance - The base resistance value
 * @param {Array} attackProperties - Properties of the attack
 * @param {Object} effectModifiers - Effect modifiers to apply
 * @returns {number} The modified resistance value
 */
export function applyEffectModifiersToResistance(baseResistance, attackProperties, effectModifiers) {
  if (!effectModifiers || !effectModifiers.resistanceModifiers.length) {
    return baseResistance;
  }
  
  let modifiedResistance = baseResistance;
  
  // Apply resistance modifiers that match the attack properties
  for (const resistanceMod of effectModifiers.resistanceModifiers) {
    if (attackProperties.includes(resistanceMod.type)) {
      if (resistanceMod.value) {
        modifiedResistance += resistanceMod.value;
      }
      
      if (resistanceMod.advantage) {
        // Advantage on resistance means the attack is at disadvantage
        // This would be handled elsewhere in the attack logic
      }
    }
  }
  
  return modifiedResistance;
}

/**
 * Format active effects for display in the roll dialog
 * @param {Actor} actor - The actor to get effects from
 * @param {Object} rollData - Data about the roll being performed
 * @returns {Array} Formatted active effects for the template
 */
export function formatActiveEffectsForDisplay(actor) {
  if (!actor) return [];
  
  // Get all non-disabled effects on the actor
  const effects = actor.effects.filter(e => !e.disabled);
  
  // Format effects for display
  return effects.map(effect => {
    const effectTitle = effect.name.toUpperCase();
    const effectModifiers = EFFECT_MODIFIER_MAP[effectTitle];
    
    // Skip effects that don't have modifiers defined
    if (!effectModifiers) return null;
    
    // Determine if this is a positive or negative effect
    let isPositive = false;
    let value = null;
    let icon = "fas fa-bolt"; // Default icon
    
    // Determine icon and value based on modifiers
    if (effectModifiers[EFFECT_MODIFIERS.ROLL_ADVANTAGE]) {
      isPositive = true;
      icon = "fas fa-arrow-up";
    } else if (effectModifiers[EFFECT_MODIFIERS.ROLL_DISADVANTAGE]) {
      isPositive = false;
      icon = "fas fa-arrow-down";
    } else if (effectModifiers[EFFECT_MODIFIERS.MODIFIER]) {
      value = effectModifiers[EFFECT_MODIFIERS.MODIFIER];
      isPositive = value > 0;
      icon = "fas fa-dice-d20";
    } else if (effectModifiers[EFFECT_MODIFIERS.PERCEPTION_MODIFIER]) {
      value = effectModifiers[EFFECT_MODIFIERS.PERCEPTION_MODIFIER];
      isPositive = value > 0;
      icon = "fas fa-eye";
    } else if (effectModifiers[EFFECT_MODIFIERS.PHYSICAL_MODIFIER]) {
      value = effectModifiers[EFFECT_MODIFIERS.PHYSICAL_MODIFIER];
      isPositive = value > 0;
      icon = "fas fa-fist-raised";
    } else if (effectModifiers[EFFECT_MODIFIERS.MENTAL_MODIFIER]) {
      value = effectModifiers[EFFECT_MODIFIERS.MENTAL_MODIFIER];
      isPositive = value > 0;
      icon = "fas fa-brain";
    } else if (effectModifiers[EFFECT_MODIFIERS.SOCIAL_MODIFIER]) {
      value = effectModifiers[EFFECT_MODIFIERS.SOCIAL_MODIFIER];
      isPositive = value > 0;
      icon = "fas fa-users";
    } else if (effectModifiers[EFFECT_MODIFIERS.AUTO_FAIL]) {
      isPositive = false;
      icon = "fas fa-times-circle";
    } else if (effectModifiers[EFFECT_MODIFIERS.CANNOT_ACT]) {
      isPositive = false;
      icon = "fas fa-ban";
    } else if (effectModifiers[EFFECT_MODIFIERS.RANDOM_TARGET]) {
      isPositive = false;
      icon = "fas fa-random";
    } else if (effectModifiers[EFFECT_MODIFIERS.EXTRA_VP_COST]) {
      value = effectModifiers[EFFECT_MODIFIERS.EXTRA_VP_COST];
      isPositive = false;
      icon = "fas fa-gem";
    }
    
    return {
      id: effect.id,
      label: effect.name,
      icon: icon,
      value: value,
      isPositive: isPositive,
      disabled: false
    };
  }).filter(e => e !== null);
} 