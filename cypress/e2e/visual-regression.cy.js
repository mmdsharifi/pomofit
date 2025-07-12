describe("Visual Regression Tests", () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit("/")
  })

  it("should match the timer page snapshot", () => {
    // Wait for the page to fully load
    cy.get('[data-testid="timer-display"]').should("be.visible")

    // Take a snapshot of the timer page
    cy.matchImageSnapshot("timer-page")
  })

  it("should match the task list snapshot", () => {
    // Add a task
    cy.get('[data-testid="add-task-button"]').click()
    cy.get('[data-testid="task-input"]').type("Test Task")
    cy.get('[data-testid="submit-task-button"]').click()

    // Take a snapshot of the task list
    cy.get('[data-testid="task-list"]').matchImageSnapshot("task-list")
  })

  it("should match the settings modal snapshot", () => {
    // Open settings
    cy.get('[data-testid="settings-button"]').click()

    // Wait for the modal to open
    cy.get('[data-testid="settings-modal"]').should("be.visible")

    // Take a snapshot of the settings modal
    cy.matchImageSnapshot("settings-modal")
  })
})
