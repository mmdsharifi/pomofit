#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Conventional commit types and their semantic version impact
const COMMIT_TYPES = {
  feat: "minor", // New features
  fix: "patch", // Bug fixes
  docs: "patch", // Documentation
  style: "patch", // Code style changes
  refactor: "patch", // Code refactoring
  perf: "patch", // Performance improvements
  test: "patch", // Adding tests
  chore: "patch", // Maintenance tasks
  ci: "patch", // CI/CD changes
  build: "patch", // Build system changes
  revert: "patch", // Reverting changes
  "BREAKING CHANGE": "major", // Breaking changes
  breaking: "major", // Alternative breaking change format
};

// Parse current version from package.json
function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    return packageJson.version;
  } catch (error) {
    console.error("Error reading package.json:", error);
    return "0.1.0";
  }
}

// Parse version string into components
function parseVersion(version) {
  const parts = version.split(".");
  return {
    major: parseInt(parts[0]) || 0,
    minor: parseInt(parts[1]) || 0,
    patch: parseInt(parts[2]) || 0,
    build: parts[3] ? parseInt(parts[3]) : Math.floor(Date.now() / 1000),
    changes: parts[4] ? parseInt(parts[4]) : 0,
  };
}

// Format version back to string
function formatVersion(versionObj) {
  return `${versionObj.major}.${versionObj.minor}.${versionObj.patch}.${versionObj.build}.${versionObj.changes}`;
}

// Get git commit history since last version
function getCommitHistory(sinceHash = null) {
  try {
    const command = sinceHash
      ? `git log --pretty=format:"%H|%s|%b" ${sinceHash}..HEAD`
      : 'git log --pretty=format:"%H|%s|%b" -10'; // Last 10 commits if no since hash

    const output = execSync(command, { encoding: "utf8" });
    return output
      .trim()
      .split("\n")
      .filter((line) => line.length > 0);
  } catch (error) {
    console.warn("Error getting git history:", error.message);
    return [];
  }
}

// Analyze commit message for semantic version impact
function analyzeCommit(commitLine) {
  const [hash, subject, body] = commitLine.split("|");

  // Ensure subject exists
  if (!subject) {
    return "patch";
  }

  // Check for breaking changes in subject or body
  const isBreaking =
    subject.includes("BREAKING CHANGE") ||
    subject.includes("breaking") ||
    (body && (body.includes("BREAKING CHANGE") || body.includes("breaking")));

  if (isBreaking) {
    return "major";
  }

  // Parse conventional commit format: type(scope): description
  const conventionalMatch = subject.match(/^(\w+)(?:\([^)]+\))?:\s*(.+)$/);
  if (conventionalMatch) {
    const type = conventionalMatch[1].toLowerCase();
    return COMMIT_TYPES[type] || "patch";
  }

  // Fallback analysis based on keywords
  const lowerSubject = subject.toLowerCase();
  if (
    lowerSubject.includes("feat") ||
    lowerSubject.includes("add") ||
    lowerSubject.includes("new")
  ) {
    return "minor";
  }
  if (
    lowerSubject.includes("fix") ||
    lowerSubject.includes("bug") ||
    lowerSubject.includes("issue")
  ) {
    return "patch";
  }

  return "patch"; // Default to patch
}

// Determine semantic version increment from commit history
function determineVersionIncrement(commits) {
  let maxIncrement = "patch";

  for (const commit of commits) {
    const increment = analyzeCommit(commit);

    // Priority: major > minor > patch
    if (increment === "major" || maxIncrement === "major") {
      maxIncrement = "major";
    } else if (increment === "minor" || maxIncrement === "minor") {
      maxIncrement = "minor";
    }
  }

  return maxIncrement;
}

// Increment version based on semantic analysis
function incrementVersion(currentVersion, incrementType) {
  const version = parseVersion(currentVersion);

  switch (incrementType) {
    case "major":
      version.major++;
      version.minor = 0;
      version.patch = 0;
      break;
    case "minor":
      version.minor++;
      version.patch = 0;
      break;
    case "patch":
      version.patch++;
      break;
  }

  // Update build timestamp
  version.build = Math.floor(Date.now() / 1000);

  return formatVersion(version);
}

// Update package.json version
function updatePackageVersion(newVersion) {
  try {
    const packagePath = "package.json";
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
    packageJson.version = newVersion;
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + "\n");
    return true;
  } catch (error) {
    console.error("Error updating package.json:", error);
    return false;
  }
}

// Update version info file
function updateVersionInfo(newVersion, incrementType, commits) {
  try {
    const versionInfo = {
      version: newVersion,
      buildNumber: Math.floor(Date.now() / 1000),
      buildDate: new Date().toISOString(),
      incrementType,
      lastCommit: commits.length > 0 ? commits[0].split("|")[0] : null,
      commitCount: commits.length,
      semanticVersion: newVersion.split(".").slice(0, 3).join("."),
      build: newVersion.split(".")[3],
      changes: newVersion.split(".")[4],
    };

    fs.writeFileSync(
      ".version-info.json",
      JSON.stringify(versionInfo, null, 2)
    );
    return true;
  } catch (error) {
    console.error("Error updating version info:", error);
    return false;
  }
}

