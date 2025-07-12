describe("Pomofit Application", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage()
    // Visit the app
    cy.visit("/")
  })

  it("should display the timer with default values", () => {
    cy.get('[data-testid="timer-display"]').should("contain", "25:00")
    cy.get('[data-testid="timer-type"]').should("contain", "Pomodoro")
  })

  it("should start, pause, and reset the timer", () => {
    // Start the timer
    cy.get('[data-testid="start-button"]').click()

    // Wait for 2 seconds to ensure the timer has started
    cy.wait(2000)

    // Timer should show less than 25:00
    cy.get('[data-testid="timer-display"]').should("not.contain", "25:00")

    // Pause the timer
    cy.get('[data-testid="pause-button"]').click()

    // Get the current time
    cy.get('[data-testid="timer-display"]')
      .invoke("text")
      .then((timeText1) => {
        // Wait for 2 seconds
        cy.wait(2000)

        // Get the time again
        cy.get('[data-testid="timer-display"]')
          .invoke("text")
          .then((timeText2) => {
            // Time should not have changed
            expect(timeText1).to.equal(timeText2)
          })
      })

    // Reset the timer
    cy.get('[data-testid="reset-button"]').click()

    // Timer should be back to 25:00
    cy.get('[data-testid="timer-display"]').should("contain", "25:00")
  })

  it("should add, complete, and delete tasks", () => {
    // Add a task
    cy.get('[data-testid="add-task-button"]').click()
    cy.get('[data-testid="task-input"]').type("Test Task")
    cy.get('[data-testid="submit-task-button"]').click()

    // Task should be in the list
    cy.get('[data-testid="task-list"]').should("contain", "Test Task")

    // Mark task as completed
    cy.get('[data-testid="task-checkbox"]').click()
    cy.get('[data-testid="task-item"]').should("have.class", "completed")

    // Delete the task
    cy.get('[data-testid="delete-task-button"]').click()
    cy.get('[data-testid="task-list"]').should("not.contain", "Test Task")
  })

  it("should change timer types", () => {
    // Switch to short break
    cy.get('[data-testid="short-break-button"]').click()
    cy.get('[data-testid="timer-display"]').should("contain", "05:00")
    cy.get('[data-testid="timer-type"]').should("contain", "Short Break")

    // Switch to long break
    cy.get('[data-testid="long-break-button"]').click()
    cy.get('[data-testid="timer-display"]').should("contain", "15:00")
    cy.get('[data-testid="timer-type"]').should("contain", "Long Break")

    // Switch back to pomodoro
    cy.get('[data-testid="pomodoro-button"]').click()
    cy.get('[data-testid="timer-display"]').should("contain", "25:00")
    cy.get('[data-testid="timer-type"]').should("contain", "Pomodoro")
  })

  it("should open and update settings", () => {
    // Open settings
    cy.get('[data-testid="settings-button"]').click()

    // Change pomodoro time
    cy.get('[data-testid="pomodoro-time-input"]').clear().type("20")

    // Save settings
    cy.get('[data-testid="save-settings-button"]').click()

    // Timer should reflect new settings
    cy.get('[data-testid="timer-display"]').should("contain", "20:00")
  })

  it("should persist data across page reloads", () => {
    // Add a task
    cy.get('[data-testid="add-task-button"]').click()
    cy.get('[data-testid="task-input"]').type("Persistent Task")
    cy.get('[data-testid="submit-task-button"]').click()

    // Change settings
    cy.get('[data-testid="settings-button"]').click()
    cy.get('[data-testid="pomodoro-time-input"]').clear().type("20")
    cy.get('[data-testid="save-settings-button"]').click()

    // Reload the page
    cy.reload()

    // Task should still be there
    cy.get('[data-testid="task-list"]').should("contain", "Persistent Task")

    // Timer should reflect saved settings
    cy.get('[data-testid="timer-display"]').should("contain", "20:00")
  })
})
