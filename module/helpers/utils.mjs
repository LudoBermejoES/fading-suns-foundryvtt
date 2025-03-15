/**
 * Recursively merge two objects, favoring the second object's values
 * @param {Object} target - The target object to merge into
 * @param {Object} source - The source object to merge from
 * @param {Object} [options] - Additional options for the merge
 * @param {boolean} [options.overwrite=true] - Whether to overwrite existing properties
 * @param {boolean} [options.recursive=true] - Whether to recursively merge objects
 * @param {boolean} [options.inplace=true] - Whether to modify the target object in-place
 * @returns {Object} The merged object
 */
export function mergeObject(target, source, options = {}) {
  // Set default options
  const defaults = { overwrite: true, recursive: true, inplace: true };
  options = { ...defaults, ...options };

  // Handle edge cases
  if (!source || typeof source !== 'object') return target;
  if (!target || typeof target !== 'object') {
    if (options.inplace) {
      throw new Error("Cannot merge object into non-object in-place");
    }
    return source;
  }

  // Create a copy of the target if not merging in-place
  const output = options.inplace ? target : JSON.parse(JSON.stringify(target));

  // Iterate through the source object
  for (let key in source) {
    if (!source.hasOwnProperty(key)) continue;
    
    const sourceValue = source[key];
    
    // Handle case where key doesn't exist in target or we're overwriting
    if (!output.hasOwnProperty(key) || !options.recursive || !options.overwrite) {
      if (options.overwrite) {
        output[key] = sourceValue;
      }
      continue;
    }
    
    const targetValue = output[key];
    
    // If both values are objects, recursively merge them
    if (
      sourceValue && targetValue && 
      typeof sourceValue === 'object' && typeof targetValue === 'object'
    ) {
      // Handle arrays specially
      if (Array.isArray(sourceValue)) {
        output[key] = options.overwrite ? sourceValue : targetValue;
      } else {
        output[key] = mergeObject(targetValue, sourceValue, options);
      }
    }
    // Otherwise overwrite the target value if allowed
    else if (options.overwrite) {
      output[key] = sourceValue;
    }
  }
  
  return output;
} 