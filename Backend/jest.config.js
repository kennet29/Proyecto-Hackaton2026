/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/test.setup.ts"],
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.spec.ts", "**/*.e2e-spec.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/main.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.spec.json",
      },
    ],
  },
};
