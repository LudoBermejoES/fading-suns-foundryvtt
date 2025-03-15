import { mergeObject } from '../../module/helpers/utils.mjs';

// Mock Actor class
global.Actor = class Actor {
  constructor(data = {}) {
    this.id = data.id || 'actor1';
    this.name = data.name || 'Test Actor';
    this.type = data.type || 'character';
    this.system = data.system || {};
    this.items = new Map();
    this.effects = new Map();
    this.flags = data.flags || {};
    this.limited = data.limited || false;
    this.isOwner = true;
    this.overrides = {};
  }

  prepareData() {}
  prepareBaseData() {}
  prepareDerivedData() {}
  getRollData() { return { ...this.system }; }
  update() { return Promise.resolve(this); }
  updateEmbeddedDocuments() { return Promise.resolve([]); }
  allApplicableEffects() { return []; }

  static create() { return Promise.resolve(new Actor()); }
  static fromDropData() { return Promise.resolve(new Actor()); }
};

// Mock Item class
global.Item = class Item {
  constructor(data = {}) {
    this.id = data.id || 'item1';
    this.name = data.name || 'Test Item';
    this.type = data.type || 'weapon';
    this.system = data.system || {};
    this.effects = new Map();
    this.flags = data.flags || {};
    this.parent = data.parent || null;
    this.isOwner = true;
    this.uuid = data.uuid || 'Item.item1';
  }

  prepareData() {}
  getRollData() { return { ...this.system }; }
  roll() { return Promise.resolve({}); }
  update() { return Promise.resolve(this); }
  updateEmbeddedDocuments() { return Promise.resolve([]); }

  static create() { return Promise.resolve(new Item()); }
  static fromDropData() { return Promise.resolve(new Item()); }
};

// Mock ChatMessage class
global.ChatMessage = class ChatMessage {
  constructor(data = {}) {
    this.id = data.id || 'message1';
    this.content = data.content || '';
    this.speaker = data.speaker || {};
    this.flavor = data.flavor || '';
    this.rollMode = data.rollMode || 'public';
  }

  static create(data) { return Promise.resolve(new ChatMessage(data)); }
  static getSpeaker(options = {}) { return { alias: options.actor?.name || 'Speaker' }; }
};

// Mock Roll class
global.Roll = class Roll {
  constructor(formula, data = {}) {
    this.formula = formula;
    this.data = data;
    this.total = 10;
  }

  evaluate() { return Promise.resolve({ total: this.total }); }
  toMessage(options = {}) { return Promise.resolve(this); }
};

// Update CONFIG to use our mock classes
global.CONFIG = global.CONFIG || {};
global.CONFIG.Actor = global.CONFIG.Actor || {};
global.CONFIG.Item = global.CONFIG.Item || {};
global.CONFIG.Actor.documentClass = Actor;
global.CONFIG.Item.documentClass = Item;

// Mock ActorSheet and ItemSheet
global.ActorSheet = class ActorSheet {
  constructor(actor, options = {}) {
    this.actor = actor;
    this.options = options;
  }
};

global.ItemSheet = class ItemSheet {
  constructor(item, options = {}) {
    this.item = item;
    this.options = options;
  }
};

// Update game object with additional properties
global.game = global.game || {};
global.game.macros = global.game.macros || { find: jest.fn() };
global.game.combat = global.game.combat || {
  nextCombatant: {
    actor: {
      isOwner: true,
      system: { cache: 0 },
      update: jest.fn()
    }
  }
};
global.game.fadingSuns = global.game.fadingSuns || {
  utils: { rollItemMacro: jest.fn() }
};

// Mock ui
global.ui = global.ui || {
  notifications: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
};

// Mock Macro
global.Macro = global.Macro || {
  create: jest.fn().mockResolvedValue({ id: 'macro1' })
}; 