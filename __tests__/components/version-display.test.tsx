import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import VersionDisplay from "@/components/version-display";

// Mock the version utility
jest.mock("@/lib/version", () => ({
  getVersionInfo: jest.fn(),
  formatVersion: jest.fn(),
}));

const mockGetVersionInfo = jest.mocked(require("@/lib/version").getVersionInfo);
const mockFormatVersion = jest.mocked(require("@/lib/version").formatVersion);

describe("VersionDisplay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default mock values
    mockGetVersionInfo.mockReturnValue({
      version: "1.2.3",
      buildDate: "Jan 15, 2024, 10:30 AM",
      commitHash: "abcdef1234567890",
      lastModified: "Jan 15, 2024, 10:30 AM",
    });
    mockFormatVersion.mockReturnValue("v1.2.3 (Jan 15, 2024, 10:30 AM)");
  });

  it("should display version information after loading", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      // Should show formatted version on the left
      expect(
        screen.getByText("v1.2.3 (Jan 15, 2024, 10:30 AM)")
      ).toBeInTheDocument();
      // Should show version number on the right
      expect(screen.getByText("v1.2.3")).toBeInTheDocument();
    });
  });

  it("should display correct version badge styling", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      const formattedVersion = screen.getByText(
        "v1.2.3 (Jan 15, 2024, 10:30 AM)"
      );
      expect(formattedVersion).toHaveClass("font-mono");
    });
  });

  it("should display both version elements with correct layout", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      // Should show formatted version on the left
      expect(
        screen.getByText("v1.2.3 (Jan 15, 2024, 10:30 AM)")
      ).toBeInTheDocument();
      // Should show version number on the right with muted styling
      const versionNumber = screen.getByText("v1.2.3");
      expect(versionNumber).toHaveClass("text-muted-foreground/70");
    });
  });

  it("should have correct container styling", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      // Find the outer container div that has the styling classes
      const container = screen
        .getByText("v1.2.3 (Jan 15, 2024, 10:30 AM)")
        .closest("div");
      const outerContainer = container?.parentElement?.parentElement;
      expect(outerContainer).toHaveClass(
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

  it("should have correct flex layout", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      const flexContainer = screen
        .getByText("v1.2.3 (Jan 15, 2024, 10:30 AM)")
        .closest(".flex.items-center.justify-between");
      expect(flexContainer).toHaveClass(
        "flex",
        "items-center",
        "justify-between"
      );
    });
  });

  it("should handle different version formats correctly", async () => {
    mockGetVersionInfo.mockReturnValue({
      version: "2.0.0-beta.1",
      buildDate: "Dec 25, 2024, 03:45 PM",
      commitHash: "abcdef1234567890",
      lastModified: "Dec 25, 2024, 03:45 PM",
    });
    mockFormatVersion.mockReturnValue("v2.0.0-beta.1 (Dec 25, 2024, 03:45 PM)");

    render(<VersionDisplay />);

    await waitFor(() => {
      // Should show formatted version on the left
      expect(
        screen.getByText("v2.0.0-beta.1 (Dec 25, 2024, 03:45 PM)")
      ).toBeInTheDocument();
      // Should show version number on the right
      expect(screen.getByText("v2.0.0-beta.1")).toBeInTheDocument();
    });
  });

  it("should handle error state gracefully", async () => {
    mockGetVersionInfo.mockImplementation(() => {
      throw new Error("Version info not available");
    });

    render(<VersionDisplay />);

    // Should not render anything when there's an error
    await waitFor(() => {
      expect(screen.queryByText(/v\d+\.\d+\.\d+/)).not.toBeInTheDocument();
    });
  });

  it("should be accessible with proper structure", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      const container = screen
        .getByText("v1.2.3 (Jan 15, 2024, 10:30 AM)")
        .closest("div");
      expect(container).toBeInTheDocument();

      // Check for proper flex layout - find it directly
      const flexContainer = screen
        .getByText("v1.2.3 (Jan 15, 2024, 10:30 AM)")
        .closest(".flex.items-center.justify-between");
      expect(flexContainer).toBeInTheDocument();
      expect(flexContainer).toHaveClass(
        "flex",
        "items-center",
        "justify-between"
      );
    });
  });

  it("should render exactly two version elements", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      const versionElements = screen.getAllByText(/v\d+\.\d+\.\d+/);
      expect(versionElements).toHaveLength(2);

      // First element should be the formatted version
      expect(versionElements[0]).toHaveTextContent(
        "v1.2.3 (Jan 15, 2024, 10:30 AM)"
      );
      // Second element should be just the version number
      expect(versionElements[1]).toHaveTextContent("v1.2.3");
    });
  });
});
