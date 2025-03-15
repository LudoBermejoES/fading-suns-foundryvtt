import './setup/setup-foundry.js';
import './setup/setup-foundry-extended.js';

// Mock the modules before importing them
jest.mock('../module/documents/actor.mjs', () => ({
  FadingSunsActor: class FadingSunsActor {}
}));

jest.mock('../module/documents/item.mjs', () => ({
  FadingSunsItem: class FadingSunsItem {}
}));

jest.mock('../module/sheets/actor-sheet.mjs', () => ({
  FadingSunsActorSheet: class FadingSunsActorSheet {}
}));

jest.mock('../module/sheets/item-sheet.mjs', () => ({
  FadingSunsItemSheet: class FadingSunsItemSheet {}
}));

jest.mock('../module/helpers/config.mjs', () => ({
  FADING_SUNS: {
    itemTypes: {
      weapon: 'Weapon',
      armor: 'Armor'
    }
  }
}));

// Import the mocked classes
import { FadingSunsActor } from '../module/documents/actor.mjs';
import { FadingSunsItem } from '../module/documents/item.mjs';
import { FadingSunsActorSheet } from '../module/sheets/actor-sheet.mjs';
import { FadingSunsItemSheet } from '../module/sheets/item-sheet.mjs';
import { FADING_SUNS } from '../module/helpers/config.mjs';

