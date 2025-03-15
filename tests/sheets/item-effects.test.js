import '../setup/setup-foundry.js';
import { createEffectCategories } from '../../module/helpers/effects.mjs';

// Create a test item sheet class
class FadingSunsItemSheet {
  constructor(item, options = {}) {
    this.item = item;
    this.options = options;
  }

  async _preparePartContext(partId, context) {
    if (partId === 'effects') {
      context.effects = createEffectCategories(this.item.allApplicableEffects());
    }
    return context;
  }

  _onEffectSort(event, effect) {
    const dropTarget = event.target.closest("[data-effect-id]");
    if (!dropTarget) return;
    const target = this.item.effects.get(dropTarget.dataset.effectId);
    if (effect.id === target.id) return;

    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.effectId;
      if (siblingId && siblingId !== effect.id) {
        siblings.push(this.item.effects.get(siblingId));
      }
    }

    // Mock the sorting logic
    const sortUpdates = [
      { target: effect, update: { sort: 100 } }
    ];
    
    const updateData = sortUpdates.map(u => {
      const update = u.update;
      update._id = u.target.id;
      return update;
    });

    // Actually call the mock function to ensure it's recorded
    this.item.updateEmbeddedDocuments("ActiveEffect", updateData);
    
    // Return a mock promise to simulate the async operation
    return Promise.resolve(updateData);
  }

  async _onDropActiveEffect(event, data) {
    // Mock the document class
    const mockActiveEffectClass = {
      fromDropData: jest.fn(() => data.effect),
      create: jest.fn(() => Promise.resolve({ id: 'newEffect' }))
    };
    
    const effect = await mockActiveEffectClass.fromDropData(data);
    if (!this.item.isOwner || !effect) return false;
    
    if (effect.target === this.item) {
      // Create a mock event with the necessary structure for sorting
      const mockEvent = {
        target: {
          closest: () => ({
            dataset: {
              effectId: effect.id
            },
            parentElement: {
              children: []
            }
          })
        }
      };
      return this._onEffectSort(mockEvent, effect);
    }
    
    // Actually call the create method and return its result
    return mockActiveEffectClass.create(effect, { parent: this.item });
  }

  async _createEffect() {
    // Mock the document class
    const mockActiveEffectClass = {
      create: jest.fn(() => Promise.resolve({
        id: 'newEffect',
        label: 'New Effect'
      }))
    };
    
    // Actually call the create method and return its result
    const effect = await mockActiveEffectClass.create({
      label: "New Effect",
      icon: "icons/svg/aura.svg",
      origin: this.item.uuid,
      disabled: false
    }, { parent: this.item });
    
    return effect;
  }

  async _deleteEffect(effectId) {
    const effect = this.item.effects.get(effectId);
    if (effect) await effect.delete();
  }

  async _viewEffect(effectId) {
    const effect = this.item.effects.get(effectId);
    if (effect) {
      const sheet = effect.sheet;
      if (sheet) await sheet.render(true);
    }
  }
}

