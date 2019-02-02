module.exports = {
  'extends': [
    'eslint:recommended',
    'google',
    'plugin:promise/recommended',
  ],

  'env': {
    'browser': true,
    'es6': true,
  },

  'plugins': [
    'html',
    'promise',
  ],

  'globals': {
    'app': true,
    'Chrome': true,
    'require': true,
    'chrome': true,
    'runtime': true,
    'wrap': true,
    'unwrap': true,
    'Polymer': true,
    'Platform': true,
    'gapi': true,
    'self': true,
    'clients': true,
    'Snoocore': true,
    'ChromePromise': true,
    'ExceptionHandler': true,
    'ga': true,
  },

  'rules': {
    'linebreak-style': ['off', 'windows'],
    'max-len': ['warn', 80],
    'eqeqeq': ['error', 'always'],
    'no-var': 'warn',
    'no-console': ['warn', {'allow': ['error']}],
    'no-unused-vars': 'warn',
    'comma-dangle': ['warn', 'always-multiline'],
    'no-trailing-spaces': 'off',
    'padded-blocks': 'off',
    'require-jsdoc': 'warn',
    'new-cap': ['error', {'capIsNewExceptions': ['Polymer', 'If']}],
    'quotes': ['error', 'single'],
    'quote-props': ['error', 'consistent'],
    'prefer-rest-params': 'off',
    'valid-jsdoc': [
      'error', {
        'requireParamDescription': false,
        'requireReturnDescription': false,
        'requireReturn': false,
        'prefer': {
          'return': 'returns',
        },
        'preferType': {
          'Boolean': 'boolean',
          'Number': 'number',
          'object': 'Object',
          'String': 'string',
          'Integer': 'int',
        },
      }],
  },

};
