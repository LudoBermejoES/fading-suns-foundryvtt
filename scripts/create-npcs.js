// Scripts to create Fading Suns NPCs from npcs.txt
// These macros create simple NPCs based on the threat descriptions

// Base NPC creation function with common attributes
async function createBaseNPC(name, description, vitalityValue = 10) {
  // Check if an actor with this name already exists
  const existingActor = game.actors.find(a => a.name === name);
  if (existingActor) {
    ui.notifications.warn(`An actor named "${name}" already exists.`);
    return existingActor;
  }

  // Base characteristics - all set to 3 by default
  const baseCharacteristics = {
    "str": 3,
    "dex": 3,
    "end": 3,
    "wits": 3,
    "per": 3,
    "will": 3,
    "pre": 3,
    "int": 3,
    "fth": 3
  };
  
  // Base skills - all set to 3 by default
  const baseSkills = {
    "Academia": { "initial": 3, "value": 3 },
    "Alchemy": { "initial": 0, "value": 0 },
    "Animalia": { "initial": 3, "value": 3 },
    "Arts": { "initial": 3, "value": 3 },
    "Charm": { "initial": 3, "value": 3 },
    "Crafts": { "initial": 3, "value": 3 },
    "Disguise": { "initial": 3, "value": 3 },
    "Drive": { "initial": 3, "value": 3 },
    "Empathy": { "initial": 3, "value": 3 },
    "Fight": { "initial": 3, "value": 3 },
    "Focus": { "initial": 3, "value": 3 },
    "Impress": { "initial": 3, "value": 3 },
    "Interface": { "initial": 0, "value": 0 },
    "Intrusion": { "initial": 3, "value": 3 },
    "Knavery": { "initial": 3, "value": 3 },
    "Melee": { "initial": 3, "value": 3 },
    "Observe": { "initial": 3, "value": 3 },
    "Perform": { "initial": 3, "value": 3 },
    "Pilot": { "initial": 0, "value": 0 },
    "Remedy": { "initial": 3, "value": 3 },
    "Shoot": { "initial": 3, "value": 3 },
    "SleightOfHand": { "initial": 3, "value": 3 },
    "Sneak": { "initial": 3, "value": 3 },
    "Survival": { "initial": 3, "value": 3 },
    "TechRedemption": { "initial": 3, "value": 3 },
    "Vigor": { "initial": 3, "value": 3 }
  };

  // Default resistances
  const baseResistances = {
    "body": { "value": 0, "mod": "" },
    "mind": { "value": 0, "mod": "" },
    "spirit": { "value": 0, "mod": "" }
  };

  // Create the base NPC
  const actorData = {
    name: name,
    type: "Character",
    img: "icons/svg/mystery-man.svg",
    system: {
      biography: description,
      vitality: {
        max: vitalityValue,
        value: vitalityValue
      },
      maxVitality: vitalityValue,
      characteristics: baseCharacteristics,
      skills: baseSkills,
      res: baseResistances,
      bank: {
        maxBankPoints: 5,
        victoryPoints: 0,
        wyrdPoints: 0
      },
      cache: 0,
      level: 1
    }
  };

  // Create the actor
  return await Actor.create(actorData);
}

// Helper to add items (weapons, armor, etc.) to an actor
async function addItemToActor(actor, itemData) {
  return await actor.createEmbeddedDocuments("Item", [itemData]);
}

// Helper to create a weapon item
function createWeaponData(name, damage, type = "MeleeWeapon") {
  return {
    name: name,
    type: type,
    img: "icons/svg/sword.svg",
    system: {
      description: "",
      Damage: damage,
      TL: 4,
      Weight: 1,
      MinStrength: 3,
      Features: [],
      Size: "Medium",
      characteristics: []
    }
  };
}

// Helper to create a firearm
function createFirearmData(name, damage, range = "10/20", ammo = 6) {
  return {
    name: name,
    type: "FirearmWeapon",
    img: "icons/svg/pistol.svg",
    system: {
      description: "",
      Damage: damage,
      TL: 4,
      Weight: 2,
      MinStrength: 3,
      Ramge: range, // Note: This typo is in the template.json
      RateOfFire: 1,
      Ammo: ammo,
      Type: "Pistol",
      Features: [],
      Size: "Medium",
      characteristics: []
    }
  };
}

