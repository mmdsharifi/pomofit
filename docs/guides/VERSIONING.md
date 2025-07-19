# Semantic Versioning (SemVer 2.0.0) for PomoFit

This document explains how semantic versioning is implemented in the PomoFit application.

## Overview

PomoFit follows [Semantic Versioning 2.0.0](https://semver.org/) standards for version management. The version format is `MAJOR.MINOR.PATCH` (e.g., `1.2.3`).

## Version Components

- **MAJOR**: Incompatible API changes or breaking changes
- **MINOR**: New functionality added in a backward-compatible manner
- **PATCH**: Backward-compatible bug fixes

## Automatic Versioning

### GitHub Actions Workflow

The `.github/workflows/version-and-deploy.yml` workflow automatically:

1. **Analyzes commit messages** to determine version bump type
2. **Increments version** based on conventional commit format
3. **Creates GitHub releases** with release notes
4. **Deploys to Vercel** with the new version
5. **Updates version display** in the app

### Commit Message Analysis

The workflow analyzes commit messages since the last tag:

- **Major version** (`1.0.0` → `2.0.0`): Contains `BREAKING CHANGE` or `!:` in commit messages
- **Minor version** (`1.1.0` → `1.2.0`): Contains `feat:` in commit messages
- **Patch version** (`1.1.1` → `1.1.2`): Default for all other changes

## Conventional Commit Format

Use this format for commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or changes
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes
- `revert`: Revert previous commits

### Examples

```bash
# New feature (minor version bump)
git commit -m "feat: add dark mode support"

# Bug fix (patch version bump)
git commit -m "fix(timer): resolve timer pause issue"

# Breaking change (major version bump)
git commit -m "feat!: change API response format"

# Documentation update (patch version bump)
git commit -m "docs: update README with new features"
```

## Manual Version Management

### NPM Scripts

```bash
# Show current version
npm run version:show

# Bump patch version (1.1.1 → 1.1.2)
npm run version:patch

# Bump minor version (1.1.1 → 1.2.0)
npm run version:minor

# Bump major version (1.1.1 → 2.0.0)
npm run version:major

# Build and bump patch version
npm run release
```

### Manual Version Bump

```bash
# Using npm version
npm version patch   # 1.1.1 → 1.1.2
npm version minor   # 1.1.1 → 1.2.0
npm version major   # 1.1.1 → 2.0.0

# Using npm version with custom version
npm version 1.2.3
```

## Version Display in App

The current version is displayed in the Settings page with:

- **Version number** (e.g., `v1.2.3`)
- **Build date** (when the app was built)
- **Commit hash** (Git commit identifier)
- **Last modified date** (when the version was last updated)

### Version Information Location

- **Settings Page**: Bottom of the settings page
- **Component**: `components/version-display.tsx`
- **Utility**: `lib/version.ts`

## Pre-commit Hook

The `scripts/prepare-commit-msg.sh` script provides a template for conventional commit messages. To enable it:

```bash
# Copy the script to .git/hooks
cp scripts/prepare-commit-msg.sh .git/hooks/prepare-commit-msg

# Make it executable
chmod +x .git/hooks/prepare-commit-msg
```

## GitHub Secrets Required

For the automated workflow to work, you need these GitHub secrets:

- `VERCEL_TOKEN`: Your Vercel deployment token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

## Release Process

1. **Develop**: Make changes with conventional commit messages
2. **Push**: Push to main branch
3. **Automated**: GitHub Actions analyzes commits and bumps version
4. **Release**: GitHub release is created automatically
5. **Deploy**: App is deployed to Vercel with new version
6. **Display**: Version is shown in app settings

## Version History

All version changes are tracked in:

- `package.json`: Current version
- `package-lock.json`: Locked dependency versions
- `lib/version.ts`: Version utility functions
- GitHub Releases: Release notes and downloads

## Best Practices

1. **Use conventional commits**: Always use the conventional commit format
2. **Test before pushing**: Ensure tests pass before pushing to main
3. **Review releases**: Check GitHub releases for accuracy
4. **Document breaking changes**: Use `BREAKING CHANGE:` in commit body for major versions
5. **Keep version display updated**: The version display should always show the current version

## Troubleshooting

### Version Not Updating

1. Check if commit messages follow conventional format
2. Verify GitHub Actions workflow is running
3. Check GitHub secrets are configured correctly
4. Ensure you're pushing to the main branch

### Version Display Issues

1. Check `lib/version.ts` for correct version logic
2. Verify `components/version-display.tsx` is properly imported
3. Check browser console for any errors
4. Ensure the version component is rendered in settings

### Manual Version Override

If you need to manually set a version:

```bash
# Update package.json
npm version 1.2.3

# Update lib/version.ts manually
# Commit and push changes
git add .
git commit -m "chore: manually set version to 1.2.3"
git push
```
