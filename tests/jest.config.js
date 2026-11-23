/** @type {import('jest').Config} */

module.exports = {
  rootDir: ".",
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json", isolatedModules: true, diagnostics: false }],
  },
  moduleFileExtensions: ["ts", "js", "json"],
  clearMocks: true,
};
