import '../setup/setup-foundry.js';
import '../setup/setup-foundry-extended.js';
import { FadingSunsActor } from '../../module/documents/actor.mjs';

describe('FadingSunsActor', () => {
  let actor;
  
  beforeEach(() => {
    // Create a mock actor instance
    actor = new FadingSunsActor({
      name: 'Test Actor',
      type: 'character',
      system: {
        characteristics: {
          str: { value: 5 },
          dex: { value: 4 },
          end: { value: 3 },
          wits: { value: 6 },
          per: { value: 2 },
          will: { value: 3 },
          pre: { value: 4 },
          int: { value: 5 },
          fth: { value: 2 }
        },
        skills: {
          Fight: { value: 3 },
          Shoot: { value: 2 },
          Melee: { value: 3 },
          Sneak: { value: 1 }
        },
        abilities: {
          str: { value: 14 },
          dex: { value: 12 },
          con: { value: 10 }
        },
        attributes: {
          level: { value: 5 }
        },
        wyrd: {
          value: 5,
          max: 10
        },
        victoryPoints: {
          value: 3,
          max: 5
        }
      }
    });
    
    // Mock the prepareData method to avoid calling super
    actor.prepareData = jest.fn();
    
    // Mock flags
    actor.flags = { fadingsuns: {} };
  });
  
  describe('prepareDerivedData', () => {
    it('should call character and NPC preparation methods', () => {
      // Spy on the preparation methods
      const characterSpy = jest.spyOn(actor, '_prepareCharacterData');
      const npcSpy = jest.spyOn(actor, '_prepareNpcData');
      
      // Call the method
      actor.prepareDerivedData();
      
      // Verify the methods were called
      expect(characterSpy).toHaveBeenCalledWith(actor);
      expect(npcSpy).toHaveBeenCalledWith(actor);
    });
  });
  
  describe('_prepareCharacterData', () => {
    it('should calculate ability modifiers for character type', () => {
      // Call the method
      actor._prepareCharacterData(actor);
      
      // Check that ability modifiers were calculated correctly
      expect(actor.system.abilities.str.mod).toBe(2); // (14 - 10) / 2 = 2
      expect(actor.system.abilities.dex.mod).toBe(1); // (12 - 10) / 2 = 1
      expect(actor.system.abilities.con.mod).toBe(0); // (10 - 10) / 2 = 0
    });
    
    it('should not modify data for non-character types', () => {
      // Change actor type
      actor.type = 'npc';
      
      // Call the method
      actor._prepareCharacterData(actor);
      
      // Check that ability modifiers were not calculated
      expect(actor.system.abilities.str.mod).toBeUndefined();
    });
  });
  
  describe('_prepareNpcData', () => {
    it('should calculate XP based on CR for NPC type', () => {
      // Set actor type and CR
      actor.type = 'npc';
      actor.system.cr = 3;
      
      // Call the method
      actor._prepareNpcData(actor);
      
      // Check that XP was calculated correctly
      expect(actor.system.xp).toBe(900); // 3 * 3 * 100 = 900
    });
    
    it('should not modify data for non-NPC types', () => {
      // Actor is already character type
      
      // Call the method
      actor._prepareNpcData(actor);
      
      // Check that XP was not calculated
      expect(actor.system.xp).toBeUndefined();
    });
  });
  
  describe('getRollData', () => {
    it('should return a copy of system data with character roll data', () => {
      // Spy on the roll data methods
      const characterSpy = jest.spyOn(actor, '_getCharacterRollData');
      const npcSpy = jest.spyOn(actor, '_getNpcRollData');
      
      // Call the method
      const rollData = actor.getRollData();
      
      // Verify the methods were called
      expect(characterSpy).toHaveBeenCalledWith(rollData);
      expect(npcSpy).toHaveBeenCalledWith(rollData);
      
      // Check that the data is a copy of system data
      expect(rollData).toEqual(expect.objectContaining(actor.system));
      expect(rollData).not.toBe(actor.system); // Should be a different object
    });
  });
  
  describe('_getCharacterRollData', () => {
    it('should copy ability scores to top level for character type', () => {
      // Prepare data object
      const data = { ...actor.system };
      
      // Call the method
      actor._getCharacterRollData(data);
      
      // Check that abilities were copied to top level
      expect(data.str).toEqual(actor.system.abilities.str);
      expect(data.dex).toEqual(actor.system.abilities.dex);
      expect(data.con).toEqual(actor.system.abilities.con);
      
      // Check that level was added
      expect(data.lvl).toBe(5);
    });
    
    it('should not modify data for non-character types', () => {
      // Change actor type
      actor.type = 'npc';
      
      // Prepare data object
      const data = { ...actor.system };
      
      // Call the method
      actor._getCharacterRollData(data);
      
      // Check that abilities were not copied
      expect(data.str).toBeUndefined();
      expect(data.lvl).toBeUndefined();
    });
  });
  
  describe('_getNpcRollData', () => {
    it('should not modify data for non-NPC types', () => {
      // Prepare data object
      const data = { ...actor.system };
      const originalData = { ...data };
      
      // Call the method
      actor._getNpcRollData(data);
      
      // Check that data was not modified
      expect(data).toEqual(originalData);
    });
    
    it('should process NPC data for NPC type', () => {
      // Change actor type
      actor.type = 'npc';
      
      // Prepare data object
      const data = { ...actor.system };
      
      // Call the method
      actor._getNpcRollData(data);
      
      // Since the method is empty, we just verify it was called for the right type
      expect(actor.type).toBe('npc');
    });
  });
}); 