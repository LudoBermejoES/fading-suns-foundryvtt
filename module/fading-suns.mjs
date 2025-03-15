// Import document classes.
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
import { rollItemMacro } from "./helpers/macros.mjs";

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
    rollItemMacro,
  },
};

Hooks.once("init", function () {
  // Add custom cons6nts for configuration.
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

  $();

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

});

/* -------------------------------------------- */
