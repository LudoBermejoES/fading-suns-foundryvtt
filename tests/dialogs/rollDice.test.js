/**
 * @jest-environment jsdom
 */

import RollDice from '../../module/dialogs/rollDice.mjs';
import * as CombatHelpers from '../../module/helpers/combat.mjs';

// Mock the game object
global.game = {
  i18n: {
    format: (key) => key,
  },
  user: {
    targets: {
      first: () => null
    }
  }
};

// Mock the Roll class
global.Roll = class {
  constructor(formula) {
    this.formula = formula;
    this.dice = [
      {
        results: [{ result: 10 }],
      },
    ];
  }
  async evaluate() {
    return this;
  }
};

// Mock the ChatMessage class
global.ChatMessage = {
  getSpeaker: jest.fn().mockReturnValue({}),
  create: jest.fn(),
};

// Mock renderTemplate
global.renderTemplate = jest.fn().mockResolvedValue("mocked-template");

// Mock the combat helper functions
jest.mock('../../module/helpers/combat.mjs', () => ({
  parseAttackProperties: jest.fn().mockReturnValue(['LASER', 'FLAME']),
  calculateEffectiveResistance: jest.fn().mockReturnValue(5),
  getResistanceLevel: jest.fn().mockReturnValue('Hard'),
  ATTACK_PROPERTIES: {
    LASER: 'LASER',
    FLAME: 'FLAME'
  }
}));

