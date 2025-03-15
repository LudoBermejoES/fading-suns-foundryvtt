/**
 * Constants used throughout the Fading Suns system
 */

/**
 * Character characteristics
 */
export const CHARACTERISTICS = {
  STR: "str",
  DEX: "dex",
  END: "end",
  WITS: "wits",
  PER: "per",
  WILL: "will",
  PRE: "pre",
  INT: "int",
  FTH: "fth"
};

/**
 * Skills available in the system
 */
export const SKILLS = {
  ACADEMIA: "Academia",
  ALCHEMY: "Alchemy",
  ANIMALIA: "Animalia",
  ARTS: "Arts",
  CHARM: "Charm",
  CRAFTS: "Crafts",
  DISGUISE: "Disguise",
  DRIVE: "Drive",
  EMPATHY: "Empathy",
  FIGHT: "Fight",
  FOCUS: "Focus",
  IMPRESS: "Impress",
  INTERFACE: "Interface",
  INTRUSION: "Intrusion",
  KNAVERY: "Knavery",
  MELEE: "Melee",
  OBSERVE: "Observe",
  PERFORM: "Perform",
  PILOT: "Pilot",
  REMEDY: "Remedy",
  SHOOT: "Shoot",
  SLEIGHT_OF_HAND: "SleightOfHand",
  SNEAK: "Sneak",
  SURVIVAL: "Survival",
  TECH_REDEMPTION: "TechRedemption",
  VIGOR: "Vigor"
};

/**
 * Item types
 */
export const ITEM_TYPES = {
  FEATURE: "feature",
  COMBAT: "combat",
  PERKS: "perks",
  POWERS: "powers",
  GEAR: "gear",
  GENERIC: "Generic",
  ARMOR: "Armor",
  MANEUVER: "Maneuver",
  POWER: "Power",
  MELEE_WEAPON: "MeleeWeapon",
  FIREARM_WEAPON: "FirearmWeapon",
  STATUS: "Status"
};

/**
 * Template paths
 */
export const TEMPLATES = {
  ITEM: {
    HEADER: "systems/fading-suns/templates/item/header.hbs",
    DESCRIPTION: "systems/fading-suns/templates/item/description.hbs",
    GEAR: "systems/fading-suns/templates/item/attribute-parts/gear.hbs",
    ARMOR: "systems/fading-suns/templates/item/attribute-parts/armor.hbs",
    EFFECTS: "systems/fading-suns/templates/item/effects.hbs",
    MANEUVER: "systems/fading-suns/templates/item/maneuver.hbs",
    POWER: "systems/fading-suns/templates/item/power.hbs",
    FEATURE: "systems/fading-suns/templates/item/attribute-parts/feature.hbs",
    GENERIC: "systems/fading-suns/templates/item/attribute-parts/generic.hbs",
    FIREARM_WEAPON: "systems/fading-suns/templates/item/attribute-parts/firearmWeapon.hbs",
    STATUS: "systems/fading-suns/templates/item/attribute-parts/status.hbs",
    MELEE_WEAPON: "systems/fading-suns/templates/item/attribute-parts/meleeWeapon.hbs"
  },
  GENERIC: {
    TAB_NAVIGATION: "templates/generic/tab-navigation.hbs"
  }
};

/**
 * Sheet tabs
 */
export const TABS = {
  ATTRIBUTES: "attributes",
  DESCRIPTION: "description",
  EFFECTS: "effects",
  MANEUVER: "maneuver",
  POWER: "power"
};

/**
 * Sheet parts
 */
export const PARTS = {
  HEADER: "header",
  TABS: "tabs",
  DESCRIPTION: "description",
  ATTRIBUTES_FEATURE: "attributesFeature",
  ATTRIBUTES_GENERIC: "attributesGeneric",
  ATTRIBUTES_GEAR: "attributesGear",
  ATTRIBUTES_ARMOR: "attributesArmor",
  ATTRIBUTES_FIREARM_WEAPON: "attributesFirearmWeapon",
  ATTRIBUTES_STATUS: "attributesStatus",
  ATTRIBUTES_MELEE_WEAPON: "attributesMeleeWeapon",
  ATTRIBUTES_COMBAT: "attributesCombat",
  ATTRIBUTES_PERKS: "attributesPerks",
  ATTRIBUTES_POWERS: "attributesPowers",
  EFFECTS: "effects",
  MANEUVER: "maneuver",
  POWER: "power",
  IMPACT: "impact"
};

/**
 * Maneuver types
 */
export const MANEUVER_TYPES = {
  ACTION: "action",
  COMBAT: "combat",
  DEFENSE: "defense",
  INFLUENCE: "influence"
};

/**
 * Power types
 */
export const POWER_TYPES = {
  PSIONIC: "psionic",
  THEURGY: "theurgy"
}; 