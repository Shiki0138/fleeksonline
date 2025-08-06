module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'consistent-return': 'off',
    'no-param-reassign': ['error', { props: false }],
    'no-underscore-dangle': 'off',
    'class-methods-use-this': 'off',
    'max-len': ['error', { code: 120, ignoreComments: true }],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'import/no-dynamic-require': 'off',
    'global-require': 'off',
  },
};