// Helper to create armor
function createArmorData(name, bodyResistance) {
  return {
    name: name,
    type: "Armor",
    img: "icons/svg/armor.svg",
    system: {
      description: "",
      TL: 4,
      BodyResistance: bodyResistance,
      Grade: "Standard",
      DexPenalty: 0,
      VigorPenalty: 0,
      Disponibility: "Common",
      BlasterResistance: false,
      FlameResistance: false,
      HardResistance: false,
      LaserResistance: false,
      ShockResistance: false,
      SlamResistance: false,
      SonicResistance: false,
      UltraHardResistance: false
    }
  };
}

// Helper to create a maneuver
function createManeuverData(name, type, skill, characteristic, impact) {
  return {
    name: name,
    type: "Maneuver",
    img: "icons/svg/combat.svg",
    system: {
      type: type, // "combat", "action", "defense", "influence"
      action: "attack",
      competence: "",
      time: "action",
      roll: {
        skill: skill,
        characteristic: characteristic
      },
      resistance: "",
      impact: impact,
      modifier: 0
    }
  };
}

// =================================================================
// PHYSICAL THREATS
// =================================================================

// 1. BANDIDOS DE CAMPO (Field Bandits)
async function createFieldBandit() {
  const description = "Criminales profesionales con tatuajes, escarificaciones rituales o marcas legales. Engañan a sus víctimas hasta que es demasiado tarde.";
  
  // Create the base NPC
  const actor = await createBaseNPC("Bandido de Campo", description);
  
  // Adjust characteristics for bandits - increase combat-related stats
  await actor.update({
    "system.characteristics.dex": 4,
    "system.characteristics.str": 4,
    "system.skills.Melee.value": 4,
    "system.skills.Shoot.value": 4,
    "system.skills.Knavery.value": 5,
    "system.res.body.value": 1
  });
  
  // Add weapons
  await addItemToActor(actor, createWeaponData("Cuchillo", 3));
  await addItemToActor(actor, {
    name: "Arco",
    type: "FirearmWeapon", // Using FirearmWeapon type for consistency
    img: "icons/svg/bow.svg",
    system: {
      description: "",
      Damage: 4,
      TL: 1,
      Weight: 2,
      MinStrength: 3,
      Ramge: "15/30",
      RateOfFire: 1,
      Ammo: 20,
      Type: "Bow",
      Features: [],
      Size: "Large",
      characteristics: []
    }
  });
  
  // Add maneuvers
  await addItemToActor(actor, createManeuverData("Cuchillada", "combat", "Melee", "dex", "9"));
  await addItemToActor(actor, createManeuverData("Disparar arco", "combat", "Shoot", "dex", "9"));
  await addItemToActor(actor, createManeuverData("Engañar", "influence", "Knavery", "wits", "10"));
  
  ui.notifications.info(`Bandido de Campo created: ${actor.name}`);
  return actor;
}

// 2. BANDIDOS DE CIUDAD (City Bandits)
async function createCityBandit() {
  const description = "Criminales profesionales con tatuajes, escarificaciones rituales o marcas legales. Engañan a sus víctimas hasta que es demasiado tarde.";
  
  // Create the base NPC
  const actor = await createBaseNPC("Bandido de Ciudad", description);
  
  // Adjust characteristics for city bandits
  await actor.update({
    "system.characteristics.dex": 4,
    "system.characteristics.str": 4,
    "system.skills.Melee.value": 4,
    "system.skills.Shoot.value": 4,
    "system.skills.Knavery.value": 5,
    "system.res.body.value": 1
  });
  
  // Add weapons and armor
  await addItemToActor(actor, createWeaponData("Cuchillo", 3));
  await addItemToActor(actor, createFirearmData("Pistola", 5));
  await addItemToActor(actor, createWeaponData("Porra de choque", 6));
  await addItemToActor(actor, createArmorData("Armadura de cuero", 1));
  
  // Add maneuvers
  await addItemToActor(actor, createManeuverData("Cuchillada", "combat", "Melee", "dex", "9"));
  await addItemToActor(actor, createManeuverData("Disparar pistola", "combat", "Shoot", "dex", "9"));
  await addItemToActor(actor, createManeuverData("Engañar", "influence", "Knavery", "wits", "10"));
  await addItemToActor(actor, createManeuverData("Golpear con porra de choque", "combat", "Melee", "str", "9"));
  
  ui.notifications.info(`Bandido de Ciudad created: ${actor.name}`);
  return actor;
}

