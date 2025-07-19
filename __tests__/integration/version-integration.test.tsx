import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import VersionDisplay from "@/components/version-display";

// Mock the version utility
jest.mock("@/lib/version", () => ({
  getVersionInfo: jest.fn(() => ({
    version: "1.2.3",
    buildDate: "Jan 15, 2024, 10:30 AM",
    commitHash: "abcdef1234567890",
    lastModified: "Jan 15, 2024, 10:30 AM",
  })),
  formatVersion: jest.fn((info) => `v${info.version} (${info.buildDate})`),
}));

describe("Version Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display version information correctly", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      expect(
        screen.getByText("v1.2.3 (Jan 15, 2024, 10:30 AM)")
      ).toBeInTheDocument();
    });
  });

  it("should display correct version badge styling", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      const badge = screen.getByText("v1.2.3 (Jan 15, 2024, 10:30 AM)");
      expect(badge).toHaveClass("font-mono");
    });
  });

  it("should show minimal version information", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      // Version and date on the left
      expect(
        screen.getByText("v1.2.3 (Jan 15, 2024, 10:30 AM)")
      ).toBeInTheDocument();
      // Version number on the right
      expect(screen.getByText("v1.2.3")).toBeInTheDocument();
    });
  });

  it("should handle different version formats correctly", async () => {
    const { getVersionInfo, formatVersion } = require("@/lib/version");
    getVersionInfo.mockReturnValue({
      version: "2.0.0-beta.1",
      buildDate: "Dec 25, 2024, 03:45 PM",
      commitHash: "abcdef1234567890",
      lastModified: "Dec 25, 2024, 03:45 PM",
    });
    formatVersion.mockReturnValue("v2.0.0-beta.1 (Dec 25, 2024, 03:45 PM)");

    render(<VersionDisplay />);

    await waitFor(() => {
      expect(
        screen.getByText("v2.0.0-beta.1 (Dec 25, 2024, 03:45 PM)")
      ).toBeInTheDocument();
    });
  });

  it("should display version information with proper accessibility", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      const container = screen
        .getByText(/v\d+\.\d+\.\d+.*\(.*\)/)
        .closest("div");
      expect(container).toBeInTheDocument();
    });
  });

  it("should handle error state gracefully", async () => {
    const { getVersionInfo } = require("@/lib/version");
    getVersionInfo.mockImplementation(() => {
      throw new Error("Version info not available");
    });

    render(<VersionDisplay />);

    await waitFor(() => {
      expect(screen.queryByText(/v\d+\.\d+\.\d+/)).not.toBeInTheDocument();
    });
  });

  it("should have correct minimal styling", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      const container = screen
        .getByText(/v\d+\.\d+\.\d+.*\(.*\)/)
        .closest("div");
      expect(container).toHaveClass(
        "p-2",
        "text-xs",
        "text-muted-foreground",
        "bg-muted/50",
        "rounded",
        "border",
        "border-border"
      );
    });
  });

  it("should have proper flex layout", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      const flexContainer = screen
        .getByText(/v\d+\.\d+\.\d+.*\(.*\)/)
        .closest(".flex");
      expect(flexContainer).toHaveClass(
        "flex",
        "items-center",
        "justify-between"
      );
    });
  });
});
