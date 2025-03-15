import '../setup/setup-foundry.js';
import effectsList, { EFFECT_TYPES } from '../../module/activeeffects/activeEffects.js';
import { getEffectsByType, getEffectByTitle, getPhysicalEffects, getMentalEffects, getSocialEffects } from '../../module/helpers/effects.mjs';

describe('Active Effects', () => {
  it('should export an array of effects', () => {
    expect(Array.isArray(effectsList)).toBe(true);
    expect(effectsList.length).toBeGreaterThan(0);
  });
  
  it('should have effects with required properties', () => {
    effectsList.forEach(effect => {
      expect(effect).toHaveProperty('icon');
      expect(effect).toHaveProperty('type');
      expect(effect).toHaveProperty('title');
      expect(effect).toHaveProperty('description');
      
      expect(typeof effect.icon).toBe('string');
      expect(typeof effect.type).toBe('string');
      expect(typeof effect.title).toBe('string');
      expect(typeof effect.description).toBe('string');
    });
  });
  
  it('should have valid effect types', () => {
    const validTypes = [EFFECT_TYPES.PHYSICAL, EFFECT_TYPES.MENTAL, EFFECT_TYPES.SOCIAL];
    
    effectsList.forEach(effect => {
      expect(validTypes).toContain(effect.type);
    });
  });
  
  it('should have unique titles with known exceptions', () => {
    // We know that "PENALIZADO" appears in both physical and mental types
    const expectedDuplicates = ['PENALIZADO'];
    
    // Get all titles
    const titles = effectsList.map(effect => effect.title);
    
    // Find titles that appear more than once
    const counts = {};
    titles.forEach(title => {
      counts[title] = (counts[title] || 0) + 1;
    });
    
    // Get titles that appear more than once
    const actualDuplicates = Object.entries(counts)
      .filter(([_, count]) => count > 1)
      .map(([title, _]) => title)
      .sort();
    
    // Check that the only duplicates are the expected ones
    expect(actualDuplicates).toEqual(expectedDuplicates.sort());
  });
  
  it('should have non-empty descriptions', () => {
    effectsList.forEach(effect => {
      expect(effect.description.length).toBeGreaterThan(0);
    });
  });
  
  it('should have valid icon names', () => {
    effectsList.forEach(effect => {
      // Check that icon is a valid FontAwesome icon name or similar
      expect(effect.icon).toMatch(/^[a-z0-9\-]+$/);
    });
  });
  
  describe('Physical Effects', () => {
    it('should have physical effects', () => {
      const physicalEffects = effectsList.filter(effect => effect.type === EFFECT_TYPES.PHYSICAL);
      expect(physicalEffects.length).toBeGreaterThan(0);
    });
    
    it('should include common physical conditions', () => {
      const physicalTitles = effectsList
        .filter(effect => effect.type === EFFECT_TYPES.PHYSICAL)
        .map(effect => effect.title);
      
      expect(physicalTitles).toContain('ATONTADO');
      expect(physicalTitles).toContain('CEGADO');
      expect(physicalTitles).toContain('TUMBADO');
    });
  });
  
  describe('Mental Effects', () => {
    it('should have mental effects', () => {
      const mentalEffects = effectsList.filter(effect => effect.type === EFFECT_TYPES.MENTAL);
      expect(mentalEffects.length).toBeGreaterThan(0);
    });
    
    it('should include common mental conditions', () => {
      const mentalTitles = effectsList
        .filter(effect => effect.type === EFFECT_TYPES.MENTAL)
        .map(effect => effect.title);
      
      expect(mentalTitles).toContain('ASUSTADO');
      expect(mentalTitles).toContain('CONFUSO');
      expect(mentalTitles).toContain('ENFADADO');
    });
  });
  
  describe('Social Effects', () => {
    it('should have social effects', () => {
      const socialEffects = effectsList.filter(effect => effect.type === EFFECT_TYPES.SOCIAL);
      expect(socialEffects.length).toBeGreaterThan(0);
    });
    
    it('should include common social conditions', () => {
      const socialTitles = effectsList
        .filter(effect => effect.type === EFFECT_TYPES.SOCIAL)
        .map(effect => effect.title);
      
      expect(socialTitles).toContain('AMIGADO');
    });
  });
  
  describe('Effect Utility Functions', () => {
    it('should export utility functions for working with effects', () => {
      // Check that the functions exist
      expect(typeof getEffectsByType).toBe('function');
      expect(typeof getEffectByTitle).toBe('function');
      expect(typeof getPhysicalEffects).toBe('function');
      expect(typeof getMentalEffects).toBe('function');
      expect(typeof getSocialEffects).toBe('function');
      
      // Check that the functions return the expected results
      expect(getEffectsByType(EFFECT_TYPES.PHYSICAL).length).toBeGreaterThan(0);
      expect(getEffectByTitle('ATONTADO')).toBeDefined();
      expect(getPhysicalEffects().length).toBeGreaterThan(0);
      expect(getMentalEffects().length).toBeGreaterThan(0);
      expect(getSocialEffects().length).toBeGreaterThan(0);
    });
  });
}); 