import React from "react";
import { render, screen } from "../../test/test-utils";
import OfflineIndicator from "@/components/offline-indicator";
import "@testing-library/jest-dom";

describe("OfflineIndicator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows offline indicator when offline", () => {
    Object.defineProperty(window.navigator, "onLine", {
      value: false,
      configurable: true,
    });
    render(<OfflineIndicator />);
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument();
  });

  test("hides indicator when online", () => {
    Object.defineProperty(window.navigator, "onLine", {
      value: true,
      configurable: true,
    });
    render(<OfflineIndicator />);
    expect(screen.queryByText(/you're offline/i)).not.toBeInTheDocument();
  });
});
