#!/usr/bin/env node

const fs = require("fs");
const { execSync } = require("child_process");
const { analyzeCommit } = require("./semantic-version");

// Get the commit message from the commit-msg file
function getCommitMessage() {
  const commitMsgFile = process.argv[2];
  if (!commitMsgFile) {
    console.error("No commit message file provided");
    process.exit(1);
  }

  try {
    return fs.readFileSync(commitMsgFile, "utf8");
  } catch (error) {
    console.error("Error reading commit message file:", error);
    process.exit(1);
  }
}

// Analyze commit message and suggest version increment
function analyzeCommitMessage(commitMessage) {
  const lines = commitMessage.split("\n");
  const subject = lines[0];
  const body = lines.slice(1).join("\n");

  // Create a mock commit line for analysis
  const commitLine = `HEAD|${subject}|${body}`;
  const increment = analyzeCommit(commitLine);

  return { subject, increment };
}

// Get current version
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

// Calculate what the new version would be
function calculateNewVersion(currentVersion, incrementType) {
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

// Main function
function main() {
  const commitMessage = getCommitMessage();
  const { subject, increment } = analyzeCommitMessage(commitMessage);
  const currentVersion = getCurrentVersion();
  const newVersion = calculateNewVersion(currentVersion, increment);

  console.log("\n🔍 Semantic Version Analysis");
  console.log("============================");
  console.log(`Commit: ${subject}`);
  console.log(`Current version: ${currentVersion}`);
  console.log(`Suggested increment: ${increment.toUpperCase()}`);
  console.log(`New version would be: ${newVersion}`);

  // Provide helpful suggestions
  console.log("\n💡 Suggestions:");
  if (increment === "major") {
    console.log("  ⚠️  This is a MAJOR change (breaking change)");
    console.log("  📝 Consider if this really breaks existing functionality");
  } else if (increment === "minor") {
    console.log("  ✨ This is a MINOR change (new feature)");
    console.log("  ✅ Good use of conventional commits!");
  } else {
    console.log("  🔧 This is a PATCH change (bug fix/improvement)");
    console.log("  ✅ Appropriate for this type of change");
  }

  console.log("\n📋 To apply semantic versioning:");
  console.log("  npm run semantic:increment");

  console.log("\n📖 Conventional commit format:");
  console.log("  feat: add new feature (→ minor)");
  console.log("  fix: fix a bug (→ patch)");
  console.log("  docs: update documentation (→ patch)");
  console.log("  BREAKING CHANGE: breaking change (→ major)");

  // Don't block the commit, just provide information
  console.log("\n✅ Commit will proceed with current version");
}

// Run the script
if (require.main === module) {
  main();
}
