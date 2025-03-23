/**
 * Test for chat message hooks
 */

// Import function directly for testing
import { registerChatMessageHooks } from '../../module/helpers/hooks.mjs';

describe('Chat Message Hooks', () => {
  let mockHtml;
  let mockEvent;
  let mockActor;
  let originalHooks;
  let spendVpCallback;
  
  beforeEach(() => {
    // Store original Hooks
    originalHooks = global.Hooks;
    
    // Create a mock listener collection
    const listeners = {};
    
    // Mock Hooks global
    global.Hooks = {
      on: jest.fn((event, callback) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(callback);
        // Store the callback if it's for renderChatMessage
        if (event === 'renderChatMessage') {
          global.Hooks._renderChatMessageCallback = callback;
        }
      }),
      // Method to trigger a hook for testing
      _trigger: (event, ...args) => {
        if (listeners[event]) {
          listeners[event].forEach(callback => callback(...args));
        }
      }
    };
    
    // Create mock actor
    mockActor = {
      id: 'testActor1',
      name: 'Test Actor',
      system: {
        bank: {
          victoryPoints: 10,
          wyrdPoints: 5
        }
      },
      update: jest.fn().mockResolvedValue(true)
    };
    
    // Add actor to game.actors collection
    global.game.actors = {
      get: jest.fn(id => {
        if (id === 'testActor1') {
          return mockActor;
        }
        return null;
      })
    };
    
    // Mock spend VP button click callback holder
    spendVpCallback = null;
    
    // Create mock HTML elements
    mockHtml = {
      find: jest.fn(selector => {
        if (selector === '.spend-vp-button') {
          return {
            click: jest.fn(callback => {
              // Store the callback to trigger it in tests
              spendVpCallback = callback;
            })
          };
        }
        if (selector === '.result-roll .tooltiptext') {
          return {
            text: jest.fn()
          };
        }
        if (selector === '.defense-button') {
          return {
            click: jest.fn()
          };
        }
        return { click: jest.fn() };
      })
    };
    
    // Create mock event
    mockEvent = {
      preventDefault: jest.fn(),
      currentTarget: {
        dataset: {
          vpNeeded: '3',
          actorId: 'testActor1'
        }
      }
    };
    
    // Add a notification mock
    global.ui = {
      notifications: {
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn()
      }
    };
    
    // Add ChatMessage mock
    global.ChatMessage = {
      create: jest.fn().mockResolvedValue({}),
      getSpeaker: jest.fn(() => ({ actor: mockActor }))
    };
    
    // Register the hooks for testing
    registerChatMessageHooks();
  });
  
  afterEach(() => {
    // Restore original Hooks
    global.Hooks = originalHooks;
  });
  
  describe('renderChatMessage hook', () => {
    it('should register the renderChatMessage hook', () => {
      // Check that the hook was registered
      expect(global.Hooks.on).toHaveBeenCalledWith('renderChatMessage', expect.any(Function));
    });
    
    it('should handle spending VP to succeed', async () => {
      // Trigger the hook to register button handlers
      global.Hooks._renderChatMessageCallback({}, mockHtml, {});
      
      // Now trigger the spend VP button click
      await spendVpCallback(mockEvent);
      
      // Verify actor VP was deducted
      expect(mockActor.system.bank.victoryPoints).toBe(7); // 10 - 3
      
      // Verify actor was updated
      expect(mockActor.update).toHaveBeenCalled();
      
      // Verify message was updated
      const textUpdateFn = mockHtml.find('.result-roll .tooltiptext').text;
      expect(textUpdateFn).toHaveBeenCalled();
      
      // Verify chat message was created
      expect(global.ChatMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.any(String),
          speaker: expect.any(Object)
        })
      );
    });
    
    it('should warn if actor does not have enough VP', async () => {
      // Set actor to have insufficient VP
      mockActor.system.bank.victoryPoints = 2; // VP needed is 3
      
      // Trigger the hook
      global.Hooks._renderChatMessageCallback({}, mockHtml, {});
      
      // Trigger the spend VP button click
      await spendVpCallback(mockEvent);
      
      // Verify warning was shown
      expect(global.ui.notifications.warn).toHaveBeenCalled();
      
      // Verify actor VP was not deducted
      expect(mockActor.system.bank.victoryPoints).toBe(2);
      
      // Verify actor was not updated
      expect(mockActor.update).not.toHaveBeenCalled();
    });
    
    it('should do nothing if actor is not found', async () => {
      // Set invalid actor ID
      mockEvent.currentTarget.dataset.actorId = 'nonExistentActor';
      
      // Trigger the hook
      global.Hooks._renderChatMessageCallback({}, mockHtml, {});
      
      // Trigger the spend VP button click
      await spendVpCallback(mockEvent);
      
      // Verify no update was attempted
      expect(mockActor.update).not.toHaveBeenCalled();
      
      // No warning should be shown (silently fails)
      expect(global.ui.notifications.warn).not.toHaveBeenCalled();
    });
  });
  
  describe('defense button handling', () => {
    it('should register defense button click handlers', () => {
      // Trigger the hook
      global.Hooks._renderChatMessageCallback({}, mockHtml, {});
      
      // Verify defense button click was registered
      expect(mockHtml.find).toHaveBeenCalledWith('.defense-button');
    });
  });
}); 