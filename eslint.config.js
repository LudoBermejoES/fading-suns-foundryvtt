module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-env']
    }
  },
  globals: {
    CONFIG: 'readonly',
    game: 'readonly',
    Hooks: 'readonly',
    Actors: 'readonly',
    Items: 'readonly',
    ActorSheet: 'readonly',
    ItemSheet: 'readonly',
    Handlebars: 'readonly',
    FormApplication: 'readonly',
    ChatMessage: 'readonly',
    Roll: 'readonly',
    fadingSuns: 'readonly',
    Promise: 'readonly',
    Map: 'readonly',
    global: 'readonly',
    jest: 'readonly'
  },
  plugins: [
    'import'
  ],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/no-unresolved': 'off',
    'no-undef': 'error'
  },
  overrides: [
    {
      files: ['tests/**/*.js', 'tests/**/*.mjs'],
      env: {
        jest: true
      },
      globals: {
        jest: 'readonly'
      },
      rules: {
        'no-undef': 'off'
      }
    }
  ]
}; 