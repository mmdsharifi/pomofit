import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import VersionDisplay from "@/components/version-display";
import * as versionUtils from "@/lib/version";

// Mock the version utility
jest.mock("@/lib/version", () => ({
  getVersionInfo: jest.fn(),
  formatVersion: jest.fn(),
}));

const mockVersionUtils = versionUtils as jest.Mocked<typeof versionUtils>;

describe("Version Integration", () => {
  const mockVersionInfo = {
    version: "1.2.3",
    buildDate: "2024-01-15T10:30:00.000Z",
    commitHash: "abc123def456",
    lastModified: "2024-01-15T10:30:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockVersionUtils.getVersionInfo.mockReturnValue(mockVersionInfo);
    mockVersionUtils.formatVersion.mockReturnValue(
      "v1.2.3 (Jan 15, 2024, 10:30 AM)"
    );
  });

  it("should display version information correctly", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      expect(screen.getByText("Version Information")).toBeInTheDocument();
    });

    expect(
      screen.getByText("v1.2.3 (Jan 15, 2024, 10:30 AM)")
    ).toBeInTheDocument();
    expect(screen.getByText("Build Date: Jan 15, 2024")).toBeInTheDocument();
    expect(screen.getByText("Commit: abc123de")).toBeInTheDocument();
    expect(screen.getByText("Semantic Versioning 2.0.0")).toBeInTheDocument();
  });

  it("should handle version utility errors gracefully", async () => {
    mockVersionUtils.getVersionInfo.mockImplementation(() => {
      throw new Error("Version info error");
    });

    render(<VersionDisplay />);

    await waitFor(() => {
      expect(screen.queryByText("Version Information")).not.toBeInTheDocument();
    });
  });

  it("should display correct version badge styling", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      const badge = screen.getByText("v1.2.3 (Jan 15, 2024, 10:30 AM)");
      expect(badge).toHaveClass("font-mono", "text-xs");
    });
  });

  it("should show all version information fields", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      // Version badge
      expect(
        screen.getByText("v1.2.3 (Jan 15, 2024, 10:30 AM)")
      ).toBeInTheDocument();

      // Build date
      expect(screen.getByText("Build Date: Jan 15, 2024")).toBeInTheDocument();

      // Commit hash (truncated to 8 characters)
      expect(screen.getByText("Commit: abc123de")).toBeInTheDocument();

      // Semantic versioning compliance
      expect(screen.getByText("Semantic Versioning 2.0.0")).toBeInTheDocument();
    });
  });

  it("should handle different version formats correctly", async () => {
    const differentVersionInfo = {
      version: "2.0.0-beta.1",
      buildDate: "2024-12-25T15:45:30.000Z",
      commitHash: "def456ghi789",
      lastModified: "2024-12-25T15:45:30.000Z",
    };

    mockVersionUtils.getVersionInfo.mockReturnValue(differentVersionInfo);
    mockVersionUtils.formatVersion.mockReturnValue(
      "v2.0.0-beta.1 (Dec 25, 2024, 03:45 PM)"
    );

    render(<VersionDisplay />);

    await waitFor(() => {
      expect(
        screen.getByText("v2.0.0-beta.1 (Dec 25, 2024, 03:45 PM)")
      ).toBeInTheDocument();
      expect(screen.getByText("Build Date: Dec 25, 2024")).toBeInTheDocument();
      expect(screen.getByText("Commit: def456gh")).toBeInTheDocument();
    });
  });

  it("should handle empty version info gracefully", async () => {
    const emptyVersionInfo = {
      version: "",
      buildDate: "",
      commitHash: "",
      lastModified: "",
    };

    mockVersionUtils.getVersionInfo.mockReturnValue(emptyVersionInfo);
    mockVersionUtils.formatVersion.mockReturnValue("v (Invalid Date)");

    render(<VersionDisplay />);

    await waitFor(() => {
      expect(screen.getByText("v (Invalid Date)")).toBeInTheDocument();
    });
  });

  it("should display version information with proper accessibility", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      const versionInfo = screen.getByText("Version Information");
      expect(versionInfo).toBeInTheDocument();

      // Check that the version badge is accessible
      const badge = screen.getByText("v1.2.3 (Jan 15, 2024, 10:30 AM)");
      expect(badge).toBeInTheDocument();
    });
  });

  it("should handle long commit hashes correctly", async () => {
    const longCommitHash = "abcdef1234567890abcdef1234567890abcdef12";
    const versionInfoWithLongHash = {
      ...mockVersionInfo,
      commitHash: longCommitHash,
    };

    mockVersionUtils.getVersionInfo.mockReturnValue(versionInfoWithLongHash);

    render(<VersionDisplay />);

    await waitFor(() => {
      // Should display only first 8 characters
      expect(screen.getByText("Commit: abcdef12")).toBeInTheDocument();
    });
  });

  it("should display icons correctly", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      // Check for Package icon
      expect(screen.getByTestId("package-icon")).toBeInTheDocument();

      // Check for Calendar icon
      expect(screen.getByTestId("calendar-icon")).toBeInTheDocument();

      // Check for GitCommit icon
      expect(screen.getByTestId("git-commit-icon")).toBeInTheDocument();
    });
  });

  it("should have correct card styling", async () => {
    render(<VersionDisplay />);

    await waitFor(() => {
      const card = screen
        .getByText("Version Information")
        .closest('[class*="border-dashed"]');
      expect(card).toBeInTheDocument();
    });
  });
});
