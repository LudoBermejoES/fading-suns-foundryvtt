import { 
  calculateRoll, 
  calculateExtraVPCost, 
  calculateTargetResistance 
} from '../../module/helpers/rollCalculation.mjs';

// Mock dependencies
jest.mock('../../module/helpers/rollEffects.mjs', () => ({
  getEffectModifiers: jest.fn((actor, rollData) => ({
    modifier: 1,
    extraVPCost: 2,
    perceptionModifier: 1,
    physicalModifier: 1,
    mentalModifier: 1,
    socialModifier: 1,
    cannotAct: false,
    autoFail: false,
    rollAdvantage: false,
    rollDisadvantage: false
  })),
  applyEffectModifiersToRoll: jest.fn((rollData, effectModifiers) => ({
    ...rollData,
    modifier: (rollData.modifier || 0) + effectModifiers.modifier,
    cannotAct: effectModifiers.cannotAct,
    autoFail: effectModifiers.autoFail,
    rollType: effectModifiers.rollAdvantage ? 'advantage' : 
              effectModifiers.rollDisadvantage ? 'disadvantage' : 'normal',
    extraVPCost: effectModifiers.extraVPCost
  })),
  applyEffectModifiersToResistance: jest.fn((resistance, attackProperties, effectModifiers) => {
    return 1; // Return 1 for testing simplicity
  })
}));

jest.mock('../../module/helpers/combat.mjs', () => ({
  calculateEffectiveResistance: jest.fn((baseResistance, attackProperties, armorResistances) => {
    return baseResistance; // Return unmodified for testing
  })
}));

