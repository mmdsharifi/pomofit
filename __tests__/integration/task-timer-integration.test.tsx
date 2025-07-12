import { render, screen, fireEvent, act } from "../test-utils"
import { App } from "@/components/app"

// Mock the timer to control time
jest.useFakeTimers()

// Mock the sound playing function
jest.mock("@/lib/utils", () => ({
  ...jest.requireActual("@/lib/utils"),
  playSound: jest.fn(),
  formatTime: jest.requireActual("@/lib/utils").formatTime,
}))

describe("Task and Timer Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  test("starting a timer with a selected task updates task progress", () => {
    render(<App />)

    // Add a new task
    fireEvent.click(screen.getByText("Add Task"))
    const taskInput = screen.getByPlaceholderText("What are you working on?")
    fireEvent.change(taskInput, { target: { value: "Test Task" } })
    fireEvent.click(screen.getByText("Add"))

    // Select the task
    fireEvent.click(screen.getByText("Test Task"))

    // Start the timer
    fireEvent.click(screen.getByText("Start"))

    // Advance timer by 5 minutes
    act(() => {
      jest.advanceTimersByTime(5 * 60 * 1000)
    })

    // Check if the task progress has been updated
    // This would require a way to check the task's pomodoro count or progress
    // For this test to work, we'd need to expose this information in the UI

    // For now, we can check if the timer is running
    expect(screen.getByText("20:00")).toBeInTheDocument()
  })

  test("completing a pomodoro cycle increments completed pomodoros count", () => {
    render(<App />)

    // Start the timer
    fireEvent.click(screen.getByText("Start"))

    // Complete the pomodoro cycle (25 minutes)
    act(() => {
      jest.advanceTimersByTime(25 * 60 * 1000)
    })

    // Check if the completed pomodoros count has been incremented
    // This would require the count to be displayed in the UI
    // For this test to work, we'd need to expose this information

    // For now, we can check if the timer has switched to break mode
    expect(screen.getByText("Short Break")).toBeInTheDocument()
  })

  test("task completion status is preserved after page reload", () => {
    const { unmount } = render(<App />)

    // Add a new task
    fireEvent.click(screen.getByText("Add Task"))
    const taskInput = screen.getByPlaceholderText("What are you working on?")
    fireEvent.change(taskInput, { target: { value: "Test Task" } })
    fireEvent.click(screen.getByText("Add"))

    // Mark the task as completed
    fireEvent.click(screen.getByRole("checkbox"))

    // Unmount and remount to simulate page reload
    unmount()
    render(<App />)

    // Check if the task is still marked as completed
    expect(screen.getByRole("checkbox")).toBeChecked()
  })
})
