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
 * Register hooks related to chat messages
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
      
      // Add a note about spending VP
      const noteHtml = `<div class="spend-vp-note">${game.i18n.format("FADING_SUNS.messages.VP_SPENT_TO_SUCCEED", { vpSpent: vpNeeded })}</div>`;
      html.find(".spend-vp-container").replaceWith(noteHtml);
      
      // Update the message in the database
      await message.update({ content: html.html() });
      
      ui.notifications.info(`${actor.name} spent ${vpNeeded} Victory Points to succeed.`);
    });
  });
} 