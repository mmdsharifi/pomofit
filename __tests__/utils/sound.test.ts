import { playSound } from "../../lib/utils";

// Mock the AudioContext and HTMLAudioElement
let audioPlayMock: jest.Mock;

beforeAll(() => {
  // Mock Audio
  audioPlayMock = jest.fn().mockResolvedValue(undefined);
  global.Audio = jest.fn().mockImplementation(() => ({
    play: audioPlayMock,
    pause: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
});

describe("Sound Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    audioPlayMock.mockClear();
  });

  test("playSound creates and plays an audio element", async () => {
    await playSound("success-83493.mp3");

    expect(global.Audio).toHaveBeenCalledWith("success-83493.mp3");
    expect(audioPlayMock).toHaveBeenCalled();
  });

  test("playSound handles errors gracefully", async () => {
    const mockConsoleError = jest.spyOn(console, "error").mockImplementation();

    // Make the play method reject
    const errorPlayMock = jest
      .fn()
      .mockRejectedValue(new Error("Audio playback failed"));
    global.Audio = jest.fn().mockImplementation(() => ({
      play: errorPlayMock,
      pause: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    await playSound("error.mp3");

    expect(mockConsoleError).toHaveBeenCalled();

    mockConsoleError.mockRestore();
  });
});
