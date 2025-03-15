/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class FadingSunsItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // Prepare data for the item. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
    
    // Ensure armor items have the equipped field
    if (this.type === 'Armor' && this.system.equipped === undefined) {
      this.system.equipped = false;
    }
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   * @returns {Object} The roll data object
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const rollData = { ...this.system };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} [event] The originating click event
   * @returns {Promise<Roll|ChatMessage>} The created Roll or ChatMessage instance
   */
  async roll(event) {
    // Get basic chat data
    const chatData = this._getChatData();
    
    // If there's no roll formula, send a simple chat message
    if (!this.system.formula) {
      return this._createContentOnlyMessage(chatData);
    }
    
    // Otherwise, create a roll and send a chat message from it
    return this._createRollMessage(chatData);
  }
  
  /**
   * Prepare basic chat data for any roll
   * @private
   * @returns {Object} Basic chat data
   */
  _getChatData() {
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get("core", "rollMode");
    const label = `[${this.type}] ${this.name}`;
    
    return { speaker, rollMode, label };
  }
  
  /**
   * Create a chat message with only content, no roll
   * @private
   * @param {Object} chatData Basic chat data
   * @returns {Promise<ChatMessage>} The created ChatMessage instance
   */
  async _createContentOnlyMessage(chatData) {
    return ChatMessage.create({
      speaker: chatData.speaker,
      rollMode: chatData.rollMode,
      flavor: chatData.label,
      content: this.system.description ?? ""
    });
  }
  
  /**
   * Create a roll and send it to chat
   * @private
   * @param {Object} chatData Basic chat data
   * @returns {Promise<Roll>} The created Roll instance
   */
  async _createRollMessage(chatData) {
    // Retrieve roll data
    const rollData = this.getRollData();
    
    // Create the roll
    const roll = new Roll(rollData.formula, rollData);
    
    // If you need to store the value first, uncomment the next line.
    // const result = await roll.evaluate();
    
    // Send to chat
    await roll.toMessage({
      speaker: chatData.speaker,
      rollMode: chatData.rollMode,
      flavor: chatData.label
    });
    
    return roll;
  }
}
