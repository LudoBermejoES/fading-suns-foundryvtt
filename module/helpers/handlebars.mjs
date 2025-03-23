/**
 * Register Handlebars helpers used by the Fading Suns system
 */
export const registerHandlebarsHelpers = () => {
  /**
   * A helper for iterating over a range of numbers
   * @param {number} from - Starting number
   * @param {number} to - Ending number (exclusive)
   * @param {number} incr - Increment value
   * @param {object} block - Handlebars block
   * @returns {string} Accumulated HTML
   */
  Handlebars.registerHelper("for", function (from, to, incr, block) {
    let accum = "";
    for (let i = from; i < to; i += incr) accum += block.fn(i);
    return accum;
  });

  /**
   * A helper to check if all arguments are equal
   * @returns {boolean} True if all arguments are equal
   */
  Handlebars.registerHelper("eq", function () {
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.every(function (expression) {
      return args[0] === expression;
    });
  });

  /**
   * A helper to convert a string to lowercase
   * @param {string} str - The string to convert
   * @returns {string} Lowercase string
   */
  Handlebars.registerHelper("toLowerCase", function (str) {
    return str.toLowerCase();
  });

  /**
   * A helper to convert an object to JSON
   * @param {object} obj - The object to convert
   * @returns {string} JSON string
   */
  Handlebars.registerHelper("toJSON", function (obj) {
    return JSON.stringify(obj, null, 3);
  });

  /**
   * A helper to concatenate strings
   * @returns {string} Concatenated string
   */
  Handlebars.registerHelper("concat", function() {
    let outStr = '';
    for (let arg in arguments) {
      if (typeof arguments[arg] !== 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  /**
   * A custom localize helper that properly handles parameters
   * @param {string} key - The localization key
   * @param {object} options - Handlebars options object with hash of parameters
   * @returns {string} Localized string with parameters replaced
   */
  Handlebars.registerHelper("localize", function(key, options) {
    // If no options hash is provided, just use the key
    if (!options.hash) {
      return game.i18n.localize(key);
    }
    
    // Otherwise, use format with the provided parameters
    return game.i18n.format(key, options.hash);
  });

  // Add the 'times' helper for iterating a specific number of times
  Handlebars.registerHelper('times', function(n, options) {
    let result = '';
    for (let i = 0; i < n; i++) {
      result += options.fn(i);
    }
    return result;
  });
};

/**
 * Preload Handlebars templates.
 * @return {Promise} Promise that resolves when templates are preloaded
 */
export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([
    // Actor templates
    "systems/fading-suns/templates/actor/header.hbs",
    "systems/fading-suns/templates/actor/features.hbs",
    "systems/fading-suns/templates/actor/biography.hbs",
    "systems/fading-suns/templates/actor/perks.hbs",
    "systems/fading-suns/templates/actor/powers.hbs",
    "systems/fading-suns/templates/actor/combat.hbs",
    "systems/fading-suns/templates/actor/gear.hbs",
    "systems/fading-suns/templates/actor/effects.hbs",
    
    // Item templates
    "systems/fading-suns/templates/item/header.hbs",
    "systems/fading-suns/templates/item/description.hbs",
    "systems/fading-suns/templates/item/effects.hbs",
    "systems/fading-suns/templates/item/maneuver.hbs",
    "systems/fading-suns/templates/item/power.hbs",
    "systems/fading-suns/templates/item/attribute-parts/gear.hbs",
    "systems/fading-suns/templates/item/attribute-parts/armor.hbs",
    "systems/fading-suns/templates/item/attribute-parts/feature.hbs",
    "systems/fading-suns/templates/item/attribute-parts/generic.hbs",
    "systems/fading-suns/templates/item/attribute-parts/firearmWeapon.hbs",
    "systems/fading-suns/templates/item/attribute-parts/status.hbs",
    "systems/fading-suns/templates/item/attribute-parts/meleeWeapon.hbs",
    
    // Dialog templates
    "systems/fading-suns/templates/dialogs/roll.hbs",
    "systems/fading-suns/templates/dialogs/damage.hbs",
    "systems/fading-suns/templates/dialogs/maneuver.hbs",
    "systems/fading-suns/templates/dialogs/predefined-effects.hbs",
    
    // Chat templates
    "systems/fading-suns/templates/chat/roll.hbs",
    "systems/fading-suns/templates/chat/damage.hbs",
    
    // Generic templates
    "templates/generic/tab-navigation.hbs"
  ]);
}; 