// Main semantic versioning function
function semanticVersion() {
  const command = process.argv[2];

  switch (command) {
    case "analyze":
      analyzeCommits();
      break;
    case "increment":
      incrementSemanticVersion();
      break;
    case "status":
      showSemanticStatus();
      break;
    case "init":
      initializeSemanticVersioning();
      break;
    default:
      console.log(`
Semantic Versioning Tool

Usage:
  node scripts/semantic-version.js <command>

Commands:
  analyze    - Analyze commits and suggest version increment
  increment  - Increment version based on commit analysis
  status     - Show current semantic version status
  init       - Initialize semantic versioning

Examples:
  node scripts/semantic-version.js analyze
  node scripts/semantic-version.js increment
      `);
  }
}

// Analyze commits and suggest version increment
function analyzeCommits() {
  console.log("🔍 Analyzing commit history for semantic versioning...\n");

  const currentVersion = getCurrentVersion();
  const commits = getCommitHistory();

  if (commits.length === 0) {
    console.log("No commits found to analyze.");
    return;
  }

  console.log(`Current version: ${currentVersion}\n`);
  console.log("Recent commits:");

  const commitAnalysis = [];
  for (const commit of commits.slice(0, 5)) {
    // Show last 5 commits
    const [hash, subject] = commit.split("|");
    const increment = analyzeCommit(commit);
    commitAnalysis.push({ hash, subject, increment });

    console.log(`  ${increment.toUpperCase()}: ${subject}`);
  }

  const suggestedIncrement = determineVersionIncrement(commits);
  const newVersion = incrementVersion(currentVersion, suggestedIncrement);

  console.log(`\n📈 Suggested increment: ${suggestedIncrement.toUpperCase()}`);
  console.log(`🆕 New version: ${newVersion}`);

  return { suggestedIncrement, newVersion, commits };
}

// Increment version based on semantic analysis
function incrementSemanticVersion() {
  console.log("🚀 Incrementing semantic version...\n");

  const analysis = analyzeCommits();
  if (!analysis) return;

  const { suggestedIncrement, newVersion, commits } = analysis;

  // Update package.json
  if (updatePackageVersion(newVersion)) {
    console.log("✅ Updated package.json version");
  } else {
    console.error("❌ Failed to update package.json");
    return;
  }

  // Update version info
  if (updateVersionInfo(newVersion, suggestedIncrement, commits)) {
    console.log("✅ Updated version info");
  }

  console.log(`\n🎉 Version incremented to: ${newVersion}`);
  console.log(`📝 Increment type: ${suggestedIncrement.toUpperCase()}`);
  console.log(`📊 Based on ${commits.length} commits`);
}

// Show semantic version status
function showSemanticStatus() {
  const currentVersion = getCurrentVersion();
  const version = parseVersion(currentVersion);

  console.log("📦 Semantic Version Status\n");
  console.log(`Current version: ${currentVersion}`);
  console.log(
    `Semantic version: ${version.major}.${version.minor}.${version.patch}`
  );
  console.log(`Build number: ${version.build}`);
  console.log(`Change count: ${version.changes}`);

  // Show recent commit analysis
  const commits = getCommitHistory();
  if (commits.length > 0) {
    console.log("\n📋 Recent commit analysis:");
    commits.slice(0, 3).forEach((commit) => {
      const [hash, subject] = commit.split("|");
      const increment = analyzeCommit(commit);
      console.log(`  ${increment.toUpperCase()}: ${subject}`);
    });
  }
}

// Initialize semantic versioning
function initializeSemanticVersioning() {
  console.log("🚀 Initializing semantic versioning...\n");

  const currentVersion = getCurrentVersion();
  const version = parseVersion(currentVersion);

  // Ensure we have a proper semantic version
  const semanticVersion = `${version.major}.${version.minor}.${version.patch}`;
  const fullVersion = `${semanticVersion}.${version.build}.0`;

  if (updatePackageVersion(fullVersion)) {
    console.log("✅ Initialized package.json version");
  }

  if (updateVersionInfo(fullVersion, "patch", [])) {
    console.log("✅ Initialized version info");
  }

  console.log(`\n🎉 Semantic versioning initialized: ${fullVersion}`);
  console.log("\n💡 Next steps:");
  console.log("  1. Use conventional commit messages (feat:, fix:, etc.)");
  console.log('  2. Run "npm run semantic:analyze" to check version impact');
  console.log('  3. Run "npm run semantic:increment" to update version');
}

// Run the script
if (require.main === module) {
  semanticVersion();
}

module.exports = {
  analyzeCommits,
  incrementSemanticVersion,
  showSemanticStatus,
  initializeSemanticVersioning,
  parseVersion,
  formatVersion,
  analyzeCommit,
};
