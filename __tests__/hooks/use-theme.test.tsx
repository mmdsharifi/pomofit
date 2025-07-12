"use client"

import { renderHook, act } from "@testing-library/react"
import { useTheme } from "@/hooks/use-theme"

describe("useTheme Hook", () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear()

    // Reset document.documentElement.classList
    document.documentElement.classList.remove("dark")
  })

  test("initializes with system preference", () => {
    // Mock window.matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    const { result } = renderHook(() => useTheme())

    // Should match system preference (dark in this case)
    expect(result.current.theme).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  test("changes theme correctly", () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme("light")
    })

    expect(result.current.theme).toBe("light")
    expect(document.documentElement.classList.contains("dark")).toBe(false)

    act(() => {
      result.current.setTheme("dark")
    })

    expect(result.current.theme).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  test("persists theme preference to localStorage", () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme("dark")
    })

    expect(localStorage.getItem("theme")).toBe("dark")

    // Unmount and remount to test persistence
    const { result: newResult } = renderHook(() => useTheme())

    expect(newResult.current.theme).toBe("dark")
  })
})