// 3. BANDIDOS DE ESTACIÓN ESPACIAL (Space Station Bandits)
async function createSpaceStationBandit() {
  const description = "Criminales profesionales con tatuajes, escarificaciones rituales o marcas legales. Engañan a sus víctimas hasta que es demasiado tarde.";
  
  // Create the base NPC
  const actor = await createBaseNPC("Bandido de Estación Espacial", description);
  
  // Adjust characteristics for space station bandits
  await actor.update({
    "system.characteristics.dex": 4,
    "system.characteristics.str": 4,
    "system.skills.Melee.value": 4,
    "system.skills.Shoot.value": 5,
    "system.skills.Knavery.value": 5,
    "system.res.body.value": 2
  });
  
  // Add weapons and armor
  await addItemToActor(actor, {
    name: "Escopeta",
    type: "FirearmWeapon",
    img: "icons/svg/pistol.svg",
    system: {
      description: "Puede dañar el casco de un traje espacial.",
      Damage: 8,
      TL: 4,
      Weight: 3,
      MinStrength: 4,
      Ramge: "5/10",
      RateOfFire: 1,
      Ammo: 8,
      Type: "Shotgun",
      Features: ["Culata"],
      Size: "Large",
      characteristics: []
    }
  });
  await addItemToActor(actor, createWeaponData("Porra de choque", 6));
  await addItemToActor(actor, {
    name: "Traje espacial",
    type: "Armor",
    img: "icons/svg/hazard.svg",
    system: {
      description: "Protege contra el vacío del espacio.",
      TL: 6,
      BodyResistance: 2,
      Grade: "Sealed",
      DexPenalty: 1,
      VigorPenalty: 1,
      Disponibility: "Uncommon",
      BlasterResistance: false,
      FlameResistance: true,
      HardResistance: true,
      LaserResistance: false,
      ShockResistance: false,
      SlamResistance: true,
      SonicResistance: true,
      UltraHardResistance: false
    }
  });
  
  // Add maneuvers
  await addItemToActor(actor, createManeuverData("Disparar escopeta", "combat", "Shoot", "dex", "9"));
  await addItemToActor(actor, createManeuverData("Engañar", "influence", "Knavery", "wits", "10"));
  await addItemToActor(actor, createManeuverData("Golpear con porra de choque", "combat", "Melee", "str", "9"));
  
  ui.notifications.info(`Bandido de Estación Espacial created: ${actor.name}`);
  return actor;
}

// 4. VASALLO VICARIO (Vicar's Vassal)
async function createVicarVassal() {
  const description = "Vestidos con sotanas o capas con símbolos de llamas. Cruces de salto en la cara, pintadas con ceniza.";
  
  // Create the base NPC
  const actor = await createBaseNPC("Vasallo Vicario", description);
  
  // Adjust characteristics for vicar's vassals
  await actor.update({
    "system.characteristics.str": 4,
    "system.characteristics.will": 4,
    "system.skills.Fight.value": 4,
    "system.skills.Intimidate.value": 4,
    "system.skills.Remedy.value": 3,
    "system.res.body.value": 1
  });
  
  // Add weapons and items
  await addItemToActor(actor, {
    name: "Bomba incendiaria",
    type: "FirearmWeapon",
    img: "icons/svg/explosion.svg",
    system: {
      description: "Un contenedor de arcilla lleno de aceite o alcohol que se prende y lanza.",
      Damage: 3,
      TL: 1,
      Weight: 1,
      MinStrength: 2,
      Ramge: "5/10",
      RateOfFire: 1,
      Ammo: 1,
      Type: "Thrown",
      Features: ["Fuego"],
      Size: "Small",
      characteristics: []
    }
  });
  await addItemToActor(actor, {
    name: "Bastón con punta de alquitrán",
    type: "MeleeWeapon",
    img: "icons/svg/fire.svg",
    system: {
      description: "",
      Damage: 2,
      TL: 1,
      Weight: 2,
      MinStrength: 3,
      Features: ["Antorcha"],
      Size: "Medium",
      characteristics: []
    }
  });
  await addItemToActor(actor, {
    name: "Equipo incendiario",
    type: "Generic",
    img: "icons/svg/fire.svg",
    system: {
      description: "Botes de arcilla con alcohol o aceite, pedernal y acero.",
      TL: 1,
      weight: 2
    }
  });
  
  // Add maneuvers
  await addItemToActor(actor, createManeuverData("Lanzar bomba incendiaria", "combat", "Shoot", "dex", "9"));
  await addItemToActor(actor, createManeuverData("Puñetazo", "combat", "Fight", "str", "9"));
  
  ui.notifications.info(`Vasallo Vicario created: ${actor.name}`);
  return actor;
}

