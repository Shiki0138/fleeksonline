module.exports = {
  "testEnvironment": "node",
  "collectCoverageFrom": [
    "src/**/*.js",
    "!src/server.js",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/tests/**"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "lcov",
    "html",
    "json-summary"
  ],
  "coverageThreshold": {
    "statements": 80,
    "branches": 75,
    "functions": 80,
    "lines": 80
  },
  "setupFilesAfterEnv": [
    "<rootDir>/tests/setup.js"
  ],
  "testMatch": [
    "<rootDir>/tests/**/*.test.js"
  ],
  "testPathIgnorePatterns": [
    "/node_modules/",
    "/coverage/"
  ],
  "verbose": true,
  "forceExit": true,
  "detectOpenHandles": true,
  "maxWorkers": "50%",
  "testTimeout": 30000,
  "ci": true,
  "watchman": false,
  "reporters": [
    "default",
    [
      "jest-junit",
      {
        "outputDirectory": "./test-results",
        "outputName": "junit.xml"
      }
    ],
    [
      "jest-html-reporters",
      {
        "publicPath": "./test-results",
        "filename": "report.html"
      }
    ]
  ]
};