describe("Pomofit Application", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit("/");
    // Wait for the app to finish client loading
    cy.get('[data-testid="timer-display"]', { timeout: 15000 }).should("be.visible");
  });

  it("should display the timer with default values", () => {
    cy.get('[data-testid="timer-display"]').should("contain", "25:00");
  });

  it("should start and pause the timer", () => {
    cy.get('[data-testid="start-button"]').click();
    cy.get('[data-testid="pause-button"]').should("be.visible");
    cy.get('[data-testid="pause-button"]').click();
    cy.get('[data-testid="start-button"]').should("be.visible");
  });

  it("should auto-save settings and update the timer display dynamically", () => {
    // Navigate to settings tab
    cy.get('[data-testid="settings-button"]').click();

    // Click Focus section
    cy.contains("Focus").click();

    // Verify auto-save status indicator is present
    cy.contains("All changes saved").should("be.visible");

    // Change pomodoro time slider value using Right Arrow key on Radix Slider thumb
    cy.get('#pomodoro-time [role="slider"]').focus().type("{rightarrow}");

    // Verify indicator shows saving then saved
    cy.contains("All changes saved", { timeout: 10000 }).should("be.visible");

    // Switch back to timer tab
    cy.contains("PomoFit").click();

    // Verify timer display updated to 30:00 without reloading the page
    cy.get('[data-testid="timer-display"]').should("contain", "30:00");
  });
});