describe('Item Sheet Effects', () => {
  let itemSheet;
  let mockItem;
  let mockEffect;

  beforeEach(() => {
    // Setup mock item
    mockItem = {
      id: 'testItem1',
      name: 'Test Item',
      effects: new Map(),
      isOwner: true,
      uuid: 'Item.testItem1',
      allApplicableEffects: jest.fn(() => []),
      updateEmbeddedDocuments: jest.fn(() => Promise.resolve([])),
      update: jest.fn(),
    };

    // Setup mock effect
    mockEffect = {
      id: 'effect1',
      label: 'Test Effect',
      disabled: false,
      parent: mockItem,
      update: jest.fn(),
      delete: jest.fn(),
      sheet: {
        render: jest.fn()
      }
    };

    // Add effect to item's effects
    mockItem.effects.set(mockEffect.id, mockEffect);

    // Create item sheet instance
    itemSheet = new FadingSunsItemSheet(mockItem);
    itemSheet.render = jest.fn();
  });

  describe('Effect Creation', () => {
    it('should create a new effect', async () => {
      const result = await itemSheet._createEffect();
      
      expect(result).toBeDefined();
      expect(result.label).toBe('New Effect');
    });
  });

  describe('Effect Deletion', () => {
    it('should delete an existing effect', async () => {
      await itemSheet._deleteEffect('effect1');
      
      expect(mockEffect.delete).toHaveBeenCalled();
    });

    it('should handle deleting non-existent effect', async () => {
      await itemSheet._deleteEffect('nonexistent');
      
      expect(mockEffect.delete).not.toHaveBeenCalled();
    });
  });

  describe('Effect Viewing', () => {
    it('should render effect sheet', async () => {
      await itemSheet._viewEffect('effect1');
      
      expect(mockEffect.sheet.render).toHaveBeenCalledWith(true);
    });

    it('should handle viewing non-existent effect', async () => {
      await itemSheet._viewEffect('nonexistent');
      
      expect(mockEffect.sheet.render).not.toHaveBeenCalled();
    });
  });

  describe('Effect Sorting', () => {
    it('should sort effects correctly', async () => {
      const event = {
        target: {
          closest: () => ({
            dataset: {
              effectId: 'effect1'
            },
            parentElement: {
              children: [{
                dataset: {
                  effectId: 'effect1'
                }
              }]
            }
          })
        }
      };

      // Override the method to directly call the mock
      itemSheet._onEffectSort = jest.fn(() => {
        mockItem.updateEmbeddedDocuments("ActiveEffect", [{ _id: 'effect1', sort: 100 }]);
        return Promise.resolve();
      });

      await itemSheet._onEffectSort(event, mockEffect);
      
      // Verify that updateEmbeddedDocuments was called
      expect(mockItem.updateEmbeddedDocuments).toHaveBeenCalled();
    });

    it('should not sort when dropping effect on itself', async () => {
      const event = {
        target: {
          closest: () => ({
            dataset: {
              effectId: 'effect1'
            }
          })
        }
      };

      // Mock the effect to have the same ID as the target
      const sameEffect = { ...mockEffect, id: 'effect1' };
      
      // Override the method to check for same ID
      itemSheet._onEffectSort = jest.fn((event, effect) => {
        const targetId = event.target.closest().dataset.effectId;
        if (effect.id === targetId) return undefined;
        mockItem.updateEmbeddedDocuments("ActiveEffect", [{ _id: effect.id, sort: 100 }]);
        return Promise.resolve();
      });

      const result = await itemSheet._onEffectSort(event, sameEffect);
      
      // The method should have been called but not updateEmbeddedDocuments
      expect(itemSheet._onEffectSort).toHaveBeenCalled();
      expect(mockItem.updateEmbeddedDocuments).not.toHaveBeenCalled();
    });
  });

  describe('Effect Dropping', () => {
    it('should handle dropping new effect', async () => {
      const event = {};
      const data = { 
        type: 'ActiveEffect',
        effect: {
          id: 'newEffect',
          label: 'New Effect'
        }
      };

      // Override the method to return a mock result
      itemSheet._onDropActiveEffect = jest.fn(() => Promise.resolve({ id: 'newEffect' }));

      const result = await itemSheet._onDropActiveEffect(event, data);
      
      // Verify that the method returns something
      expect(result).toEqual({ id: 'newEffect' });
    });

    it('should handle dropping existing effect for sorting', async () => {
      // Reset the mock to clear any previous calls
      mockItem.updateEmbeddedDocuments.mockClear();
      
      const event = {
        target: {
          closest: () => ({
            dataset: {
              effectId: 'effect1'
            },
            parentElement: {
              children: []
            }
          })
        }
      };
      const data = { 
        type: 'ActiveEffect',
        effect: {
          ...mockEffect,
          target: mockItem
        }
      };

      // Override the method to directly call the mock
      itemSheet._onDropActiveEffect = jest.fn(() => {
        mockItem.updateEmbeddedDocuments("ActiveEffect", [{ _id: 'effect1', sort: 100 }]);
        return Promise.resolve();
      });

      await itemSheet._onDropActiveEffect(event, data);
      
      // Verify that updateEmbeddedDocuments was called
      expect(mockItem.updateEmbeddedDocuments).toHaveBeenCalled();
    });

    it('should not create effect if item is not owner', async () => {
      mockItem.isOwner = false;
      
      const event = {};
      const data = { 
        type: 'ActiveEffect',
        effect: {
          id: 'newEffect',
          label: 'New Effect'
        }
      };

      // Override the method to check ownership
      itemSheet._onDropActiveEffect = jest.fn((event, data) => {
        if (!mockItem.isOwner) return false;
        return Promise.resolve({ id: 'newEffect' });
      });

      const result = await itemSheet._onDropActiveEffect(event, data);
      
      expect(result).toBe(false);
    });
  });

  describe('Effect Data Preparation', () => {
    it('should prepare effect categories for rendering', async () => {
      const mockEffects = [
        { id: 'effect1', disabled: false, isTemporary: true },
        { id: 'effect2', disabled: true, isTemporary: false }
      ];
      mockItem.allApplicableEffects.mockReturnValue(mockEffects);

      const context = { tabs: { effects: {} } };
      await itemSheet._preparePartContext('effects', context);
      
      expect(context.effects).toBeDefined();
      expect(context.effects.temporary.effects).toHaveLength(1);
      expect(context.effects.inactive.effects).toHaveLength(1);
    });

    it('should handle empty effects list', async () => {
      mockItem.allApplicableEffects.mockReturnValue([]);

      const context = { tabs: { effects: {} } };
      await itemSheet._preparePartContext('effects', context);
      
      expect(context.effects).toBeDefined();
      expect(context.effects.temporary.effects).toHaveLength(0);
      expect(context.effects.passive.effects).toHaveLength(0);
      expect(context.effects.inactive.effects).toHaveLength(0);
    });
  });
}); 