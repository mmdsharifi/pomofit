const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/commands.js",
    baseUrl: "http://localhost:3000", // Change if your dev server runs elsewhere
  },
});
