// Auto-versioning system that tracks changes and provides real-time version updates
export interface VersionInfo {
  version: string;
  buildDate: string;
  commitHash: string;
  lastModified: string;
  buildNumber: number;
  changeCount: number;
  lastChangeDate: string;
}

// Cache for version info to avoid repeated calculations
let versionCache: VersionInfo | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Get base version from package.json
export function getPackageVersion(): string {
  try {
    if (typeof window !== "undefined") {
      return process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0";
    } else {
      const fs = require("fs");
      const path = require("path");
      const packagePath = path.join(process.cwd(), "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
      return packageJson.version;
    }
  } catch (error) {
    return process.env.npm_package_version || "0.1.0";
  }
}

// Get build number from file system or localStorage
export function getBuildNumber(): number {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pomofit-build-number");
      if (stored) {
        return parseInt(stored, 10);
      }
      // Initialize with timestamp-based build number
      const buildNumber = Math.floor(Date.now() / 1000);
      localStorage.setItem("pomofit-build-number", buildNumber.toString());
      return buildNumber;
    } else {
      // Server-side: use timestamp
      return Math.floor(Date.now() / 1000);
    }
  } catch (error) {
    return Math.floor(Date.now() / 1000);
  }
}

// Get change count by tracking file modifications
export function getChangeCount(): number {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pomofit-change-count");
      return stored ? parseInt(stored, 10) : 0;
    } else {
      // Server-side: try to count git commits or use timestamp
      const fs = require("fs");
      const { execSync } = require("child_process");
      try {
        const commitCount = execSync("git rev-list --count HEAD", {
          encoding: "utf8",
        }).trim();
        return parseInt(commitCount, 10);
      } catch {
        // Fallback to timestamp-based counting
        return Math.floor(Date.now() / 1000000);
      }
    }
  } catch (error) {
    return Math.floor(Date.now() / 1000000);
  }
}

// Increment change count
export function incrementChangeCount(): void {
  try {
    if (typeof window !== "undefined") {
      const current = getChangeCount();
      const newCount = current + 1;
      localStorage.setItem("pomofit-change-count", newCount.toString());
      localStorage.setItem("pomofit-last-change", Date.now().toString());
      // Clear cache to force refresh
      versionCache = null;
    }
  } catch (error) {
    console.warn("Failed to increment change count:", error);
  }
}

// Get last change date
export function getLastChangeDate(): string {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pomofit-last-change");
      if (stored) {
        return new Date(parseInt(stored, 10)).toISOString();
      }
    }
    return new Date().toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

// Get build date
export function getBuildDate(): string {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pomofit-build-date");
      if (stored) {
        return stored;
      }
      const buildDate = new Date().toISOString();
      localStorage.setItem("pomofit-build-date", buildDate);
      return buildDate;
    }
    return new Date().toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

// Get commit hash
export function getCommitHash(): string {
  try {
    if (typeof window !== "undefined") {
      return process.env.NEXT_PUBLIC_GIT_COMMIT_SHA || "development";
    } else {
      const { execSync } = require("child_process");
      try {
        return execSync("git rev-parse --short HEAD", {
          encoding: "utf8",
        }).trim();
      } catch {
        return (
          process.env.VERCEL_GIT_COMMIT_SHA ||
          process.env.GIT_COMMIT_SHA ||
          "development"
        );
      }
    }
  } catch (error) {
    return (
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GIT_COMMIT_SHA ||
      "development"
    );
  }
}

// Get last modified date
export function getLastModified(): string {
  return new Date().toISOString();
}

// Get full version info with caching
export function getVersionInfo(): VersionInfo {
  const now = Date.now();

  // Return cached version if still valid
  if (versionCache && now - cacheTimestamp < CACHE_DURATION) {
    return versionCache;
  }

  const baseVersion = getPackageVersion();
  const buildNumber = getBuildNumber();
  const changeCount = getChangeCount();

  // Create auto-incremented version
  const autoVersion = `${baseVersion}.${buildNumber}.${changeCount}`;

  const versionInfo: VersionInfo = {
    version: autoVersion,
    buildDate: getBuildDate(),
    commitHash: getCommitHash(),
    lastModified: getLastModified(),
    buildNumber,
    changeCount,
    lastChangeDate: getLastChangeDate(),
  };

  // Cache the result
  versionCache = versionInfo;
  cacheTimestamp = now;

  return versionInfo;
}

// Format version for display
export function formatVersion(versionInfo: VersionInfo): string {
  const date = new Date(versionInfo.lastModified);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `v${versionInfo.version} (${formattedDate})`;
}

// Parse semantic version
export function parseSemVer(version: string): {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
} {
  const semverRegex =
    /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  const match = version.match(semverRegex);

  if (!match) {
    throw new Error(`Invalid semantic version: ${version}`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    build: match[5],
  };
}

// Increment version based on SemVer rules
export function incrementVersion(
  currentVersion: string,
  type: "major" | "minor" | "patch"
): string {
  const parsed = parseSemVer(currentVersion);

  switch (type) {
    case "major":
      return `${parsed.major + 1}.0.0`;
    case "minor":
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case "patch":
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    default:
      throw new Error(`Invalid version increment type: ${type}`);
  }
}

// Force refresh version cache
export function refreshVersion(): void {
  versionCache = null;
  cacheTimestamp = 0;
}

// Get version change history
export function getVersionHistory(): Array<{
  version: string;
  date: string;
  changes: number;
}> {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("pomofit-version-history");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  } catch (error) {
    return [];
  }
}

// Record version change
export function recordVersionChange(version: string, changes: number): void {
  try {
    if (typeof window !== "undefined") {
      const history = getVersionHistory();
      history.push({
        version,
        date: new Date().toISOString(),
        changes,
      });

      // Keep only last 10 entries
      if (history.length > 10) {
        history.splice(0, history.length - 10);
      }

      localStorage.setItem("pomofit-version-history", JSON.stringify(history));
    }
  } catch (error) {
    console.warn("Failed to record version change:", error);
  }
}
