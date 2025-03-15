import '../setup/setup-foundry.js';
import '../setup/setup-foundry-extended.js';
import { FadingSunsItem } from '../../module/documents/item.mjs';

describe('FadingSunsItem', () => {
  let item;
  let mockActor;
  
  beforeEach(() => {
    // Create a mock actor
    mockActor = {
      getRollData: jest.fn().mockReturnValue({
        characteristics: {
          str: { value: 5 },
          dex: { value: 4 }
        },
        skills: {
          Fight: { value: 3 },
          Shoot: { value: 2 }
        }
      })
    };
    
    // Create a mock item instance
    item = new FadingSunsItem({
      name: 'Test Item',
      type: 'weapon',
      system: {
        description: 'A test weapon',
        damage: 'd6',
        formula: '1d6+@str.value',
        range: 'short',
        tech: 5,
        cost: 100
      }
    });
    
    // Mock the prepareData method to avoid calling super
    item.prepareData = jest.fn();
    
    // Set the actor
    item.actor = mockActor;
    
    // Mock global objects
    global.ChatMessage = {
      getSpeaker: jest.fn().mockReturnValue({ alias: 'Test Speaker' }),
      create: jest.fn().mockResolvedValue({})
    };
    
    global.game = {
      settings: {
        get: jest.fn().mockReturnValue('public')
      }
    };
    
    global.Roll = jest.fn().mockImplementation((formula, data) => {
      return {
        formula,
        data,
        evaluate: jest.fn().mockResolvedValue({ total: 10 }),
        toMessage: jest.fn().mockResolvedValue({})
      };
    });
  });
  
  describe('getRollData', () => {
    it('should return a copy of system data', () => {
      // Call the method
      const rollData = item.getRollData();
      
      // Check that the data is a copy of system data
      expect(rollData).toEqual(expect.objectContaining(item.system));
      expect(rollData).not.toBe(item.system); // Should be a different object
    });
    
    it('should include actor roll data if actor exists', () => {
      // Call the method
      const rollData = item.getRollData();
      
      // Check that actor data was included
      expect(rollData.actor).toBeDefined();
      expect(mockActor.getRollData).toHaveBeenCalled();
    });
    
    it('should not include actor data if actor does not exist', () => {
      // Remove actor
      item.actor = null;
      
      // Call the method
      const rollData = item.getRollData();
      
      // Check that actor data was not included
      expect(rollData.actor).toBeUndefined();
    });
  });
  
  describe('roll', () => {
    it('should create a chat message if no formula exists', async () => {
      // Remove formula
      item.system.formula = null;
      
      // Call the method
      await item.roll();
      
      // Check that ChatMessage.create was called with the right arguments
      expect(ChatMessage.create).toHaveBeenCalledWith({
        speaker: { alias: 'Test Speaker' },
        rollMode: 'public',
        flavor: '[weapon] Test Item',
        content: 'A test weapon'
      });
    });
    
    it('should create a roll and send it to chat if formula exists', async () => {
      // Call the method
      const result = await item.roll();
      
      // Check that Roll was created with the right arguments
      expect(Roll).toHaveBeenCalledWith('1d6+@str.value', expect.any(Object));
      
      // Check that roll.toMessage was called
      expect(result.toMessage).toHaveBeenCalledWith({
        speaker: { alias: 'Test Speaker' },
        rollMode: 'public',
        flavor: '[weapon] Test Item'
      });
    });
    
    it('should use roll data from the item and actor', async () => {
      // Call the method
      await item.roll();
      
      // Get the data passed to Roll constructor
      const rollData = Roll.mock.calls[0][1];
      
      // Check that it includes item data
      expect(rollData.description).toBe('A test weapon');
      expect(rollData.damage).toBe('d6');
      
      // Check that it includes actor data
      expect(rollData.actor).toBeDefined();
      expect(rollData.actor.characteristics.str.value).toBe(5);
    });
  });
}); 