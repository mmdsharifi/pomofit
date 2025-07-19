"use client";

import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../../lib/theme-context";
import { ThemeProvider } from "../../lib/theme-context";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe("useTheme Hook", () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset document.documentElement.classList
    document.documentElement.classList.remove("dark");
  });

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
    });

    const { result } = renderHook(() => useTheme(), { wrapper });

    // Should default to 'system' and apply system preference (dark in this case)
    expect(result.current.theme).toBe("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  test("changes theme correctly", () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme("light");
    });

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    act(() => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  test("persists theme preference to localStorage", async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme("dark");
    });

    // Wait for the debounced localStorage operation to complete
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(localStorage.getItem("pomofit-theme")).toBe('"dark"');

    // Unmount and remount to test persistence
    const { result: newResult } = renderHook(() => useTheme(), { wrapper });

    expect(newResult.current.theme).toBe("dark");
  });
});