describe('Roll Calculation Helper Functions', () => {
  let mockActor;
  
  beforeEach(() => {
    // Create mock actor for testing
    mockActor = {
      system: {
        characteristics: {
          str: { value: 3 },
          dex: { value: 4 },
          end: { value: 3 },
          int: { value: 5 },
          wits: { value: 4 },
          per: { value: 3 },
          tec: { value: 2 },
          pre: { value: 4 },
          pas: { value: 3 },
          fth: { value: 2 },
          ego: { value: 3 }
        },
        skills: {
          Fight: { value: 3 },
          Shoot: { value: 2 },
          Athletics: { value: 4 }
        },
        resistances: {
          corporal: { value: 5 },
          mental: { value: 4 },
          social: { value: 3 }
        }
      },
      items: {
        filter: jest.fn(() => [])
      },
      allApplicableEffects: jest.fn(() => [])
    };
  });
  
  describe('calculateRoll', () => {
    it('should calculate roll correctly with all modifiers', () => {
      // Prepare roll data
      const rollData = {
        characteristic: 'str',
        skill: 'Fight',
        victoryPointsSelected: 2,
        extraModifiers: 1
      };
      
      // Calculate the roll
      const result = calculateRoll(rollData, mockActor);
      
      // Verify the calculation
      expect(result).toHaveProperty('total');
      expect(result.characteristicValue).toBe(3); // str value from mock
      expect(result.skillValue).toBe(3); // Fight value from mock
      expect(result.victoryPoints).toBe(2); // From rollData
      expect(result.extraModifiers).toBe(1); // From effect modifier
      
      // Total should be str(3) + Fight(3) + VP(2) + extraModifiers(1)
      expect(result.total).toBe(9);
    });
    
    it('should handle missing skill correctly', () => {
      // Prepare roll data without a skill
      const rollData = {
        characteristic: 'dex',
        victoryPointsSelected: 1
      };
      
      // Calculate the roll
      const result = calculateRoll(rollData, mockActor);
      
      // Verify the calculation
      expect(result.characteristicValue).toBe(4); // dex value from mock
      expect(result.skillValue).toBe(0); // No skill specified
      expect(result.victoryPoints).toBe(1); // From rollData
      
      // Total should be dex(4) + skill(0) + VP(1) + extraModifiers(1)
      expect(result.total).toBe(6);
    });
    
    it('should handle cannotAct effect', () => {
      // Override the mock for this test
      require('../../module/helpers/rollEffects.mjs').applyEffectModifiersToRoll.mockImplementationOnce(
        (rollData, effectModifiers) => ({
          ...rollData,
          cannotAct: true
        })
      );
      
      // Prepare roll data
      const rollData = {
        characteristic: 'str',
        skill: 'Fight'
      };
      
      // Calculate the roll
      const result = calculateRoll(rollData, mockActor);
      
      // Verify that cannotAct leads to a failed roll
      expect(result.total).toBe(0);
      expect(result.success).toBe(false);
      expect(result.failure).toBe(true);
      expect(result.totalFailure).toBe(true);
      expect(result.message).toBeDefined();
    });
    
    it('should handle autoFail effect', () => {
      // Override the mock for this test
      require('../../module/helpers/rollEffects.mjs').applyEffectModifiersToRoll.mockImplementationOnce(
        (rollData, effectModifiers) => ({
          ...rollData,
          autoFail: true
        })
      );
      
      // Prepare roll data
      const rollData = {
        characteristic: 'str',
        skill: 'Fight'
      };
      
      // Calculate the roll
      const result = calculateRoll(rollData, mockActor);
      
      // Verify that autoFail leads to a failed roll
      expect(result.total).toBe(0);
      expect(result.success).toBe(false);
      expect(result.failure).toBe(true);
      expect(result.totalFailure).toBe(true);
      expect(result.message).toBeDefined();
    });
  });
  
  describe('calculateExtraVPCost', () => {
    it('should return the extra VP cost from effect modifiers', () => {
      // Prepare roll data
      const rollData = {
        characteristic: 'str',
        skill: 'Fight'
      };
      
      // Calculate extra VP cost
      const extraVPCost = calculateExtraVPCost(rollData, mockActor);
      
      // Verify that it returns the extraVPCost from the effect modifiers
      expect(extraVPCost).toBe(2); // From the mock
    });
    
    it('should return 0 if no extra VP cost in effect modifiers', () => {
      // Override the mock for this test
      require('../../module/helpers/rollEffects.mjs').getEffectModifiers.mockImplementationOnce(
        () => ({
          modifier: 1,
          // No extraVPCost property
        })
      );
      
      // Prepare roll data
      const rollData = {
        characteristic: 'str',
        skill: 'Fight'
      };
      
      // Calculate extra VP cost
      const extraVPCost = calculateExtraVPCost(rollData, mockActor);
      
      // Verify that it returns 0 when extraVPCost is not in effect modifiers
      expect(extraVPCost).toBe(0);
    });
  });
  
  describe('calculateTargetResistance', () => {
    it('should calculate target resistance correctly', () => {
      // Create target actor
      const target = {
        system: {
          resistances: {
            corporal: { value: 5 }
          }
        },
        items: {
          filter: jest.fn(() => [])
        }
      };
      
      // Prepare attack data
      const attackData = {
        attackProperties: ['piercing']
      };
      
      // Calculate target resistance
      const resistance = calculateTargetResistance(target, attackData, mockActor);
      
      // Our mock returns 1 for applyEffectModifiersToResistance
      expect(resistance).toBe(1);
    });
    
    it('should return 0 for missing target', () => {
      // Calculate with null target
      const resistance = calculateTargetResistance(null, {}, mockActor);
      
      // Verify that it returns 0
      expect(resistance).toBe(0);
    });
    
    it('should handle armor resistances', () => {
      // Create target actor with armor
      const target = {
        system: {
          resistances: {
            corporal: { value: 5 }
          }
        },
        items: {
          filter: jest.fn(() => [
            {
              type: 'armor',
              system: {
                equipped: true,
                resistances: {
                  physical: 2,
                  energy: 1
                }
              }
            }
          ])
        }
      };
      
      // Prepare attack data
      const attackData = {
        attackProperties: []
      };
      
      // Calculate target resistance
      const resistance = calculateTargetResistance(target, attackData, mockActor);
      
      // Our mock returns 1 for applyEffectModifiersToResistance
      expect(resistance).toBe(1);
    });
  });
}); 