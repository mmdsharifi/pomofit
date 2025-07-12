import { playSound } from "@/lib/utils"

// Mock the AudioContext and HTMLAudioElement
beforeAll(() => {
  // Mock Audio
  global.Audio = jest.fn().mockImplementation(() => ({
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }))
})

describe("Sound Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("playSound creates and plays an audio element", async () => {
    await playSound("success-83493.mp3")

    expect(global.Audio).toHaveBeenCalledWith("success-83493.mp3")
    expect(global.Audio.mock.instances[0].play).toHaveBeenCalled()
  })

  test("playSound handles errors gracefully", async () => {
    const mockConsoleError = jest.spyOn(console, "error").mockImplementation()

    // Make the play method reject
    global.Audio = jest.fn().mockImplementation(() => ({
      play: jest.fn().mockRejectedValue(new Error("Audio playback failed")),
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }))

    await playSound("error.mp3")

    expect(mockConsoleError).toHaveBeenCalled()

    mockConsoleError.mockRestore()
  })
})
