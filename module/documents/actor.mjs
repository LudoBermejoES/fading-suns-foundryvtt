/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class FadingSunsActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.fadingsuns || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
    
    // Update body resistance based on equipped armor
    this._updateBodyResistanceFromArmor();
  }

  /**
   * Prepare Character type specific data
   * @param {Object} actorData The actor data object
   * @private
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;

    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, ability] of Object.entries(systemData.abilities || {})) {
      // Calculate the modifier using d20 rules.
      ability.mod = Math.floor((ability.value - 10) / 2);
    }
  }

  /**
   * Prepare NPC type specific data.
   * @param {Object} actorData The actor data object
   * @private
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    systemData.xp = systemData.cr * systemData.cr * 100;
  }

  /**
   * Update body resistance based on equipped armor
   * @private
   */
  _updateBodyResistanceFromArmor() {
    // Only process if this is a character
    if (this.type !== 'character') return;
    
    // Find equipped armor - handle both array and collection cases
    let equippedArmor;
    if (Array.isArray(this.items)) {
      equippedArmor = this.items.find(i => i.type === 'armor' && i.system.equipped);
    } else if (this.items && typeof this.items.filter === 'function') {
      // For FoundryVTT's item collection
      const armorItems = this.items.filter(i => i.type === 'armor' && i.system.equipped);
      equippedArmor = armorItems.length > 0 ? armorItems[0] : null;
    }
    
    // If there's equipped armor, set body resistance to match armor's body resistance
    if (equippedArmor) {
      // Only update if the values are different to avoid infinite loops
      if (this.system.res.body.value !== equippedArmor.system.BodyResistance) {
        // We use a flag to prevent infinite loops when updating
        if (!this._updatingResistance) {
          this._updatingResistance = true;
          this.update({'system.res.body.value': equippedArmor.system.BodyResistance});
          this._updatingResistance = false;
        }
      }
    }
  }

  /**
   * Override getRollData() that's supplied to rolls.
   * @returns {Object} Data for rolls
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const data = { ...this.system };

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   * @param {Object} data The roll data
   * @private
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add level for easier access, or fall back to 0.
    if (data.attributes?.level) {
      data.lvl = data.attributes.level.value ?? 0;
    }
  }

  /**
   * Prepare NPC roll data.
   * @param {Object} data The roll data
   * @private
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }
  
  /**
   * Helper method to capitalize the first letter of a string
   * @returns {String} The capitalized string
   */
  static capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
