/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createDocMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes("Actor.") && !data.uuid.includes("Token.")) {
    return ui.notifications.warn(
      "You can only create macro buttons for owned Items",
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.fadingsuns.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command,
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "fading-suns.itemMacro": true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
export function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: "Item",
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`,
      );
    }

    // Trigger the item roll
    item.roll();
  });
}

/**
 * Create an NPC creation macro
 * @param {string} npcType The type of NPC to create (e.g., "bandit", "priest")
 * @param {number} slot The hotbar slot to use
 * @returns {Promise}
 */
export async function createNpcMacro(npcType, slot) {
  // Define the macro function based on npc type
  let macroName;
  let scriptPath;
  
  switch(npcType.toLowerCase()) {
    case "field bandit":
    case "bandit field":
      macroName = "Create Field Bandit";
      scriptPath = "scripts/create-npcs.js";
      break;
    case "city bandit":
    case "bandit city":
      macroName = "Create City Bandit";
      scriptPath = "scripts/create-npcs.js";
      break;
    case "space station bandit":
    case "bandit space":
      macroName = "Create Space Station Bandit";
      scriptPath = "scripts/create-npcs.js";
      break;
    case "vicar vassal":
    case "vassal":
      macroName = "Create Vicar's Vassal";
      scriptPath = "scripts/create-npcs.js";
      break;
    case "inquisitor":
      macroName = "Create Inquisitor";
      scriptPath = "scripts/create-npcs.js";
      break;
    case "court gossip":
    case "gossip":
      macroName = "Create Court Gossip";
      scriptPath = "scripts/create-npcs.js";
      break;
    case "meddling priest":
    case "priest":
      macroName = "Create Meddling Priest";
      scriptPath = "scripts/create-npcs.js";
      break;
    case "merchant":
    case "vendor":
      macroName = "Create Merchant";
      scriptPath = "scripts/create-npcs.js";
      break;
    default:
      return ui.notifications.warn(`Unknown NPC type: ${npcType}`);
  }

  // Check if the macro already exists
  let macro = game.macros.find(m => m.name === macroName);
  
  if (!macro) {
    // Create the macro by importing the function from the script file
    const command = `fetch("/${scriptPath}")
  .then(response => response.text())
  .then(script => {
    // Define a wrapper to extract and execute the specific function we need
    const extractFunction = (fnName, scriptText) => {
      const fnRegex = new RegExp("async function " + fnName + "\\\\s*\\\\(.*?\\\\)\\\\s*\\\\{[\\\\s\\\\S]*?\\\\n\\\\}", 'g');
      const match = scriptText.match(fnRegex);
      if (match && match[0]) {
        return match[0];
      }
      return null;
    };
    
    // Extract all the necessary helper functions
    const createBaseNPC = extractFunction('createBaseNPC', script);
    const addItemToActor = extractFunction('addItemToActor', script);
    const createWeaponData = extractFunction('createWeaponData', script);
    const createFirearmData = extractFunction('createFirearmData', script);
    const createArmorData = extractFunction('createArmorData', script);
    const createManeuverData = extractFunction('createManeuverData', script);
    
    // Extract the specific NPC creation function
    const specificFunction = extractFunction('${macroName.replace("Create ", "create")}', script);
    
    if (!specificFunction) {
      ui.notifications.error("Couldn't find function in the script.");
      return;
    }
    
    // Evaluate the helper functions first
    eval(createBaseNPC);
    eval(addItemToActor);
    eval(createWeaponData);
    eval(createFirearmData);
    eval(createArmorData);
    eval(createManeuverData);
    
    // Then evaluate and execute the specific function
    eval(specificFunction);
    eval("(${macroName.replace("Create ", "create")})()");
  })
  .catch(error => {
    console.error("Error executing NPC creation script:", error);
    ui.notifications.error("Failed to create NPC. See console for details.");
  });`;
    
    macro = await Macro.create({
      name: macroName,
      type: "script",
      img: "icons/svg/mystery-man.svg",
      command: command,
      flags: { "fading-suns.npcMacro": true },
    });
  }
  
  // Assign the macro to the hotbar slot
  if (slot) game.user.assignHotbarMacro(macro, slot);
  return macro;
}

/**
 * Create a full set of NPC macros for all types in the system
 * @returns {Promise} 
 */
export async function createAllNpcMacros() {
  const command = `// This will create all NPC macros from scripts/create-npcs.js
fetch("/scripts/create-npcs.js")
  .then(response => response.text())
  .then(script => {
    eval(script);
  })
  .catch(error => {
    console.error("Error executing NPC creation script:", error);
    ui.notifications.error("Failed to create NPC macros. See console for details.");
  });`;
  
  const macro = await Macro.create({
    name: "Create All NPC Macros",
    type: "script",
    img: "icons/svg/village.svg",
    command: command,
    flags: { "fading-suns.npcMacroGenerator": true },
  });
  
  ui.notifications.info("Created 'Create All NPC Macros' macro");
  return macro;
} 