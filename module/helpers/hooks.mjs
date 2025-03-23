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

    // Get token object from the canvas
    const token = canvas.tokens.get(targetId);

    // If you need the actor linked to the token
    const target = token?.actor;

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

  // Add click handler for "spend VP to increase damage" buttons in damage messages
  $(document).on('click', '.spend-vp-button-damage', async function(event) {
    event.preventDefault();
    
    const button = event.currentTarget;
    const vpCost = parseInt(button.dataset.vpCost);
    const cacheCost = parseInt(button.dataset.cacheCost);
    const damageBoost = parseInt(button.dataset.damageBoost);
    const actorId = button.dataset.actorId;
    
    // Get the actor
    const actor = game.actors.get(actorId);
    if (!actor) return;
    
    // Check if the user has permission to modify this actor
    if (!actor.isOwner) {
      ui.notifications.warn(game.i18n.localize("FADING_SUNS.Warnings.NoPermission"));
      return;
    }
    
    // Check if actor has enough VP and cache
    const currentVP = actor.system.bank.victoryPoints;
    const currentCache = actor.system.cache || 0;
    
    if (currentVP < vpCost || currentCache < cacheCost) {
      ui.notifications.error(game.i18n.localize("FADING_SUNS.Errors.NotEnoughPoints"));
      return;
    }
    
    // Update actor to spend both cache and VP
    const updates = {};
    
    // Only update cache if we're using some
    if (cacheCost > 0) {
      updates["system.cache"] = currentCache - cacheCost;
    }
    
    // Only update VP if we're using some
    if (vpCost > 0) {
      updates["system.bank.victoryPoints"] = currentVP - vpCost;
    }
    
    // Apply the updates
    await actor.update(updates);
    
    // Update the chat message to show the new damage
    const chatMessage = button.closest('.message');
    const damageText = chatMessage.querySelector('h1');
    
    if (damageText) {
      // Get the current damage value
      const damageRegex = /(\d+)/;
      const match = damageText.textContent.match(damageRegex);
      
      if (match) {
        const currentDamage = parseInt(match[1]);
        const newDamage = currentDamage + damageBoost;
        
        // Update the text
        const newDamageText = game.i18n.format("FADING_SUNS.damageChat.weaponDamage", { damage: newDamage });
        damageText.textContent = newDamageText;
        
        // Disable all VP buttons in this message since points have been spent
        const allButtons = chatMessage.querySelectorAll('.spend-vp-button-damage');
        allButtons.forEach(btn => {
          btn.disabled = true;
          btn.classList.add('disabled');
        });
        
        // Add a note showing points spent
        const noteDiv = document.createElement('div');
        noteDiv.classList.add('vp-spent-note');
        
        let spentMessage;
        if (cacheCost > 0 && vpCost > 0) {
          spentMessage = game.i18n.format("FADING_SUNS.damageChat.pointsSpentForDamage", { 
            cache: cacheCost, 
            vp: vpCost, 
            boost: damageBoost 
          });
        } else if (cacheCost > 0) {
          spentMessage = game.i18n.format("FADING_SUNS.damageChat.cacheSpentForDamage", { 
            cache: cacheCost, 
            boost: damageBoost 
          });
        } else {
          spentMessage = game.i18n.format("FADING_SUNS.damageChat.vpSpentForDamage", { 
            vp: vpCost, 
            boost: damageBoost 
          });
        }
        
        noteDiv.innerHTML = `<i class="fas fa-gem"></i> ${spentMessage}`;
        
        // Insert after the damage heading
        damageText.insertAdjacentElement('afterend', noteDiv);
        
        // Show notification
        ui.notifications.info(game.i18n.format("FADING_SUNS.Info.DamageIncreased", { damage: newDamage }));
      }
    }
  });
} 