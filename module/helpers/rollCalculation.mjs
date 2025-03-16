/**
 * Helper functions for roll calculations
 */

import { getEffectModifiers, applyEffectModifiersToRoll, applyEffectModifiersToResistance } from './rollEffects.mjs';
import { calculateEffectiveResistance } from './combat.mjs';

/**
 * Calculate the total for a roll
 * @param {Object} rollData - Data about the roll being performed
 * @param {Actor} actor - The actor performing the roll
 * @returns {Object} The calculated roll data
 */
export function calculateRoll(rollData, actor) {
  // Get effect modifiers
  const effectModifiers = getEffectModifiers(actor, rollData);
  
  // Apply effect modifiers to roll data
  const modifiedRollData = applyEffectModifiersToRoll(rollData, effectModifiers);
  
  // Check if actor cannot act due to effects
  if (modifiedRollData.cannotAct) {
    return {
      ...modifiedRollData,
      total: 0,
      success: false,
      critical: false,
      failure: true,
      totalFailure: true,
      message: game.i18n.localize("FADING_SUNS.Roll.CannotAct")
    };
  }
  
  // Check for auto-fail
  if (modifiedRollData.autoFail) {
    return {
      ...modifiedRollData,
      total: 0,
      success: false,
      critical: false,
      failure: true,
      totalFailure: true,
      message: game.i18n.localize("FADING_SUNS.Roll.AutoFail")
    };
  }
  
  // Calculate the total
  const characteristicValue = actor.system.characteristics[modifiedRollData.characteristic]?.value || 0;
  const skillValue = modifiedRollData.skill ? (actor.system.skills[modifiedRollData.skill]?.value || 0) : 0;
  const victoryPoints = modifiedRollData.victoryPointsSelected || 0;
  const extraModifiers = modifiedRollData.modifier || 0;
  
  const total = characteristicValue + skillValue + victoryPoints + extraModifiers;
  
  // Return the calculated data
  return {
    ...modifiedRollData,
    characteristicValue,
    skillValue,
    victoryPoints,
    extraModifiers,
    total,
    // These will be set after the dice are rolled
    success: false,
    critical: false,
    failure: false,
    totalFailure: false,
    message: ""
  };
}

/**
 * Determine the roll type based on effect modifiers
 * @param {Object} rollData - Data about the roll being performed
 * @param {Actor} actor - The actor performing the roll
 * @returns {string} The roll type: "normal", "advantage", or "disadvantage"
 */
export function determineRollType(rollData, actor) {
  // Get effect modifiers
  const effectModifiers = getEffectModifiers(actor, rollData);
  
  // Determine roll type
  if (effectModifiers.rollAdvantage && effectModifiers.rollDisadvantage) {
    // They cancel each other out
    return "normal";
  } else if (effectModifiers.rollAdvantage) {
    return "advantage";
  } else if (effectModifiers.rollDisadvantage) {
    return "disadvantage";
  }
  
  // Default to normal
  return rollData.rollType || "normal";
}

/**
 * Calculate the effective resistance for a target
 * @param {Actor} target - The target actor
 * @param {Object} attackData - Data about the attack
 * @param {Actor} attacker - The attacking actor
 * @returns {number} The calculated resistance value
 */
export function calculateTargetResistance(target, attackData, attacker) {
  if (!target) return 0;
  
  // Get the base resistance
  const baseResistance = target.system.resistances?.corporal?.value || 0;
  
  // Get armor resistances
  const armorResistances = {};
  const armorItems = target.items.filter(i => i.type === "armor" && i.system.equipped);
  
  for (const armor of armorItems) {
    for (const [key, value] of Object.entries(armor.system.resistances || {})) {
      armorResistances[key] = (armorResistances[key] || 0) + value;
    }
  }
  
  // Calculate effective resistance based on attack properties and armor
  const effectiveResistance = calculateEffectiveResistance(
    baseResistance,
    attackData.attackProperties || [],
    armorResistances
  );
  
  // Get effect modifiers for the target
  const effectModifiers = getEffectModifiers(target, {
    isDefending: true,
    attackProperties: attackData.attackProperties || []
  });
  
  // Apply effect modifiers to resistance
  return applyEffectModifiersToResistance(
    effectiveResistance,
    attackData.attackProperties || [],
    effectModifiers
  );
}

/**
 * Process the result of a roll
 * @param {Object} rollData - Data about the roll
 * @param {number} diceResult - The result of the dice roll
 * @returns {Object} The processed roll result
 */
export function processRollResult(rollData, diceResult) {
  const result = { ...rollData };
  
  // Check for success or failure
  if (diceResult <= rollData.total) {
    result.success = true;
    result.failure = false;
    
    // Check for critical success
    if (diceResult === 1) {
      result.critical = true;
      result.message = game.i18n.localize("FADING_SUNS.Roll.CriticalSuccess");
    } else {
      result.message = game.i18n.localize("FADING_SUNS.Roll.Success");
    }
  } else {
    result.success = false;
    result.failure = true;
    
    // Check for total failure
    if (diceResult === 20) {
      result.totalFailure = true;
      result.message = game.i18n.localize("FADING_SUNS.Roll.TotalFailure");
    } else {
      result.message = game.i18n.localize("FADING_SUNS.Roll.Failure");
    }
  }
  
  // Add the dice result
  result.diceResult = diceResult;
  
  return result;
}

/**
 * Calculate damage for a weapon attack
 * @param {Object} rollResult - The result of the attack roll
 * @param {Item} weapon - The weapon item
 * @param {number} resistance - The target's resistance
 * @returns {Object} The calculated damage data
 */
export function calculateDamage(rollResult, weapon, resistance) {
  if (!weapon || !rollResult.success) {
    return {
      damage: 0,
      damageFormula: "",
      damageResult: 0,
      finalDamage: 0
    };
  }
  
  // Get the base damage
  const baseDamage = weapon.system.damage || 0;
  
  // Calculate damage formula
  let damageFormula = `${baseDamage}`;
  
  // Add bonus damage for critical success
  if (rollResult.critical) {
    damageFormula += " + 2";
  }
  
  // Subtract resistance
  const finalDamage = Math.max(0, parseInt(baseDamage) + (rollResult.critical ? 2 : 0) - resistance);
  
  return {
    damage: baseDamage,
    damageFormula,
    damageResult: parseInt(baseDamage) + (rollResult.critical ? 2 : 0),
    finalDamage,
    resistance
  };
}

/**
 * Check if a roll has a random target due to effects
 * @param {Object} rollData - Data about the roll
 * @param {Actor} actor - The actor performing the roll
 * @returns {boolean} Whether the roll has a random target
 */
export function hasRandomTarget(rollData, actor) {
  const effectModifiers = getEffectModifiers(actor, rollData);
  return effectModifiers.randomTarget || false;
}

/**
 * Calculate the extra VP cost due to effects
 * @param {Object} rollData - Data about the roll
 * @param {Actor} actor - The actor performing the roll
 * @returns {number} The extra VP cost
 */
export function calculateExtraVPCost(rollData, actor) {
  const effectModifiers = getEffectModifiers(actor, rollData);
  return effectModifiers.extraVPCost || 0;
}

/**
 * Check if an actor can spend VP based on effects
 * @param {Actor} actor - The actor to check
 * @returns {boolean} Whether the actor can spend VP
 */
export function canSpendVP(actor) {
  const effectModifiers = getEffectModifiers(actor, {});
  return effectModifiers.extraVPCost < 999; // Using 999 as a sentinel value for "cannot spend VP"
} 