// 5. INQUISIDOR OFICIAL (Official Inquisitor)
async function createInquisitor() {
  const description = "Vestidos con sotanas o capas con símbolos de llamas. Cruces de salto en la cara, pintadas con ceniza.";
  
  // Create the base NPC
  const actor = await createBaseNPC("Inquisidor Oficial", description);
  
  // Adjust characteristics for inquisitors
  await actor.update({
    "system.characteristics.pre": 5,
    "system.characteristics.will": 5,
    "system.skills.Fight.value": 4,
    "system.skills.Intimidate.value": 5,
    "system.skills.Shoot.value": 4,
    "system.skills.Remedy.value": 3,
    "system.res.body.value": 1
  });
  
  // Add weapons and items
  await addItemToActor(actor, {
    name: "Lanzallamas",
    type: "FirearmWeapon",
    img: "icons/svg/fire.svg",
    system: {
      description: "Arma que dispara un chorro de llamas.",
      Damage: 5,
      TL: 4,
      Weight: 4,
      MinStrength: 4,
      Ramge: "5/10",
      RateOfFire: 1,
      Ammo: 10,
      Type: "Heavy",
      Features: ["Fuego", "Ignora armadura"],
      Size: "Large",
      characteristics: []
    }
  });
  await addItemToActor(actor, createWeaponData("Látigo", 3));
  await addItemToActor(actor, {
    name: "Sotana ignífuga",
    type: "Armor",
    img: "icons/svg/cloak.svg",
    system: {
      description: "Vestimenta tratada para resistir el fuego.",
      TL: 4,
      BodyResistance: 1,
      Grade: "Light",
      DexPenalty: 0,
      VigorPenalty: 0,
      Disponibility: "Uncommon",
      BlasterResistance: false,
      FlameResistance: true,
      HardResistance: false,
      LaserResistance: false,
      ShockResistance: false,
      SlamResistance: false,
      SonicResistance: false,
      UltraHardResistance: false
    }
  });
  
  // Add maneuvers
  await addItemToActor(actor, createManeuverData("Disparar lanzallamas", "combat", "Shoot", "dex", "9"));
  await addItemToActor(actor, createManeuverData("Intimidar", "influence", "Intimidate", "pre", "10"));
  await addItemToActor(actor, createManeuverData("Latigazo", "combat", "Melee", "dex", "9"));
  
  ui.notifications.info(`Inquisidor Oficial created: ${actor.name}`);
  return actor;
}

// =================================================================
// SOCIAL THREATS
// =================================================================

// 6. COTILLAS DE LA CORTE (Court Gossips)
async function createCourtGossip() {
  const description = "Visten de forma llamativa y destacan en la multitud. Suelen ocultar su afiliación para obtener información.";
  
  // Create the base NPC
  const actor = await createBaseNPC("Cotilla de la Corte", description);
  
  // Adjust characteristics for court gossips
  await actor.update({
    "system.characteristics.pre": 5,
    "system.characteristics.wits": 5,
    "system.skills.Charm.value": 5,
    "system.skills.Knavery.value": 5,
    "system.skills.Empathy.value": 4,
    "system.skills.Observe.value": 4,
    "system.res.spirit.value": 1
  });
  
  // Add items
  await addItemToActor(actor, {
    name: "Tinta y pluma",
    type: "Generic",
    img: "icons/svg/book.svg",
    system: {
      description: "Herramientas para tomar notas.",
      TL: 1,
      weight: 0.5
    }
  });
  await addItemToActor(actor, {
    name: "Dispositivo de grabación",
    type: "Generic",
    img: "icons/svg/sound.svg",
    system: {
      description: "Dispositivo oculto para grabar conversaciones.",
      TL: 6,
      weight: 0.2
    }
  });
  await addItemToActor(actor, {
    name: "Calderilla (2 fénix)",
    type: "Generic",
    img: "icons/svg/coins.svg",
    system: {
      description: "Monedas para sobornar o pagar por información.",
      TL: 1,
      weight: 0.1
    }
  });
  
  // Add maneuvers
  await addItemToActor(actor, createManeuverData("Engañar", "influence", "Knavery", "wits", "10"));
  await addItemToActor(actor, createManeuverData("Pedir", "influence", "Charm", "pre", "9"));
  
  ui.notifications.info(`Cotilla de la Corte created: ${actor.name}`);
  return actor;
}

