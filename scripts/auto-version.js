#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
const { execSync } = require("child_process");

// Configuration
const WATCH_PATTERNS = [
  "app/**/*",
  "components/**/*",
  "lib/**/*",
  "hooks/**/*",
  "types/**/*",
  "public/**/*",
  "styles/**/*",
];

const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/.git/**",
  "**/coverage/**",
  "**/.next/**",
  "**/dist/**",
  "**/build/**",
  "**/*.log",
  "**/*.test.*",
  "**/*.spec.*",
  "**/__tests__/**",
  "**/__mocks__/**",
];

// Version tracking
let lastChangeTime = Date.now();
let changeCount = 0;
const CHANGE_DEBOUNCE = 5000; // 5 seconds

// Load current version info
function loadVersionInfo() {
  try {
    const packagePath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    return {
      version: packageJson.version,
      buildNumber: Math.floor(Date.now() / 1000),
      changeCount: 0,
    };
  } catch (error) {
    console.error("Error loading version info:", error);
    return {
      version: "0.1.0",
      buildNumber: Math.floor(Date.now() / 1000),
      changeCount: 0,
    };
  }
}

// Save version info
function saveVersionInfo(versionInfo) {
  try {
    const versionData = {
      ...versionInfo,
      lastUpdated: new Date().toISOString(),
      buildDate: new Date().toISOString(),
    };

    const versionPath = path.join(process.cwd(), ".version-info.json");
    fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));

    console.log(
      `✅ Version updated: ${versionInfo.version}.${versionInfo.buildNumber}.${versionInfo.changeCount}`
    );
  } catch (error) {
    console.error("Error saving version info:", error);
  }
}

// Increment version
function incrementVersion(type = "patch") {
  try {
    const currentVersion = loadVersionInfo().version;
    const [major, minor, patch] = currentVersion.split(".").map(Number);

    let newVersion;
    switch (type) {
      case "major":
        newVersion = `${major + 1}.0.0`;
        break;
      case "minor":
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case "patch":
      default:
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
    }

    // Update package.json
    const packagePath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");

    return newVersion;
  } catch (error) {
    console.error("Error incrementing version:", error);
    return null;
  }
}

// Handle file changes
function handleFileChange(filePath) {
  const now = Date.now();

  // Debounce rapid changes
  if (now - lastChangeTime < CHANGE_DEBOUNCE) {
    return;
  }

  lastChangeTime = now;
  changeCount++;

  console.log(`📝 File changed: ${path.relative(process.cwd(), filePath)}`);

  // Update version info
  const versionInfo = loadVersionInfo();
  versionInfo.changeCount = changeCount;
  saveVersionInfo(versionInfo);

  // Record change in localStorage equivalent (for client-side access)
  try {
    const changeLogPath = path.join(process.cwd(), ".change-log.json");
    let changeLog = [];

    if (fs.existsSync(changeLogPath)) {
      changeLog = JSON.parse(fs.readFileSync(changeLogPath, "utf8"));
    }

    changeLog.push({
      timestamp: now,
      file: path.relative(process.cwd(), filePath),
      version: `${versionInfo.version}.${versionInfo.buildNumber}.${changeCount}`,
      date: new Date().toISOString(),
    });

    // Keep only last 100 changes
    if (changeLog.length > 100) {
      changeLog = changeLog.slice(-100);
    }

    fs.writeFileSync(changeLogPath, JSON.stringify(changeLog, null, 2));
  } catch (error) {
    console.warn("Error updating change log:", error);
  }
}

// Initialize version tracking
function initializeVersionTracking() {
  console.log("🚀 Initializing auto-versioning...");

  const versionInfo = loadVersionInfo();
  saveVersionInfo(versionInfo);

  console.log(
    `📦 Current version: ${versionInfo.version}.${versionInfo.buildNumber}.${changeCount}`
  );
  console.log(`👀 Watching for changes in: ${WATCH_PATTERNS.join(", ")}`);
}

// Start file watcher
function startWatcher() {
  const watcher = chokidar.watch(WATCH_PATTERNS, {
    ignored: IGNORE_PATTERNS,
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
  });

  watcher
    .on("add", handleFileChange)
    .on("change", handleFileChange)
    .on("unlink", handleFileChange)
    .on("error", (error) => console.error("Watcher error:", error))
    .on("ready", () => {
      console.log("✅ File watcher ready");
      console.log("💡 Auto-versioning is now active!");
      console.log("   Every file change will increment the version number.");
    });

  return watcher;
}

// CLI commands
function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "init":
      initializeVersionTracking();
      break;

    case "watch":
      initializeVersionTracking();
      startWatcher();
      break;

    case "increment":
      const type = args[1] || "patch";
      const newVersion = incrementVersion(type);
      if (newVersion) {
        console.log(`✅ Version incremented to: ${newVersion}`);
      }
      break;

    case "status":
      const versionInfo = loadVersionInfo();
      console.log(
        `📦 Current version: ${versionInfo.version}.${versionInfo.buildNumber}.${changeCount}`
      );
      break;

    case "reset":
      try {
        fs.unlinkSync(path.join(process.cwd(), ".version-info.json"));
        fs.unlinkSync(path.join(process.cwd(), ".change-log.json"));
        console.log("✅ Version tracking reset");
      } catch (error) {
        console.log("ℹ️  No version files to reset");
      }
      break;

    default:
      console.log(`
🎯 Auto-Versioning Tool

Usage:
  node scripts/auto-version.js <command>

Commands:
  init      - Initialize version tracking
  watch     - Start watching files for changes
  increment [type] - Increment version (major|minor|patch)
  status    - Show current version status
  reset     - Reset version tracking

Examples:
  node scripts/auto-version.js init
  node scripts/auto-version.js watch
  node scripts/auto-version.js increment patch
  node scripts/auto-version.js status
      `);
  }
}

// Run CLI
if (require.main === module) {
  handleCLI();
}

module.exports = {
  loadVersionInfo,
  saveVersionInfo,
  incrementVersion,
  handleFileChange,
  initializeVersionTracking,
  startWatcher,
};
