/**
 * Helper functions for species-related calculations
 */

/**
 * Species data mapping based on the provided size.txt file
 * Maps species names to their size and movement speed
 */
export const SPECIES_DATA = {
  "Ascorbita": { size: 5, speed: 10 },
  "Gannok": { size: 4, speed: 8 },
  "Etyri": { size: 5, speed: 10, flying: 12, note: "Can be size 6 with speed 12m" },
  "Hironem": { size: 5, speed: 10 },
  "Humano": { size: 5, speed: 10 },
  "Human": { size: 5, speed: 10 },
  "Oro'ym": { size: 5, speed: 10, swimming: 10 },
  "Shantor": { size: 7, speed: 28, note: "Quadruped movement" },
  "Urobun": { size: 5, speed: 10 },
  "Ukar": { size: 5, speed: 10 },
  "Vorox": { size: 7, speed: 14, fourLegs: 21, sixLegs: 28 }
};

/**
 * Calculate the vitality max based on species size and other attributes
 * Vitality = Species Size + Constitution + Will + Faith + Level
 * 
 * @param {Object} actor - The actor
 * @return {Number} The calculated max vitality
 */
export function calculateVitality(actor) {
  const data = actor.system;
  const speciesName = data.specie;
  const species = SPECIES_DATA[speciesName] || { size: 5 }; // Default to human if species not found
  
  // Get the necessary attribute values
  const constitution = data.characteristics?.end || 0;
  const will = data.characteristics?.wits || 0;
  const faith = data.characteristics?.fth || 0;
  const level = data.level?.value || 0;
  
  // Calculate vitality
  return species.size + constitution + will + faith + level;
}

/**
 * Get the size value for the specified species
 * 
 * @param {String} speciesName - The name of the species
 * @return {Number} The size value
 */
export function getSpeciesSize(speciesName) {
  return SPECIES_DATA[speciesName]?.size || 5; // Default to human size
}

/**
 * Get the movement speed for the specified species
 * 
 * @param {String} speciesName - The name of the species
 * @return {Number} The movement speed
 */
export function getSpeciesSpeed(speciesName) {
  return SPECIES_DATA[speciesName]?.speed || 10; // Default to human speed
}

/**
 * Update an actor's size, speed, and vitality based on their species
 * 
 * @param {Object} actor - The actor to update
 * @return {Boolean} True if any updates were made
 */
export function updateActorSpeciesAttributes(actor) {
  if (!actor || actor.type !== "Character") return false;
  
  const data = actor.system;
  const speciesName = data.specie;
  if (!speciesName) return false;
  
  let needsUpdate = false;
  const updates = {};
  
  // Calculate size
  const size = getSpeciesSize(speciesName);
  if (data.size?.value !== size) {
    updates["system.size.value"] = size;
    needsUpdate = true;
  }
  
  // Calculate speed
  const speed = getSpeciesSpeed(speciesName);
  if (data.speed?.value !== speed) {
    updates["system.speed.value"] = speed;
    needsUpdate = true;
  }
  
  // Calculate vitality
  const vitality = calculateVitality(actor);
  if (data.vitality?.max !== vitality) {
    updates["system.vitality.max"] = vitality;
    needsUpdate = true;
  }
  
  // Update the actor if needed
  if (needsUpdate) {
    actor.update(updates);
    return true;
  }
  
  return false;
} 