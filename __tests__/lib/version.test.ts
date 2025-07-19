import {
  getPackageVersion,
  getBuildDate,
  getCommitHash,
  getLastModified,
  getVersionInfo,
  formatVersion,
  parseSemVer,
  incrementVersion,
  type VersionInfo,
} from "@/lib/version";

// Mock environment variables
const originalEnv = process.env;

describe("Version Utility", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getPackageVersion", () => {
    it("should return version from environment variable", () => {
      process.env.NEXT_PUBLIC_APP_VERSION = "1.2.3";
      const version = getPackageVersion();
      expect(version).toBe("1.2.3");
    });

    it("should return fallback version when environment variable is not set", () => {
      delete process.env.NEXT_PUBLIC_APP_VERSION;
      const version = getPackageVersion();
      expect(version).toBe("0.1.0");
    });

    it("should return npm package version as fallback", () => {
      delete process.env.NEXT_PUBLIC_APP_VERSION;
      process.env.npm_package_version = "2.0.0";
      const version = getPackageVersion();
      expect(version).toBe("0.1.0"); // The function prioritizes NEXT_PUBLIC_APP_VERSION
    });
  });

  describe("getBuildDate", () => {
    it("should return current date in ISO format", () => {
      const before = new Date();
      const buildDate = getBuildDate();
      const after = new Date();

      const buildDateObj = new Date(buildDate);
      expect(buildDateObj.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(buildDateObj.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("getCommitHash", () => {
    it("should return Vercel commit SHA when available", () => {
      process.env.VERCEL_GIT_COMMIT_SHA = "abc123def456";
      const commitHash = getCommitHash();
      expect(commitHash).toBe("abc123def456");
    });

    it("should return Git commit SHA when Vercel SHA is not available", () => {
      delete process.env.VERCEL_GIT_COMMIT_SHA;
      process.env.GIT_COMMIT_SHA = "def456ghi789";
      const commitHash = getCommitHash();
      expect(commitHash).toBe("def456ghi789");
    });

    it("should return development when no commit SHA is available", () => {
      delete process.env.VERCEL_GIT_COMMIT_SHA;
      delete process.env.GIT_COMMIT_SHA;
      const commitHash = getCommitHash();
      expect(commitHash).toBe("development");
    });
  });

  describe("getLastModified", () => {
    it("should return current date in ISO format", () => {
      const before = new Date();
      const lastModified = getLastModified();
      const after = new Date();

      const lastModifiedObj = new Date(lastModified);
      expect(lastModifiedObj.getTime()).toBeGreaterThanOrEqual(
        before.getTime()
      );
      expect(lastModifiedObj.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe("getVersionInfo", () => {
    it("should return complete version information", () => {
      process.env.NEXT_PUBLIC_APP_VERSION = "1.2.3";
      process.env.VERCEL_GIT_COMMIT_SHA = "abc123";

      const versionInfo = getVersionInfo();

      expect(versionInfo).toHaveProperty("version", "1.2.3");
      expect(versionInfo).toHaveProperty("buildDate");
      expect(versionInfo).toHaveProperty("commitHash", "abc123");
      expect(versionInfo).toHaveProperty("lastModified");
      expect(new Date(versionInfo.buildDate)).toBeInstanceOf(Date);
      expect(new Date(versionInfo.lastModified)).toBeInstanceOf(Date);
    });
  });

  describe("formatVersion", () => {
    it("should format version with date correctly", () => {
      const versionInfo: VersionInfo = {
        version: "1.2.3",
        buildDate: "2024-01-15T10:30:00.000Z",
        commitHash: "abc123",
        lastModified: "2024-01-15T10:30:00.000Z",
      };

      const formatted = formatVersion(versionInfo);
      expect(formatted).toMatch(/^v1\.2\.3 \(.*\)$/);
    });

    it("should include date in readable format", () => {
      const versionInfo: VersionInfo = {
        version: "2.0.0",
        buildDate: "2024-01-15T10:30:00.000Z",
        commitHash: "abc123",
        lastModified: "2024-01-15T10:30:00.000Z",
      };

      const formatted = formatVersion(versionInfo);
      expect(formatted).toContain("v2.0.0");
      expect(formatted).toContain("Jan 15, 2024");
    });
  });

  describe("parseSemVer", () => {
    it("should parse valid semantic version", () => {
      const parsed = parseSemVer("1.2.3");
      expect(parsed).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
      });
    });

    it("should parse version with prerelease", () => {
      const parsed = parseSemVer("1.2.3-alpha.1");
      expect(parsed).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: "alpha.1",
      });
    });

    it("should parse version with build metadata", () => {
      const parsed = parseSemVer("1.2.3+build.123");
      expect(parsed).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        build: "build.123",
      });
    });

    it("should parse version with both prerelease and build", () => {
      const parsed = parseSemVer("1.2.3-alpha.1+build.123");
      expect(parsed).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        prerelease: "alpha.1",
        build: "build.123",
      });
    });

    it("should throw error for invalid version", () => {
      expect(() => parseSemVer("invalid")).toThrow(
        "Invalid semantic version: invalid"
      );
    });

    it("should throw error for version without patch", () => {
      expect(() => parseSemVer("1.2")).toThrow("Invalid semantic version: 1.2");
    });
  });

  describe("incrementVersion", () => {
    it("should increment major version", () => {
      const newVersion = incrementVersion("1.2.3", "major");
      expect(newVersion).toBe("2.0.0");
    });

    it("should increment minor version", () => {
      const newVersion = incrementVersion("1.2.3", "minor");
      expect(newVersion).toBe("1.3.0");
    });

    it("should increment patch version", () => {
      const newVersion = incrementVersion("1.2.3", "patch");
      expect(newVersion).toBe("1.2.4");
    });

    it("should handle zero versions", () => {
      expect(incrementVersion("0.0.0", "major")).toBe("1.0.0");
      expect(incrementVersion("0.0.0", "minor")).toBe("0.1.0");
      expect(incrementVersion("0.0.0", "patch")).toBe("0.0.1");
    });

    it("should handle large version numbers", () => {
      expect(incrementVersion("999.999.999", "major")).toBe("1000.0.0");
      expect(incrementVersion("999.999.999", "minor")).toBe("999.1000.0");
      expect(incrementVersion("999.999.999", "patch")).toBe("999.999.1000");
    });

    it("should throw error for invalid increment type", () => {
      expect(() => incrementVersion("1.2.3", "invalid" as any)).toThrow(
        "Invalid version increment type: invalid"
      );
    });
  });
});
