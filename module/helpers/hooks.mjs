import { createDocMacro } from './macros.mjs';

/**
 * Register hooks used by the Fading Suns system
 */
export const registerHooks = () => {
  // Register init hook
  registerInitHooks();
  
  // Register ready hook
  registerReadyHooks();
  
  // Register combat hooks
  registerCombatHooks();
  
  // Register chat message hooks
  registerChatMessageHooks();
};

/**
 * Register hooks that should run during init
 */
function registerInitHooks() {
  // No additional init hooks beyond what's in the main file
}

/**
 * Register hooks that should run when the system is ready
 */
function registerReadyHooks() {
  Hooks.once("ready", function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on("hotbarDrop", (bar, data, slot) => createDocMacro(data, slot));
  });
}

/**
 * Register hooks related to combat
 */
function registerCombatHooks() {
  Hooks.on('combatTurn', (evt) => {
    const currentCombatant = game.combat.nextCombatant;
    if (currentCombatant && currentCombatant.actor.isOwner) {
      currentCombatant.actor.system.cache = 0;
      currentCombatant.actor.update({ system: currentCombatant.actor.system });
    }
  });

  Hooks.on('combatRound', (evt) => {
    const currentCombatant = game.combat.nextCombatant;
    if (currentCombatant && currentCombatant.actor.isOwner) {
      currentCombatant.actor.system.cache = 0;
      currentCombatant.actor.update({ system: currentCombatant.actor.system });
    }
  });
}

/**
 * Register hooks for chat message interactions
 */
function registerChatMessageHooks() {
  // Add a listener for the spend VP button in chat messages
  Hooks.on("renderChatMessage", (message, html, data) => {
    // Find the spend VP button
    html.find(".spend-vp-button").click(async (event) => {
      event.preventDefault();
      
      // Get the data from the button
      const button = event.currentTarget;
      const vpNeeded = parseInt(button.dataset.vpNeeded);
      const actorId = button.dataset.actorId;
      
      // Get the actor
      const actor = game.actors.get(actorId);
      if (!actor) return;
      
      // Check if the actor has enough VP
      if (actor.system.bank.victoryPoints < vpNeeded) {
        ui.notifications.warn(`${actor.name} doesn't have enough Victory Points to succeed.`);
        return;
      }
      
      // Spend the VP
      actor.system.bank.victoryPoints -= vpNeeded;
      await actor.update({ system: actor.system });
      
      // Update the chat message to show success
      const messageContent = html.find(".result-roll .tooltiptext");
      messageContent.text(game.i18n.format("FADING_SUNS.messages.SUCCESS"));
      
      // Send a notification message to the chat
      ChatMessage.create({
        content: game.i18n.format("FADING_SUNS.messages.VP_SPENT_TO_SUCCEED", {vpSpent: vpNeeded}),
        speaker: ChatMessage.getSpeaker({actor: actor}),
      });
      
      // Remove the button
      button.parentElement.remove();
    });
    
    // Handle defense button clicks
    html.find(".defense-button").click(async (event) => {
      event.preventDefault();
      
      // Get the data from the button
      const button = event.currentTarget;
      const defenseType = button.dataset.defenseType;
      const attackerId = button.dataset.attackerId;
      const targetId = button.dataset.targetId;
      const messageId = button.dataset.messageId;
      const rollTotal = parseInt(button.dataset.rollTotal);
      
      // Only show the defense option to the target's owner
      const target = game.actors.get(targetId);
      if (!target || !target.isOwner) {
        ui.notifications.warn("You don't have permission to defend with this character.");
        return;
      }
      
      // Get the attacker
      const attacker = game.actors.get(attackerId);
      if (!attacker) return;
      
      // Set up the defense roll based on defense type
      let defenseSkill, defenseCharacteristic, defenseLabel;
      
      switch (defenseType) {
        case "Evadir": // For ranged attacks (DISPARAR)
          defenseSkill = "Esquivar";
          defenseCharacteristic = "dex";
          defenseLabel = game.i18n.localize("FADING_SUNS.defense.EVADIR");
          break;
        case "Bloquear": // For melee attacks (CUERPO A CUERPO)
          defenseSkill = "Bloquear";
          defenseCharacteristic = "str";
          defenseLabel = game.i18n.localize("FADING_SUNS.defense.BLOQUEAR");
          break;
        case "Esquivar": // For melee attacks (PELEAR)
          defenseSkill = "Esquivar";
          defenseCharacteristic = "dex";
          defenseLabel = game.i18n.localize("FADING_SUNS.defense.ESQUIVAR");
          break;
        case "Envalentonarse": // For mental/social attacks
          defenseSkill = "Disciplina";
          defenseCharacteristic = "wits";
          defenseLabel = game.i18n.localize("FADING_SUNS.defense.ENVALENTONARSE");
          break;
        default:
          return;
      }
      
      // Import the rollDice class
      const RollDice = (await import("../dialogs/rollDice.mjs")).default;
      
      // Set up dataset for the defense roll
      const dataset = {
        label: defenseSkill,
        value: target.system.skills[defenseSkill] || 0,
        characteristic: defenseCharacteristic,
        translated: defenseLabel,
        isDefense: true,
        attackTotal: rollTotal,
        attackerId: attackerId,
        messageId: messageId
      };
      
      // Create and render the RollDice dialog for defense
      const rollDialog = new RollDice(target, dataset);
      rollDialog.render(true);
      
      // Disable all defense buttons in this message since the character is now defending
      html.find(".defense-button").prop("disabled", true).addClass("disabled");
      
      // Add a note to the message
      const defenseNote = document.createElement("div");
      defenseNote.classList.add("defense-note");
      defenseNote.innerHTML = `<i class="fas fa-shield-alt"></i> ${target.name} ${game.i18n.format("FADING_SUNS.messages.IS_DEFENDING")}`;
      html.find(".defense-options").append(defenseNote);
    });
  });
} 