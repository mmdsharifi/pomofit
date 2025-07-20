#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Get staged files
function getStagedFiles() {
  try {
    const output = execSync("git diff --cached --name-only", {
      encoding: "utf8",
    });
    return output.trim().split("\n").filter(Boolean);
  } catch (error) {
    console.error("Error getting staged files:", error);
    return [];
  }
}

// Check if files are relevant for version increment
function isRelevantFile(filePath) {
  const relevantPatterns = [
    /^app\//,
    /^components\//,
    /^lib\//,
    /^hooks\//,
    /^types\//,
    /^public\//,
    /^styles\//,
  ];

  const ignoredPatterns = [
    /\.test\./,
    /\.spec\./,
    /\.md$/,
    /\.json$/,
    /\.log$/,
    /\.gitignore$/,
    /README/,
  ];

  // Check if file matches relevant patterns
  const isRelevant = relevantPatterns.some((pattern) => pattern.test(filePath));

  // Check if file is ignored
  const isIgnored = ignoredPatterns.some((pattern) => pattern.test(filePath));

  return isRelevant && !isIgnored;
}

// Increment version
function incrementVersion() {
  try {
    const packagePath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

    const [major, minor, patch] = packageJson.version.split(".").map(Number);
    const newVersion = `${major}.${minor}.${patch + 1}`;

    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");

    // Stage the updated package.json
    execSync("git add package.json", { stdio: "inherit" });

    console.log(`✅ Version incremented to ${newVersion}`);
    return newVersion;
  } catch (error) {
    console.error("Error incrementing version:", error);
    return null;
  }
}

// Update version info file
function updateVersionInfo() {
  try {
    const versionInfo = {
      version: require("../package.json").version,
      buildNumber: Math.floor(Date.now() / 1000),
      buildDate: new Date().toISOString(),
      commitHash: execSync("git rev-parse --short HEAD", {
        encoding: "utf8",
      }).trim(),
      lastUpdated: new Date().toISOString(),
    };

    const versionPath = path.join(process.cwd(), ".version-info.json");
    fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));

    // Stage the version info file
    execSync("git add .version-info.json", { stdio: "inherit" });

    console.log(
      `📝 Version info updated: ${versionInfo.version}.${versionInfo.buildNumber}`
    );
  } catch (error) {
    console.error("Error updating version info:", error);
  }
}

// Main pre-commit logic
function main() {
  console.log("🔍 Checking for version-worthy changes...");

  const stagedFiles = getStagedFiles();
  const relevantFiles = stagedFiles.filter(isRelevantFile);

  if (relevantFiles.length === 0) {
    console.log("ℹ️  No relevant files changed, skipping version increment");
    return;
  }

  console.log(`📝 Found ${relevantFiles.length} relevant file(s) changed:`);
  relevantFiles.forEach((file) => console.log(`   - ${file}`));

  // Increment version
  const newVersion = incrementVersion();
  if (newVersion) {
    updateVersionInfo();
    console.log("🚀 Pre-commit version update completed!");
  } else {
    console.error("❌ Failed to update version");
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  getStagedFiles,
  isRelevantFile,
  incrementVersion,
  updateVersionInfo,
};