describe('Fading Suns System', () => {
  let fadingSuns;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock global objects
    global.Hooks = {
      once: jest.fn((hook, callback) => {
        if (hook === 'init' || hook === 'ready') {
          callback();
        }
      }),
      on: jest.fn((hook, callback) => {
        // Store the callback for testing
        if (hook === 'combatTurn' || hook === 'combatRound') {
          global.Hooks[hook] = callback;
        }
      })
    };
    
    global.CONFIG = {
      Combat: {
        initiative: {}
      },
      Actor: {
        documentClass: null
      },
      Item: {
        documentClass: null
      },
      ActiveEffect: {
        legacyTransferral: true
      }
    };
    
    global.Actors = {
      unregisterSheet: jest.fn(),
      registerSheet: jest.fn()
    };
    
    global.Items = {
      unregisterSheet: jest.fn(),
      registerSheet: jest.fn()
    };
    
    global.ActorSheet = jest.fn();
    global.ItemSheet = jest.fn();
    
    global.game = {
      i18n: {
        format: jest.fn().mockImplementation((key) => key)
      },
      combat: {
        nextCombatant: {
          actor: {
            isOwner: true,
            system: {
              cache: 5
            },
            update: jest.fn()
          }
        }
      },
      user: {
        assignHotbarMacro: jest.fn()
      },
      macros: {
        find: jest.fn().mockReturnValue(null)
      }
    };
    
    global.ui = {
      notifications: {
        warn: jest.fn()
      }
    };
    
    global.Macro = {
      create: jest.fn().mockResolvedValue({ id: 'macro1' })
    };
    
    global.Item = {
      fromDropData: jest.fn().mockResolvedValue({
        name: 'Test Item',
        parent: { id: 'actor1' },
        roll: jest.fn()
      })
    };
    
    global.$ = jest.fn().mockReturnValue({
      on: jest.fn()
    });
    
    global.Handlebars = {
      registerHelper: jest.fn()
    };
    
    // Import the system file to trigger the hooks
    jest.isolateModules(() => {
      require('../module/fading-suns.mjs');
    });
    
    // Get the fadingSuns global object
    fadingSuns = global.fadingSuns;
  });
  
  describe('Init Hook', () => {
    it('should set up CONFIG.FADING_SUNS', () => {
      expect(CONFIG.FADING_SUNS).toBe(FADING_SUNS);
    });
    
    it('should configure initiative formula', () => {
      expect(CONFIG.Combat.initiative).toEqual({
        formula: '1d20 + @abilities.dex.mod',
        decimals: 2
      });
    });
    
    it('should set document classes', () => {
      expect(CONFIG.Actor.documentClass).toBe(FadingSunsActor);
      expect(CONFIG.Item.documentClass).toBe(FadingSunsItem);
    });
    
    it('should configure active effect transferral', () => {
      expect(CONFIG.ActiveEffect.legacyTransferral).toBe(false);
    });
    
    it('should register actor sheet', () => {
      expect(Actors.unregisterSheet).toHaveBeenCalledWith('core', ActorSheet);
      expect(Actors.registerSheet).toHaveBeenCalledWith('fading-suns', FadingSunsActorSheet, {
        makeDefault: true,
        label: 'FADING_SUNS.SheetLabels.Actor'
      });
    });
    
    it('should register item sheet', () => {
      expect(Items.unregisterSheet).toHaveBeenCalledWith('core', ItemSheet);
      expect(Items.registerSheet).toHaveBeenCalledWith('fading-suns', FadingSunsItemSheet, {
        makeDefault: true,
        label: 'FADING_SUNS.SheetLabels.Item'
      });
    });
    
    it('should register Handlebars helpers', () => {
      expect(Handlebars.registerHelper).toHaveBeenCalledWith('for', expect.any(Function));
      expect(Handlebars.registerHelper).toHaveBeenCalledWith('eq', expect.any(Function));
      expect(Handlebars.registerHelper).toHaveBeenCalledWith('toLowerCase', expect.any(Function));
      expect(Handlebars.registerHelper).toHaveBeenCalledWith('toJSON', expect.any(Function));
    });
  });
  
  describe('Ready Hook', () => {
    it('should register hotbar drop hook', () => {
      expect(Hooks.on).toHaveBeenCalledWith('hotbarDrop', expect.any(Function));
    });
  });
  
  describe('Combat Hooks', () => {
    it('should register combat turn hook', () => {
      expect(Hooks.on).toHaveBeenCalledWith('combatTurn', expect.any(Function));
    });
    
    it('should register combat round hook', () => {
      expect(Hooks.on).toHaveBeenCalledWith('combatRound', expect.any(Function));
    });
    
    it('should reset cache on combat turn', () => {
      // Call the stored callback
      Hooks.combatTurn({});
      
      // Check that the actor's cache was reset
      expect(game.combat.nextCombatant.actor.system.cache).toBe(0);
      expect(game.combat.nextCombatant.actor.update).toHaveBeenCalled();
    });
    
    it('should reset cache on combat round', () => {
      // Call the stored callback
      Hooks.combatRound({});
      
      // Check that the actor's cache was reset
      expect(game.combat.nextCombatant.actor.system.cache).toBe(0);
      expect(game.combat.nextCombatant.actor.update).toHaveBeenCalled();
    });
  });
  
  describe('Handlebars Helpers', () => {
    it('should implement the "for" helper', () => {
      // Get the for helper function
      const forHelper = Handlebars.registerHelper.mock.calls.find(call => call[0] === 'for')[1];
      
      // Mock block.fn to return the index
      const block = { fn: (i) => `Item ${i}` };
      
      // Call the helper
      const result = forHelper(1, 4, 1, block);
      
      // Check the result
      expect(result).toBe('Item 1Item 2Item 3');
    });
    
    it('should implement the "eq" helper', () => {
      // Get the eq helper function
      const eqHelper = Handlebars.registerHelper.mock.calls.find(call => call[0] === 'eq')[1];
      
      // Call the helper with equal values
      const result1 = eqHelper('a', 'a', 'a', {});
      expect(result1).toBe(true);
      
      // Call the helper with unequal values
      const result2 = eqHelper('a', 'b', 'a', {});
      expect(result2).toBe(false);
    });
    
    it('should implement the "toLowerCase" helper', () => {
      // Get the toLowerCase helper function
      const toLowerCaseHelper = Handlebars.registerHelper.mock.calls.find(call => call[0] === 'toLowerCase')[1];
      
      // Call the helper
      const result = toLowerCaseHelper('TEST');
      
      // Check the result
      expect(result).toBe('test');
    });
    
    it('should implement the "toJSON" helper', () => {
      // Get the toJSON helper function
      const toJSONHelper = Handlebars.registerHelper.mock.calls.find(call => call[0] === 'toJSON')[1];
      
      // Call the helper
      const obj = { a: 1, b: 2 };
      const result = toJSONHelper(obj);
      
      // Check the result
      expect(result).toBe(JSON.stringify(obj, null, 3));
    });
  });
}); 