// Import Document classes.
import { FadingSunsActor } from "./documents/actor.mjs";
import { FadingSunsItem } from "./documents/item.mjs";
// Import sheet classes.
import { FadingSunsActorSheet } from "./sheets/actor-sheet.mjs";
import { FadingSunsItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { FADING_SUNS } from "./helpers/config.mjs";
// Import Handlebars helpers
import { registerHandlebarsHelpers } from "./helpers/handlebars.mjs";
// Import hooks
import { registerHooks } from "./helpers/hooks.mjs";
// Import macros
import * as macros from "./helpers/macros.mjs";
// Import effects
import { EFFECT_TYPES } from "./activeeffects/activeEffects.js";
import * as effectHelpers from "./helpers/effects.mjs";
import { getEffectModifiers, applyEffectModifiersToRoll, applyEffectModifiersToResistance, formatActiveEffectsForDisplay } from "./helpers/rollEffects.mjs"
import { calculateTargetResistance } from "./helpers/rollCalculation.mjs"
import { preloadHandlebarsTemplates } from "./helpers/handlebars.mjs";
import { registerSystemSettings } from "./helpers/settings.mjs";
import * as dragDrop from "./helpers/drag-drop.mjs";

console.log("Fading Suns module started loading");

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

// Add key classes to the global scope so they can be more easily used
// by downstream developers
globalThis.fadingSuns = {
  documents: {
    FadingSunsActor,
    FadingSunsItem,
  },
  applications: {
    FadingSunsActorSheet,
    FadingSunsItemSheet,
  },
  utils: {
    rollItemMacro: macros.rollItemMacro,
  },
};



Hooks.once("init", function () {
  // Add custom constants for configuration.
  CONFIG.FADING_SUNS = FADING_SUNS;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20 + @abilities.dex.mod",
    decimals: 2,
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = FadingSunsActor;
  CONFIG.Item.documentClass = FadingSunsItem;

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("fading-suns", FadingSunsActorSheet, {
    makeDefault: true,
    label: game.i18n.format("FADING_SUNS.SheetLabels.Actor"),
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("fading-suns", FadingSunsItemSheet, {
    makeDefault: true,
    label: game.i18n.format("FADING_SUNS.SheetLabels.Item"),
  });

  // Register Handlebars helpers
  registerHandlebarsHelpers();
  
  // Register hooks
  registerHooks();

  $(document).on('click', '*[data-action="moveToBank"]', function (evt, target) {
    const {
      vp,
      actorId,
    } = evt?.currentTarget?.dataset

    if(!actorId || !vp) return;
    const actor = game.actors.get(actorId);
    if(actor) {
       actor.system.bank.victoryPoints += Number(vp); 
       actor.system.cache -= Number(vp);
       actor.update({ system: actor.system });
    }

  });

  // Register custom system settings
  registerSystemSettings();

  console.log(`Fading Suns | Initializing`);

  // Register system settings
  game.fadingsuns = {
    FadingSunsActor,
    documentTypes: {
      Actor: {
        character: {}
      }
    },
    getAllActiveEffects: effectHelpers.prepareActiveEffectCategories,
    getActiveEffectsWithPredicate: effectHelpers.getEffectsByType,
    deactivateEffect: async (effectId, actor) => {
      const effect = actor.effects.get(effectId);
      if (effect) return effect.delete();
      return false;
    },
    getEffectModifiers,
    applyEffectModifiersToRoll,
    applyEffectModifiersToResistance,
    formatActiveEffectsForDisplay,
    calculateTargetResistance,
    rollItemMacro: macros.rollItemMacro,
    createNpcMacro: macros.createNpcMacro,
    createAllNpcMacros: macros.createAllNpcMacros
  };

  // Register sheet application classes
  dragDrop.registerSheets();

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", function () {
  // Wait to register hook events until game is ready
  registerHooks();
  
  // Register macro helpers
  CONFIG.Dice.terms["h"] = class HeroicDie extends Die {
    constructor(termData) {
      super({ faces: 6, number: 1, modifiers: [], ...termData });
    }
  };
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

Hooks.on("hotbarDrop", (bar, data, slot) => {
  if (data.type === "Item") {
    macros.createDocMacro(data, slot);
    return false;
  }
});

/* -------------------------------------------- */