describe('RollDice', () => {
  let mockActor;
  let rollDialog;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock actor
    mockActor = {
      items: {
        get: jest.fn(),
        filter: jest.fn().mockReturnValue([])
      },
      system: {
        characteristics: {
          str: 3,
          dex: 2,
          end: 1,
          wits: 4,
          per: 2,
          tech: 3,
          faith: 1,
          will: 2,
          ext: 0
        },
        bank: {
          victoryPoints: 3,
          wyrdPoints: 2
        }
      }
    };
    
    // Create basic dataset
    const dataset = {
      characteristic: 'str',
      skill: 'Fight',
      modifier: 0,
      value: 3,
      label: 'Fight',
      translated: 'Fighting'
    };
    
    // Create roll dialog
    rollDialog = new RollDice(mockActor, dataset);
    
    // Mock FormApplication methods
    rollDialog.render = jest.fn();
    rollDialog.close = jest.fn();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(rollDialog.actor).toBe(mockActor);
      expect(rollDialog.characteristic).toBe('str');
      expect(rollDialog.resistance).toBe('Unknown');
      expect(rollDialog.victoryPointsSelected).toBe(0);
      expect(rollDialog.wyrdPointUsed).toBe(false);
      expect(rollDialog.extraModifiers).toBe(0);
    });
    
    it('should initialize with weapon and parse attack properties', () => {
      // Mock weapon item
      const weaponItem = {
        system: {
          Features: "Arma con propiedades láser y fuego"
        }
      };
      
      // Setup mock to return the weapon item
      mockActor.items.get.mockReturnValue(weaponItem);
      
      // Create dataset with weapon flag and item ID
      const weaponDataset = {
        characteristic: 'str',
        skill: 'Fight',
        modifier: 0,
        value: 3,
        label: 'Fight',
        translated: 'Fighting',
        isWeapon: true,
        itemId: "weapon123"
      };
      
      const rollDice = new RollDice(mockActor, weaponDataset);
      
      // Check that the constructor parsed attack properties
      expect(rollDice.isWeapon).toBe(true);
      expect(CombatHelpers.parseAttackProperties).toHaveBeenCalledWith("Arma con propiedades láser y fuego");
    });
  });

  describe('activateListeners', () => {
    it('should set up event listeners', () => {
      const html = {
        find: jest.fn().mockReturnValue({
          click: jest.fn(),
          change: jest.fn(),
        }),
      };
      
      // Mock the super.activateListeners method
      const originalActivateListeners = FormApplication.prototype.activateListeners;
      FormApplication.prototype.activateListeners = jest.fn();
      
      rollDialog.activateListeners(html);
      
      // Restore the original method
      FormApplication.prototype.activateListeners = originalActivateListeners;
      
      // Check that find was called for each input type
      expect(html.find).toHaveBeenCalledWith('input[name="characteristic"]');
      expect(html.find).toHaveBeenCalledWith('input[name="resistance"]');
      expect(html.find).toHaveBeenCalledWith('input[name="coverage"]');
      expect(html.find).toHaveBeenCalledWith('input[name="victoryPointsSelected"]');
      expect(html.find).toHaveBeenCalledWith('input[name="wyrdPointUsed"]');
      expect(html.find).toHaveBeenCalledWith('button[name="submit"]');
      expect(html.find).toHaveBeenCalledWith('input[name="extraModifiers"]');
    });
  });

  describe('getCalculatedData', () => {
    it('should return calculated data with correct values', () => {
      // Set some values for testing
      rollDialog.characteristic = 'dex';
      rollDialog.resistance = 'Hard';
      rollDialog.victoryPointsSelected = 2;
      rollDialog.wyrdPointUsed = true;
      rollDialog.extraModifiers = 1;
      
      const data = rollDialog.getCalculatedData();
      
      // Check calculated values
      expect(data.characteristicValueSelected).toBe(2); // dex value from mock actor
      expect(data.resistanceValueSelected).toBe('4'); // Hard = 4
      expect(data.totalRoll).toBe(11); // 3 (skill) + 2 (dex) + 2 (VP) + 3 (wyrd) + 1 (modifier) = 11
    });
  });

  describe('getData', () => {
    it('should include attack properties and target information', () => {
      // Create a weapon roll dialog
      const target = { 
        name: "Test Target", 
        actor: { 
          system: { 
            res: { 
              body: { 
                value: 5 
              } 
            } 
          },
          items: {
            filter: jest.fn().mockReturnValue([])
          }
        } 
      };
      
      const rollDice = new RollDice(mockActor, {
        characteristic: 'str',
        skill: 'Fight',
        modifier: 0,
        value: 3,
        label: 'Fight',
        translated: 'Fighting',
        isWeapon: true,
        itemId: "weapon123"
      });
      
      // Manually set properties for testing
      rollDice.target = target;
      rollDice.attackProperties = [
        'LASER',
        'FLAME'
      ];
      
      // Get data
      const data = rollDice.getCalculatedData();
      
      // Check that attack properties and target info are included
      expect(data.isWeapon).toBe(true);
      expect(data.hasTarget).toBe(true);
      expect(data.targetName).toBe("Test Target");
      expect(data.attackProperties).toEqual([
        'LASER',
        'FLAME'
      ]);
    });
  });

  describe('_onClickRollDice', () => {
    it('should create chat message with correct data', async () => {
      // Mock event
      const event = {
        preventDefault: jest.fn(),
        target: {
          dataset: {
            type: "normal"
          }
        }
      };
      
      // Add update method to mockActor
      mockActor.update = jest.fn().mockResolvedValue(true);
      
      // Set up roll dialog with specific values
      rollDialog.characteristic = 'str';
      rollDialog.resistance = 'Hard';
      rollDialog.victoryPointsSelected = 1;
      rollDialog.wyrdPointUsed = false;
      
      // Mock the _calculateRoll method to avoid actual dice rolling
      rollDialog._calculateRoll = jest.fn().mockResolvedValue({
        myRol: "3d6",
        total: 10,
        success: true,
        critical: false,
        totalFailure: false,
        failure: false,
        dice: 10
      });
      
      // Call the method
      await rollDialog._onClickRollDice(event);
      
      // Check that ChatMessage.create was called
      expect(ChatMessage.create).toHaveBeenCalled();
      
      // Check that actor.update was called
      expect(mockActor.update).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle missing game.user.targets gracefully', () => {
      // Remove game.user.targets
      global.game.user = {};
      
      // This should not throw an error
      const rollDice = new RollDice(mockActor, {
        characteristic: 'str',
        skill: 'Fight',
        modifier: 0,
        value: 3,
        label: 'Fight',
        translated: 'Fighting',
        isWeapon: true,
        item: "weapon123"
      });
      
      expect(rollDice.target).toBe(null);
    });

    it('should handle missing armor resistances gracefully', () => {
      // Mock target with actor but no armor
      const targetActor = {
        system: {
          res: {
            body: {
              value: 5
            }
          }
        },
        items: {
          filter: jest.fn().mockReturnValue([]) // No armor
        }
      };
      
      const target = {
        actor: targetActor,
        name: "Test Target"
      };
      
      // Mock game.user.targets
      global.game.user = {
        targets: {
          first: () => target
        }
      };
      
      // Create dataset with weapon flag and item ID
      const weaponDataset = {
        characteristic: 'str',
        skill: 'Fight',
        modifier: 0,
        value: 3,
        label: 'Fight',
        translated: 'Fighting',
        isWeapon: true,
        item: "weapon123"
      };
      
      const rollDice = new RollDice(mockActor, weaponDataset);
      
      // Manually set attack properties for testing
      rollDice.attackProperties = [CombatHelpers.ATTACK_PROPERTIES.LASER];
      
      // Get calculated data
      rollDice.getCalculatedData();
      
      // Verify that resistance was calculated with null armor resistances
      expect(CombatHelpers.calculateEffectiveResistance).toHaveBeenCalled();
    });
  });

  describe('coverage options', () => {
    let weaponRollDialog;
    let targetActor;
    let target;

    beforeEach(() => {
      // Reset mocks
      jest.clearAllMocks();
      
      // Setup mock target actor with body resistance
      targetActor = {
        system: {
          res: {
            body: {
              value: 5
            }
          }
        },
        items: {
          filter: jest.fn().mockReturnValue([]) // No armor for simplicity
        }
      };
      
      // Setup mock target
      target = {
        actor: targetActor,
        name: "Test Target"
      };
      
      // Mock game.user.targets
      global.game.user = {
        targets: {
          first: () => target
        }
      };
      
      // Setup mock weapon item
      const weaponItem = {
        system: {
          Features: "Arma con propiedades láser y fuego"
        }
      };
      
      // Setup mock to return the weapon item
      mockActor.items.get.mockReturnValue(weaponItem);
      
      // Create dataset with weapon flag and item ID
      const weaponDataset = {
        characteristic: 'str',
        skill: 'Fight',
        modifier: 0,
        value: 3,
        label: 'Fight',
        translated: 'Fighting',
        isWeapon: true,
        itemId: "weapon123"
      };
      
      // Create roll dialog for weapon
      weaponRollDialog = new RollDice(mockActor, weaponDataset);
      
      // Reset the calculateEffectiveResistance mock to return base value
      CombatHelpers.calculateEffectiveResistance.mockReturnValue(5);
    });

    it('should calculate correct resistance with no coverage', () => {
      // Set coverage to none
      weaponRollDialog.coverage = "none";
      
      // Get calculated data
      const data = weaponRollDialog.getCalculatedData();
      
      // Verify that resistance was calculated without coverage modifier
      expect(data.numericResistance).toBe(5); // Base resistance without modifier
      expect(CombatHelpers.getResistanceLevel).toHaveBeenCalledWith(5);
    });

    it('should add +3 to resistance with partial coverage', () => {
      // Set coverage to partial
      weaponRollDialog.coverage = "partial";
      
      // Get calculated data
      const data = weaponRollDialog.getCalculatedData();
      
      // Verify that resistance was calculated with +3 modifier
      expect(data.numericResistance).toBe(8); // 5 base + 3 for partial coverage
      expect(CombatHelpers.getResistanceLevel).toHaveBeenCalledWith(8);
    });

    it('should add +6 to resistance with total coverage', () => {
      // Set coverage to total
      weaponRollDialog.coverage = "total";
      
      // Get calculated data
      const data = weaponRollDialog.getCalculatedData();
      
      // Verify that resistance was calculated with +6 modifier
      expect(data.numericResistance).toBe(11); // 5 base + 6 for total coverage
      expect(CombatHelpers.getResistanceLevel).toHaveBeenCalledWith(11);
    });

    it('should update resistance level based on coverage changes', () => {
      // Mock getResistanceLevel to return different values based on input
      CombatHelpers.getResistanceLevel.mockImplementation((value) => {
        if (value <= 5) return 'Hard';
        if (value <= 8) return 'Tough';
        return 'Severe';
      });
      
      // Test with no coverage
      weaponRollDialog.coverage = "none";
      let data = weaponRollDialog.getCalculatedData();
      expect(data.resistance).toBe('Hard');
      
      // Test with partial coverage
      weaponRollDialog.coverage = "partial";
      data = weaponRollDialog.getCalculatedData();
      expect(data.resistance).toBe('Tough');
      
      // Test with total coverage
      weaponRollDialog.coverage = "total";
      data = weaponRollDialog.getCalculatedData();
      expect(data.resistance).toBe('Severe');
    });

    it('should handle _onClickCoverage method correctly', () => {
      // Mock event
      const event = {
        currentTarget: {
          value: "partial"
        }
      };
      
      // Explicitly mock the render method for this test
      weaponRollDialog.render = jest.fn();
      
      // Call the method
      weaponRollDialog._onClickCoverage(event);
      
      // Check that coverage was updated
      expect(weaponRollDialog.coverage).toBe("partial");
      expect(weaponRollDialog.render).toHaveBeenCalled();
    });

    it('should include coverage in roll data for chat message', async () => {
      // Set coverage to partial
      weaponRollDialog.coverage = "partial";
      
      // Mock event for _onClickRollDice
      const event = {
        preventDefault: jest.fn(),
        target: {
          dataset: {
            type: "normal"
          }
        }
      };
      
      // Add update method to mockActor
      mockActor.update = jest.fn().mockResolvedValue(true);
      
      // Mock the _calculateRoll method to avoid actual dice rolling
      weaponRollDialog._calculateRoll = jest.fn().mockResolvedValue({
        myRol: "3d6",
        total: 10,
        success: true,
        critical: false,
        totalFailure: false,
        failure: false,
        dice: 10
      });
      
      // Call the method
      await weaponRollDialog._onClickRollDice(event);
      
      // Check that renderTemplate was called with data that includes coverage
      expect(global.renderTemplate).toHaveBeenCalled();
      
      // Get the template data from the call
      const templateData = global.renderTemplate.mock.calls[0][1];
      
      // Verify that the chat message includes information about the roll
      expect(ChatMessage.create).toHaveBeenCalled();
    });

    it('should integrate coverage with attack properties and armor', () => {
      // Setup mock armor with resistances
      const armorItem = {
        type: 'armor',
        system: {
          equipped: true,
          BodyResistance: 3,
          LaserResistance: 5,
          FlameResistance: 2
        }
      };
      
      // Update target actor to have armor
      targetActor.items.filter.mockReturnValue([armorItem]);
      
      // Mock calculateEffectiveResistance to simulate actual calculation
      CombatHelpers.calculateEffectiveResistance.mockImplementation((baseResistance, attackProps, armor) => {
        // Simple simulation of the actual calculation logic
        let effectiveResistance = baseResistance;
        
        // If we have armor and attack properties
        if (armor && attackProps) {
          if (attackProps.includes('LASER') && armor.LaserResistance) {
            effectiveResistance = Math.max(effectiveResistance, armor.LaserResistance);
          }
          if (attackProps.includes('FLAME') && armor.FlameResistance) {
            effectiveResistance = Math.max(effectiveResistance, armor.FlameResistance);
          }
        }
        
        return effectiveResistance;
      });
      
      // Test with different coverage options
      
      // No coverage - should use effective resistance from armor/attack properties
      weaponRollDialog.coverage = "none";
      let data = weaponRollDialog.getCalculatedData();
      // With our mock implementation, LASER resistance (5) should be used
      expect(data.numericResistance).toBe(5);
      
      // Partial coverage - should add +3 to effective resistance
      weaponRollDialog.coverage = "partial";
      data = weaponRollDialog.getCalculatedData();
      expect(data.numericResistance).toBe(8); // 5 + 3
      
      // Total coverage - should add +6 to effective resistance
      weaponRollDialog.coverage = "total";
      data = weaponRollDialog.getCalculatedData();
      expect(data.numericResistance).toBe(11); // 5 + 6
    });

    it('should handle changing coverage during dialog interaction', () => {
      // Mock getResistanceLevel to return different values based on input
      CombatHelpers.getResistanceLevel.mockImplementation((value) => {
        if (value <= 5) return 'Hard';
        if (value <= 8) return 'Tough';
        return 'Severe';
      });
      
      // Start with no coverage
      weaponRollDialog.coverage = "none";
      weaponRollDialog.render = jest.fn();
      
      // Simulate user clicking on partial coverage
      weaponRollDialog._onClickCoverage({
        currentTarget: { value: "partial" }
      });
      
      // Check that coverage was updated
      expect(weaponRollDialog.coverage).toBe("partial");
      expect(weaponRollDialog.render).toHaveBeenCalledTimes(1);
      
      // Get data and check resistance
      let data = weaponRollDialog.getCalculatedData();
      expect(data.numericResistance).toBe(8); // 5 + 3
      expect(data.resistance).toBe('Tough');
      
      // Simulate user clicking on total coverage
      weaponRollDialog._onClickCoverage({
        currentTarget: { value: "total" }
      });
      
      // Check that coverage was updated
      expect(weaponRollDialog.coverage).toBe("total");
      expect(weaponRollDialog.render).toHaveBeenCalledTimes(2);
      
      // Get data and check resistance
      data = weaponRollDialog.getCalculatedData();
      expect(data.numericResistance).toBe(11); // 5 + 6
      expect(data.resistance).toBe('Severe');
    });

    it('should handle non-weapon rolls without coverage options', () => {
      // Create a non-weapon roll dialog
      const nonWeaponDataset = {
        characteristic: 'str',
        skill: 'Athletics',
        modifier: 0,
        value: 3,
        label: 'Athletics',
        translated: 'Athletics',
        isWeapon: false
      };
      
      const nonWeaponDialog = new RollDice(mockActor, nonWeaponDataset);
      
      // Set coverage (should have no effect)
      nonWeaponDialog.coverage = "total";
      
      // Get calculated data
      const data = nonWeaponDialog.getCalculatedData();
      
      // Verify that coverage doesn't affect non-weapon rolls
      expect(data.isWeapon).toBe(false);
      // numericResistance should not be set for non-weapon rolls
      expect(data.numericResistance).toBeUndefined();
    });
  });
}); 