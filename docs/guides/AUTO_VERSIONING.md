# Auto-Versioning System

## Overview

The Pomofit application now includes a comprehensive auto-versioning system that automatically tracks changes and updates version numbers in real-time. This ensures that every meaningful change to the codebase is reflected in the version number, making it truly useful for tracking application updates.

## How It Works

### 1. **Real-Time Version Tracking**

- **File Watcher**: Monitors all relevant files for changes
- **Auto-Increment**: Automatically increments version numbers when files change
- **Build Numbers**: Tracks build timestamps and change counts
- **Git Integration**: Uses commit hashes and Git information

### 2. **Version Format**

The version format follows: `MAJOR.MINOR.PATCH.BUILD.CHANGES`

- **MAJOR.MINOR.PATCH**: From package.json (manual control)
- **BUILD**: Timestamp-based build number
- **CHANGES**: Number of file changes since last reset

Example: `1.2.3.1703123456.42`

### 3. **Change Detection**

The system monitors these directories for changes:

- `app/**/*` - Next.js app directory
- `components/**/*` - React components
- `lib/**/*` - Utility libraries
- `hooks/**/*` - Custom React hooks
- `types/**/*` - TypeScript type definitions
- `public/**/*` - Static assets
- `styles/**/*` - CSS and styling files

## Usage

### Development Mode with Auto-Versioning

```bash
# Start development server with auto-versioning
npm run dev:watch

# This runs both the dev server and file watcher
```

### Manual Version Control

```bash
# Initialize version tracking
npm run version:init

# Start file watcher only
npm run version:watch

# Check current version status
npm run version:status

# Reset version tracking
npm run version:reset

# Manually increment version
npm run version:increment patch
npm run version:increment minor
npm run version:increment major
```

### Git Integration

The system includes a pre-commit hook that automatically increments versions when relevant files are committed:

```bash
# The pre-commit hook runs automatically on git commit
git add .
git commit -m "Add new feature"  # Version automatically incremented
```

## Configuration

### File Patterns

You can customize which files trigger version updates by modifying `scripts/auto-version.js`:

```javascript
const WATCH_PATTERNS = [
  "app/**/*",
  "components/**/*",
  "lib/**/*",
  // Add your custom patterns
];

const IGNORE_PATTERNS = [
  "**/node_modules/**",
  "**/*.test.*",
  "**/*.spec.*",
  // Add patterns to ignore
];
```

### Debounce Settings

Control how frequently version updates occur:

```javascript
const CHANGE_DEBOUNCE = 5000; // 5 seconds between updates
```

## Version Display

The version information is displayed in the UI with:

- **Main Version**: `v1.2.3.1703123456.42 (Dec 15, 2024, 10:30 AM)`
- **Build Number**: Timestamp-based identifier
- **Change Count**: Number of file changes
- **Commit Hash**: Git commit identifier

## Storage

### Client-Side Storage

Version information is stored in localStorage:

- `pomofit-build-number`: Current build number
- `pomofit-change-count`: Number of changes
- `pomofit-last-change`: Timestamp of last change
- `pomofit-build-date`: Build date
- `pomofit-version-history`: Version change history

### Server-Side Files

- `.version-info.json`: Current version information
- `.change-log.json`: Detailed change log

## Benefits

### 1. **Real-Time Tracking**

- Every file change is immediately reflected in the version
- No more static version numbers that don't represent actual changes

### 2. **Development Workflow**

- Automatic version increments during development
- Clear tracking of what changes are included in each version

### 3. **Debugging and Support**

- Easy to identify which version a user is running
- Detailed change logs for troubleshooting

### 4. **Deployment Tracking**

- Build numbers help track different deployments
- Change counts show activity level

## Troubleshooting

### Version Not Updating

1. Check if file watcher is running: `npm run version:status`
2. Verify file is in watched directories
3. Check for ignored patterns

### Reset Version Tracking

```bash
npm run version:reset
```

### Manual Version Override

```bash
# Edit package.json version manually
npm run version:increment patch
```

## Integration with CI/CD

For production deployments, the system integrates with:

- **Vercel**: Uses `VERCEL_GIT_COMMIT_SHA`
- **GitHub Actions**: Uses `GITHUB_SHA`
- **Custom Builds**: Uses `GIT_COMMIT_SHA`

## Best Practices

1. **Use `npm run dev:watch`** for development to get auto-versioning
2. **Commit frequently** to maintain accurate version tracking
3. **Review version info** before releases
4. **Reset version tracking** when starting major features
5. **Use semantic versioning** for major/minor releases

## Migration from Static Versioning

If you're migrating from the old static versioning:

1. Run `npm run version:init` to initialize tracking
2. Update your deployment scripts to use the new version format
3. Update any external version references
4. Test the auto-versioning in development

## Future Enhancements

- **Semantic Change Detection**: Automatically detect major/minor changes
- **Release Notes Generation**: Auto-generate release notes from changes
- **Version Comparison**: Compare versions across environments
- **Rollback Support**: Version rollback capabilities
