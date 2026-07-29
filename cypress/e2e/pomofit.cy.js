describe("Pomofit Application", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit("/");
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
});
