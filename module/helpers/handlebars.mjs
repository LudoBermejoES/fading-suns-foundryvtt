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
    const args = Array.prototype.slice.call(arguments, 0, -1);
    return args.join('');
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