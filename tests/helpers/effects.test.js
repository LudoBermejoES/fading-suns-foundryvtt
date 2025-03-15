import { prepareActiveEffectCategories, createEffectCategories, EFFECT_CATEGORIES, getEffectsByType, getPhysicalEffects, getMentalEffects, getSocialEffects } from '../../module/helpers/effects.mjs';
import activeEffects, { EFFECT_TYPES } from '../../module/activeeffects/activeEffects.js';

describe('Effects Helper Functions', () => {
  describe('Effect Categories', () => {
    let mockEffects;

    beforeEach(() => {
      mockEffects = [
        {
          label: 'Test Effect 1',
          icon: 'icons/test1.png',
          disabled: false,
          isTemporary: true,
          changes: [
            { key: 'system.characteristics.str.value', value: 2, mode: 2 },
          ],
          sort: 100,
        },
        {
          label: 'Test Effect 2',
          icon: 'icons/test2.png',
          disabled: true,
          isTemporary: false,
          changes: [
            { key: 'system.skills.Fight.value', value: 1, mode: 2 },
          ],
          sort: 200,
        },
      ];
    });

    it('should categorize effects correctly using createEffectCategories', () => {
      const categories = createEffectCategories(mockEffects);
      
      expect(categories).toBeDefined();
      expect(categories).toHaveProperty(EFFECT_CATEGORIES.TEMPORARY);
      expect(categories).toHaveProperty(EFFECT_CATEGORIES.PASSIVE);
      expect(categories).toHaveProperty(EFFECT_CATEGORIES.INACTIVE);
      
      // Check if effects are properly categorized
      expect(categories[EFFECT_CATEGORIES.TEMPORARY].effects).toHaveLength(1);
      expect(categories[EFFECT_CATEGORIES.INACTIVE].effects).toHaveLength(1);
    });

    it('should maintain backward compatibility with prepareActiveEffectCategories', () => {
      const categories = prepareActiveEffectCategories(mockEffects);
      
      expect(categories).toBeDefined();
      expect(categories).toHaveProperty(EFFECT_CATEGORIES.TEMPORARY);
      expect(categories).toHaveProperty(EFFECT_CATEGORIES.PASSIVE);
      expect(categories).toHaveProperty(EFFECT_CATEGORIES.INACTIVE);
      
      // Check if effects are properly categorized
      expect(categories[EFFECT_CATEGORIES.TEMPORARY].effects).toHaveLength(1);
      expect(categories[EFFECT_CATEGORIES.INACTIVE].effects).toHaveLength(1);
    });

    it('should handle empty effects array', () => {
      const categories = createEffectCategories([]);
      
      expect(categories).toBeDefined();
      expect(categories[EFFECT_CATEGORIES.TEMPORARY].effects).toHaveLength(0);
      expect(categories[EFFECT_CATEGORIES.PASSIVE].effects).toHaveLength(0);
      expect(categories[EFFECT_CATEGORIES.INACTIVE].effects).toHaveLength(0);
    });

    it('should mark disabled effects', () => {
      const categories = createEffectCategories(mockEffects);
      
      const disabledEffect = categories[EFFECT_CATEGORIES.INACTIVE].effects[0];
      expect(disabledEffect.disabled).toBe(true);
    });

    it('should preserve effect data', () => {
      const categories = createEffectCategories(mockEffects);
      
      const effect = categories[EFFECT_CATEGORIES.TEMPORARY].effects[0];
      expect(effect.label).toBe('Test Effect 1');
      expect(effect.icon).toBe('icons/test1.png');
      expect(effect.changes).toHaveLength(1);
      expect(effect.changes[0].key).toBe('system.characteristics.str.value');
    });

    it('should handle effects without changes', () => {
      mockEffects.push({
        label: 'No Changes Effect',
        icon: 'icons/test3.png',
        disabled: false,
        isTemporary: true,
      });

      const categories = createEffectCategories(mockEffects);
      const effect = categories[EFFECT_CATEGORIES.TEMPORARY].effects.find(e => e.label === 'No Changes Effect');
      
      expect(effect).toBeDefined();
      expect(effect.changes).toBeUndefined();
    });

    it('should handle effects with invalid changes', () => {
      mockEffects.push({
        label: 'Invalid Changes Effect',
        icon: 'icons/test4.png',
        disabled: false,
        isTemporary: true,
        changes: null,
      });

      const categories = createEffectCategories(mockEffects);
      const effect = categories[EFFECT_CATEGORIES.TEMPORARY].effects.find(e => e.label === 'Invalid Changes Effect');
      
      expect(effect).toBeDefined();
      expect(effect.changes).toBeNull();
    });

    it('should handle effects with multiple changes', () => {
      mockEffects = [{
        label: 'Multiple Changes Effect',
        icon: 'icons/test5.png',
        disabled: false,
        isTemporary: true,
        changes: [
          { key: 'system.characteristics.str.value', value: 2, mode: 2 },
          { key: 'system.characteristics.dex.value', value: 1, mode: 2 },
          { key: 'system.skills.Fight.value', value: 1, mode: 2 },
        ],
      }];

      const categories = createEffectCategories(mockEffects);
      const effect = categories[EFFECT_CATEGORIES.TEMPORARY].effects[0];
      
      expect(effect.changes).toHaveLength(3);
      expect(effect.changes.map(c => c.key)).toContain('system.characteristics.str.value');
      expect(effect.changes.map(c => c.key)).toContain('system.characteristics.dex.value');
      expect(effect.changes.map(c => c.key)).toContain('system.skills.Fight.value');
    });

    it('should sort effects by sort property', () => {
      mockEffects = [
        { label: 'C', sort: 300, disabled: false, isTemporary: true },
        { label: 'A', sort: 100, disabled: false, isTemporary: true },
        { label: 'B', sort: 200, disabled: false, isTemporary: true },
      ];

      const categories = createEffectCategories(mockEffects);
      const sortedLabels = categories[EFFECT_CATEGORIES.TEMPORARY].effects.map(e => e.label);
      expect(sortedLabels).toEqual(['A', 'B', 'C']);
    });

    it('should handle effects without sort property', () => {
      mockEffects = [
        { label: 'C', disabled: false, isTemporary: true },
        { label: 'A', disabled: false, isTemporary: true },
        { label: 'B', disabled: false, isTemporary: true },
      ];

      const categories = createEffectCategories(mockEffects);
      const effects = categories[EFFECT_CATEGORIES.TEMPORARY].effects;
      expect(effects.map(e => e.label)).toEqual(['C', 'A', 'B']); // Original order preserved
    });

    it('should handle mixed sort values', () => {
      mockEffects = [
        { label: 'C', sort: null, disabled: false, isTemporary: true },
        { label: 'A', sort: 100, disabled: false, isTemporary: true },
        { label: 'B', sort: undefined, disabled: false, isTemporary: true },
      ];

      const categories = createEffectCategories(mockEffects);
      const effects = categories[EFFECT_CATEGORIES.TEMPORARY].effects;
      expect(effects[0].label).toBe('C'); // Original order preserved for unsorted effects
    });
  });

  describe('Predefined Active Effects', () => {
    it('should have valid structure for all effects', () => {
      expect(activeEffects).toBeDefined();
      expect(Array.isArray(activeEffects)).toBe(true);
      
      activeEffects.forEach(effect => {
        expect(effect).toHaveProperty('icon');
        expect(effect).toHaveProperty('type');
        expect(effect).toHaveProperty('title');
        expect(effect).toHaveProperty('description');
      });
    });

    it('should have valid effect types', () => {
      const validTypes = [EFFECT_TYPES.PHYSICAL, EFFECT_TYPES.MENTAL, EFFECT_TYPES.SOCIAL];
      activeEffects.forEach(effect => {
        expect(validTypes).toContain(effect.type);
      });
    });

    it('should have valid icons', () => {
      activeEffects.forEach(effect => {
        expect(typeof effect.icon).toBe('string');
        expect(effect.icon.length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty descriptions', () => {
      activeEffects.forEach(effect => {
        expect(typeof effect.description).toBe('string');
        expect(effect.description.length).toBeGreaterThan(0);
      });
    });

    it('should have unique titles with known exceptions', () => {
      const titles = activeEffects.map(effect => effect.title);
      const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
      expect(duplicates.sort()).toEqual(['PENALIZADO'].sort()); // This effect appears in multiple types
    });

    it('should group effects by type', () => {
      const effectsByType = activeEffects.reduce((acc, effect) => {
        acc[effect.type] = acc[effect.type] || [];
        acc[effect.type].push(effect);
        return acc;
      }, {});

      expect(effectsByType).toHaveProperty(EFFECT_TYPES.PHYSICAL);
      expect(effectsByType).toHaveProperty(EFFECT_TYPES.MENTAL);
      expect(effectsByType).toHaveProperty(EFFECT_TYPES.SOCIAL);

      // Check that each type has at least one effect
      expect(effectsByType[EFFECT_TYPES.PHYSICAL].length).toBeGreaterThan(0);
      expect(effectsByType[EFFECT_TYPES.MENTAL].length).toBeGreaterThan(0);
      expect(effectsByType[EFFECT_TYPES.SOCIAL].length).toBeGreaterThan(0);
    });
  });

  describe('Effect Retrieval Functions', () => {
    it('should retrieve effects by type', () => {
      const physicalEffects = getEffectsByType(EFFECT_TYPES.PHYSICAL);
      const mentalEffects = getEffectsByType(EFFECT_TYPES.MENTAL);
      const socialEffects = getEffectsByType(EFFECT_TYPES.SOCIAL);
      
      expect(physicalEffects.length).toBeGreaterThan(0);
      expect(mentalEffects.length).toBeGreaterThan(0);
      expect(socialEffects.length).toBeGreaterThan(0);
      
      physicalEffects.forEach(effect => {
        expect(effect.type).toBe(EFFECT_TYPES.PHYSICAL);
      });
      
      mentalEffects.forEach(effect => {
        expect(effect.type).toBe(EFFECT_TYPES.MENTAL);
      });
      
      socialEffects.forEach(effect => {
        expect(effect.type).toBe(EFFECT_TYPES.SOCIAL);
      });
    });
    
    it('should retrieve physical effects', () => {
      const physicalEffects = getPhysicalEffects();
      expect(physicalEffects.length).toBeGreaterThan(0);
      physicalEffects.forEach(effect => {
        expect(effect.type).toBe(EFFECT_TYPES.PHYSICAL);
      });
    });
    
    it('should retrieve mental effects', () => {
      const mentalEffects = getMentalEffects();
      expect(mentalEffects.length).toBeGreaterThan(0);
      mentalEffects.forEach(effect => {
        expect(effect.type).toBe(EFFECT_TYPES.MENTAL);
      });
    });
    
    it('should retrieve social effects', () => {
      const socialEffects = getSocialEffects();
      expect(socialEffects.length).toBeGreaterThan(0);
      socialEffects.forEach(effect => {
        expect(effect.type).toBe(EFFECT_TYPES.SOCIAL);
      });
    });
  });
}); 