/**
 * @jest-environment jsdom
 */

import { 
  ATTACK_PROPERTIES, 
  ATTACK_PROPERTY_MAP, 
  ARMOR_RESISTANCE_MAP, 
  parseAttackProperties, 
  calculateEffectiveResistance, 
  getResistanceLevel 
} from "../../module/helpers/combat.mjs";

describe('Combat Helper Functions', () => {
  describe('parseAttackProperties', () => {
    test('returns empty array for null or empty input', () => {
      expect(parseAttackProperties(null)).toEqual([]);
      expect(parseAttackProperties('')).toEqual([]);
      expect(parseAttackProperties(undefined)).toEqual([]);
    });

    test('correctly identifies Spanish property names', () => {
      expect(parseAttackProperties('Arma con propiedad bláster')).toContain(ATTACK_PROPERTIES.BLASTER);
      expect(parseAttackProperties('Arma con propiedad descarga')).toContain(ATTACK_PROPERTIES.SHOCK);
      expect(parseAttackProperties('Arma con propiedad golpe')).toContain(ATTACK_PROPERTIES.SLAM);
      expect(parseAttackProperties('Arma con propiedad endurecida')).toContain(ATTACK_PROPERTIES.HARD);
      expect(parseAttackProperties('Arma con propiedad fuego')).toContain(ATTACK_PROPERTIES.FLAME);
      expect(parseAttackProperties('Arma con propiedad láser')).toContain(ATTACK_PROPERTIES.LASER);
      expect(parseAttackProperties('Arma con propiedad sónica')).toContain(ATTACK_PROPERTIES.SONIC);
      expect(parseAttackProperties('Arma con propiedad superendurecida')).toContain(ATTACK_PROPERTIES.ULTRA_HARD);
    });

    test('correctly identifies English property names', () => {
      expect(parseAttackProperties('Weapon with blaster property')).toContain(ATTACK_PROPERTIES.BLASTER);
      expect(parseAttackProperties('Weapon with shock property')).toContain(ATTACK_PROPERTIES.SHOCK);
      expect(parseAttackProperties('Weapon with slam property')).toContain(ATTACK_PROPERTIES.SLAM);
      expect(parseAttackProperties('Weapon with hard property')).toContain(ATTACK_PROPERTIES.HARD);
      expect(parseAttackProperties('Weapon with flame property')).toContain(ATTACK_PROPERTIES.FLAME);
      expect(parseAttackProperties('Weapon with laser property')).toContain(ATTACK_PROPERTIES.LASER);
      expect(parseAttackProperties('Weapon with sonic property')).toContain(ATTACK_PROPERTIES.SONIC);
      expect(parseAttackProperties('Weapon with ultrahard property')).toContain(ATTACK_PROPERTIES.ULTRA_HARD);
    });

    test('identifies multiple properties in a single string', () => {
      const result = parseAttackProperties('Arma con propiedades láser y fuego');
      expect(result).toContain(ATTACK_PROPERTIES.LASER);
      expect(result).toContain(ATTACK_PROPERTIES.FLAME);
      expect(result.length).toBe(2);
    });

    test('does not duplicate properties', () => {
      const result = parseAttackProperties('Arma láser con propiedad láser');
      expect(result).toContain(ATTACK_PROPERTIES.LASER);
      expect(result.length).toBe(1);
    });

    test('ignores unrecognized properties', () => {
      const result = parseAttackProperties('Arma con propiedad desconocida');
      expect(result).toEqual([]);
    });
  });

  describe('calculateEffectiveResistance', () => {
    test('returns base resistance when no attack properties are provided', () => {
      expect(calculateEffectiveResistance(5, [], null)).toBe(5);
      expect(calculateEffectiveResistance(5, null, null)).toBe(5);
    });

    test('uses specific armor resistance when higher than base resistance', () => {
      const armorResistances = {
        LaserResistance: 8
      };
      expect(calculateEffectiveResistance(5, [ATTACK_PROPERTIES.LASER], armorResistances)).toBe(8);
    });

    test('keeps base resistance when specific armor resistance is lower', () => {
      const armorResistances = {
        LaserResistance: 3
      };
      expect(calculateEffectiveResistance(5, [ATTACK_PROPERTIES.LASER], armorResistances)).toBe(5);
    });

    test('reduces resistance by half when no specific protection exists', () => {
      const armorResistances = {
        LaserResistance: 8
      };
      expect(calculateEffectiveResistance(5, [ATTACK_PROPERTIES.FLAME], armorResistances)).toBe(2);
    });

    test('handles sonic attacks correctly (ignores armor without sonic resistance)', () => {
      const armorResistances = {
        LaserResistance: 8,
        FlameResistance: 6
      };
      expect(calculateEffectiveResistance(5, [ATTACK_PROPERTIES.SONIC], armorResistances)).toBe(0);
      
      const armorWithSonicResistance = {
        LaserResistance: 8,
        SonicResistance: 4
      };
      expect(calculateEffectiveResistance(5, [ATTACK_PROPERTIES.SONIC], armorWithSonicResistance)).toBe(5);
    });

    test('handles multiple attack properties correctly', () => {
      const armorResistances = {
        LaserResistance: 8,
        FlameResistance: 6
      };
      
      // Should use the highest applicable resistance (LaserResistance: 8)
      expect(calculateEffectiveResistance(5, [ATTACK_PROPERTIES.LASER, ATTACK_PROPERTIES.FLAME], armorResistances)).toBe(8);
      
      // Should use the highest applicable resistance (FlameResistance: 6)
      expect(calculateEffectiveResistance(5, [ATTACK_PROPERTIES.FLAME, ATTACK_PROPERTIES.SLAM], armorResistances)).toBe(6);
      
      // Should reduce by half since no protection against SHOCK or SLAM
      expect(calculateEffectiveResistance(5, [ATTACK_PROPERTIES.SHOCK, ATTACK_PROPERTIES.SLAM], armorResistances)).toBe(2);
      
      // Sonic should override everything if no sonic resistance
      expect(calculateEffectiveResistance(5, [ATTACK_PROPERTIES.LASER, ATTACK_PROPERTIES.SONIC], armorResistances)).toBe(0);
    });
  });

  describe('getResistanceLevel', () => {
    test('returns correct resistance levels for different values', () => {
      expect(getResistanceLevel(0)).toBe('Effortless');
      expect(getResistanceLevel(-1)).toBe('Effortless');
      expect(getResistanceLevel(1)).toBe('Easy');
      expect(getResistanceLevel(2)).toBe('Easy');
      expect(getResistanceLevel(3)).toBe('Hard');
      expect(getResistanceLevel(4)).toBe('Hard');
      expect(getResistanceLevel(5)).toBe('Demanding');
      expect(getResistanceLevel(6)).toBe('Demanding');
      expect(getResistanceLevel(7)).toBe('Tough');
      expect(getResistanceLevel(8)).toBe('Tough');
      expect(getResistanceLevel(9)).toBe('Severe');
      expect(getResistanceLevel(10)).toBe('Severe');
      expect(getResistanceLevel(11)).toBe('Herculean');
      expect(getResistanceLevel(12)).toBe('Herculean');
      expect(getResistanceLevel(13)).toBe('Miraculous');
      expect(getResistanceLevel(20)).toBe('Miraculous');
    });
  });
}); 