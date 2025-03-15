import { mergeObject } from '../../module/helpers/utils.mjs';

// Mock api object
global.api = {
  HandlebarsApplicationMixin: jest.fn((baseClass) => {
    return class extends baseClass {
      static get defaultOptions() {
        return {
          template: null,
          classes: [],
          width: 400,
          height: 400,
          tabs: [],
        };
      }
    };
  }),
};

// Mock foundry.utils
global.foundry = {
  utils: {
    mergeObject: jest.fn((target, source) => ({ ...target, ...source })),
    setProperty: (obj, key, value) => {
      const parts = key.split('.');
      let current = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    },
    getProperty: (obj, key) => {
      return key.split('.').reduce((o, i) => o?.[i], obj);
    },
    flattenObject: (obj, _d = 0) => {
      const flat = {};
      if (_d > 100) return flat;
      for (let [k, v] of Object.entries(obj)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          const inner = global.foundry.utils.flattenObject(v, _d + 1);
          for (let [ik, iv] of Object.entries(inner)) {
            flat[`${k}.${ik}`] = iv;
          }
        } else {
          flat[k] = v;
        }
      }
      return flat;
    },
    deepClone: (original) => {
      if (original === null || typeof original !== 'object') return original;
      if (Array.isArray(original)) {
        return original.map(item => global.foundry.utils.deepClone(item));
      }
      const clone = {};
      for (const key in original) {
        clone[key] = global.foundry.utils.deepClone(original[key]);
      }
      return clone;
    },
  },
  applications: {
    HandlebarsApplicationMixin: (parent) => class extends parent {
      static get defaultOptions() {
        return {
          ...super.defaultOptions,
          template: '',
          classes: [],
          popOut: true,
        };
      }
    },
    sheets: {
      ActorSheetV2: class {
        static get defaultOptions() {
          return {
            template: '',
            classes: [],
            popOut: true,
          };
        }
      },
      ItemSheetV2: class {
        static get defaultOptions() {
          return {
            template: '',
            classes: [],
            popOut: true,
          };
        }
      },
    },
    api: {
      HandlebarsFormApplication: class {
        static get defaultOptions() {
          return {
            template: '',
            classes: [],
            popOut: true,
          };
        }
      },
    },
  },
  data: {
    validators: {
      _baseValidators: {
        string: jest.fn(),
        number: jest.fn(),
        boolean: jest.fn(),
      }
    }
  }
};

// Mock FormApplication
global.FormApplication = class FormApplication {
  constructor(object = {}, options = {}) {
    this.object = object;
    this.options = mergeObject({}, options);
    this.tabGroups = {};
  }

  static get defaultOptions() {
    return {
      classes: [],
      popOut: true,
      submitOnChange: false,
      closeOnSubmit: true,
      editable: true,
      tabs: [],
      dragDrop: [],
    };
  }

  get isEditable() {
    return true;
  }

  get isOwner() {
    return true;
  }

  getData() {
    return {};
  }

  close() {
    return Promise.resolve();
  }
};

// Mock game object
global.game = {
  i18n: {
    localize: jest.fn((key) => key),
    format: jest.fn((key, data) => key),
  },
  settings: {
    get: jest.fn(),
    register: jest.fn(),
  },
  user: {
    isGM: true,
  },
  actors: {
    get: jest.fn(),
  },
  items: {
    get: jest.fn(),
  },
};

// Mock TextEditor
global.TextEditor = {
  enrichHTML: jest.fn(async (text) => text),
};

// Mock CONFIG
global.CONFIG = {
  FADING_SUNS: {},
  Combat: {
    initiative: {
      formula: '1d20',
      decimals: 2,
    },
  },
  Actor: {
    documentClass: class {},
  },
  Item: {
    documentClass: class {},
  },
  ActiveEffect: {
    legacyTransferral: false,
  },
};

// Mock Actors and Items registration
global.Actors = {
  unregisterSheet: jest.fn(),
  registerSheet: jest.fn(),
};

global.Items = {
  unregisterSheet: jest.fn(),
  registerSheet: jest.fn(),
};

// Mock jQuery
global.$ = jest.fn(() => ({
  on: jest.fn(),
}));

// Mock document classes
global.getDocumentClass = jest.fn((type) => {
  switch (type) {
    case 'ActiveEffect':
      return class {
        static create() {}
        static fromDropData() {}
        static defaultName() {}
      };
    default:
      return class {};
  }
});

// Mock SortingHelpers
global.SortingHelpers = {
  performIntegerSort: jest.fn(),
};

// Mock Hooks
global.Hooks = {
  once: jest.fn(),
  on: jest.fn(),
};

// Mock FilePicker
global.FilePicker = jest.fn().mockImplementation(() => ({
  browse: jest.fn(),
}));

// Mock renderTemplate
global.renderTemplate = jest.fn(async (template, data) => {
  return `<div class="chat-message">${JSON.stringify(data)}</div>`;
}); 