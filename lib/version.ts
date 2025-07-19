// Version management utility following SemVer 2.0.0
export interface VersionInfo {
  version: string;
  buildDate: string;
  commitHash: string;
  lastModified: string;
}

// Get version from package.json
export function getPackageVersion(): string {
  try {
    // In Next.js, we can access package.json through process.env
    if (typeof window !== "undefined") {
      // Client-side: use environment variable or fallback
      return process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0";
    } else {
      // Server-side: try to read package.json
      const fs = require("fs");
      const path = require("path");
      const packagePath = path.join(process.cwd(), "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
      return packageJson.version;
    }
  } catch (error) {
    // Fallback for build environments
    return process.env.npm_package_version || "0.1.0";
  }
}

// Get build date
export function getBuildDate(): string {
  return new Date().toISOString();
}

// Get commit hash (for development)
export function getCommitHash(): string {
  // In production, this would be set by the build process
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_COMMIT_SHA ||
    "development"
  );
}

// Get last modified date
export function getLastModified(): string {
  return new Date().toISOString();
}

// Get full version info
export function getVersionInfo(): VersionInfo {
  return {
    version: getPackageVersion(),
    buildDate: getBuildDate(),
    commitHash: getCommitHash(),
    lastModified: getLastModified(),
  };
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