// 7. SACERDOTES ENTROMETIDOS (Meddling Priests)
async function createMeddlingPriest() {
  const description = "Aparecen a la hora de comer y exigen hospitalidad o asistencia a sus sermones. Siempre consiguen información antes de marcharse.";
  
  // Create the base NPC
  const actor = await createBaseNPC("Sacerdote Entrometido", description);
  
  // Adjust characteristics for priests
  await actor.update({
    "system.characteristics.pre": 4,
    "system.characteristics.fth": 5,
    "system.skills.Charm.value": 4,
    "system.skills.Remedy.value": 4,
    "system.skills.Academia.value": 4,
    "system.skills.Empathy.value": 3
  });
  
  // Add items
  await addItemToActor(actor, {
    name: "Botella de vino",
    type: "Generic",
    img: "icons/svg/barrel.svg",
    system: {
      description: "Vino de buena calidad, útil para ganarse la confianza de otros.",
      TL: 1,
      weight: 1
    }
  });
  await addItemToActor(actor, {
    name: "Cruz de salto",
    type: "Generic",
    img: "icons/svg/holy.svg",
    system: {
      description: "Símbolo religioso de la Iglesia Universal.",
      TL: 4,
      weight: 0.2
    }
  });
  await addItemToActor(actor, {
    name: "Hierbas medicinales",
    type: "Generic",
    img: "icons/svg/plant.svg",
    system: {
      description: "Colección de hierbas para tratar heridas y enfermedades comunes.",
      TL: 1,
      weight: 0.5
    }
  });
  
  // Add maneuvers
  await addItemToActor(actor, createManeuverData("Pedir", "influence", "Charm", "pre", "9"));
  await addItemToActor(actor, createManeuverData("Presionar", "influence", "Academia", "fth", "10"));
  
  ui.notifications.info(`Sacerdote Entrometido created: ${actor.name}`);
  return actor;
}

// 8. VENDEDORES (Merchants)
async function createMerchant() {
  const description = "Llamativos y expertos en estafar a los ingenuos.";
  
  // Create the base NPC
  const actor = await createBaseNPC("Vendedor", description);
  
  // Adjust characteristics for merchants
  await actor.update({
    "system.characteristics.pre": 5,
    "system.characteristics.wits": 4,
    "system.skills.Charm.value": 5,
    "system.skills.Knavery.value": 5,
    "system.skills.Observe.value": 4
  });
  
  // Add items
  await addItemToActor(actor, {
    name: "Mercancías diversas",
    type: "Generic",
    img: "icons/svg/bag.svg",
    system: {
      description: "Colección de bienes para comerciar.",
      TL: 4,
      weight: 5
    }
  });
  await addItemToActor(actor, {
    name: "Chatarra de la Primera República",
    type: "Generic",
    img: "icons/svg/robot.svg",
    system: {
      description: "Tecnología antigua, posiblemente inútil pero de aspecto impresionante.",
      TL: 8,
      weight: 2
    }
  });
  
  // Add maneuvers
  await addItemToActor(actor, createManeuverData("Engañar", "influence", "Knavery", "wits", "10"));
  await addItemToActor(actor, createManeuverData("Pedir", "influence", "Charm", "pre", "9"));
  
  ui.notifications.info(`Vendedor created: ${actor.name}`);
  return actor;
}

// =================================================================
// MACRO BUTTON CREATION FUNCTIONS
// =================================================================

// Create a macro for each NPC type
async function createNPCMacro(name, func) {
  const command = `game.macros.find(m => m.name === "${name}").execute();`;
  
  // Check if macro already exists
  let macro = game.macros.find(m => m.name === name);
  
  if (!macro) {
    macro = await Macro.create({
      name: name,
      type: "script",
      img: "icons/svg/mystery-man.svg",
      command: `(${func.toString()})()`,
      flags: { "fading-suns.npcMacro": true }
    });
    ui.notifications.info(`Macro created: ${name}`);
  } else {
    ui.notifications.warn(`Macro ${name} already exists.`);
  }
  
  return macro;
}

// Create all NPC macros
async function createAllNPCMacros() {
  await createNPCMacro("Create Field Bandit", createFieldBandit);
  await createNPCMacro("Create City Bandit", createCityBandit);
  await createNPCMacro("Create Space Station Bandit", createSpaceStationBandit);
  await createNPCMacro("Create Vicar's Vassal", createVicarVassal);
  await createNPCMacro("Create Inquisitor", createInquisitor);
  await createNPCMacro("Create Court Gossip", createCourtGossip);
  await createNPCMacro("Create Meddling Priest", createMeddlingPriest);
  await createNPCMacro("Create Merchant", createMerchant);
  
  ui.notifications.info("All NPC macros created successfully!");
}

// Execute this to create all the macros
createAllNPCMacros(); 