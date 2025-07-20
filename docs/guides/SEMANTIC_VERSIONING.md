# Semantic Versioning System

## Overview

The Pomofit application now supports **true semantic versioning** that automatically analyzes commit messages and increments version numbers based on the type of changes made. This ensures that version numbers accurately reflect the impact of changes on users and dependencies.

## How It Works

### Version Format

```
MAJOR.MINOR.PATCH.BUILD.CHANGES
```

- **MAJOR.MINOR.PATCH**: Semantic version (automatically incremented based on commits)
- **BUILD**: Timestamp-based build number
- **CHANGES**: File change counter

### Commit Analysis

The system analyzes commit messages to determine the appropriate version increment:

#### Conventional Commit Types

| Commit Type        | Version Impact | Description              |
| ------------------ | -------------- | ------------------------ |
| `feat:`            | **MINOR**      | New features             |
| `fix:`             | **PATCH**      | Bug fixes                |
| `docs:`            | **PATCH**      | Documentation updates    |
| `style:`           | **PATCH**      | Code style changes       |
| `refactor:`        | **PATCH**      | Code refactoring         |
| `perf:`            | **PATCH**      | Performance improvements |
| `test:`            | **PATCH**      | Adding tests             |
| `chore:`           | **PATCH**      | Maintenance tasks        |
| `ci:`              | **PATCH**      | CI/CD changes            |
| `build:`           | **PATCH**      | Build system changes     |
| `revert:`          | **PATCH**      | Reverting changes        |
| `BREAKING CHANGE:` | **MAJOR**      | Breaking changes         |

#### Breaking Changes

Breaking changes trigger a **MAJOR** version increment:

```bash
# In commit message
feat: add new API endpoint

BREAKING CHANGE: This change removes the old API endpoint
```

## Usage

### Initialize Semantic Versioning

```bash
npm run semantic:init
```

This sets up the semantic versioning system with your current version.

### Analyze Commits

Check what version increment your recent commits would trigger:

```bash
npm run semantic:analyze
```

**Example Output:**

```
🔍 Analyzing commit history for semantic versioning...

Current version: 0.1.0.1752996939.0

Recent commits:
  MINOR: feat(ui): redesign history item component layout
  PATCH: fix(timer): resolve localStorage access issue
  PATCH: docs: update README with new features

📈 Suggested increment: MINOR
🆕 New version: 0.2.0.1752997000.0
```

### Increment Version

Apply semantic versioning based on commit analysis:

```bash
npm run semantic:increment
```

This will:

1. Analyze recent commits
2. Determine appropriate version increment
3. Update `package.json`
4. Update version info files
5. Show detailed report

### Check Status

View current semantic version status:

```bash
npm run semantic:status
```

**Example Output:**

```
📦 Semantic Version Status

Current version: 0.1.0.1752996939.0
Semantic version: 0.1.0
Build number: 1752996939
Change count: 0

📋 Recent commit analysis:
  MINOR: feat(ui): redesign history item component layout
  PATCH: fix(timer): resolve localStorage access issue
  PATCH: docs: update README with new features
```

## Commit Message Guidelines

### Conventional Commit Format

```
type(scope): description

[optional body]

[optional footer(s)]
```

### Examples

#### New Feature (MINOR)

```bash
git commit -m "feat(ui): add dark mode toggle

- Add theme switcher component
- Implement theme persistence
- Update color scheme variables"
```

#### Bug Fix (PATCH)

```bash
git commit -m "fix(timer): resolve localStorage access issue

- Add error handling for localStorage
- Implement fallback for private browsing
- Fix timer state persistence"
```

#### Breaking Change (MAJOR)

```bash
git commit -m "feat(api): redesign authentication system

- Replace JWT with session-based auth
- Update all API endpoints
- Remove deprecated auth methods

BREAKING CHANGE: All existing API tokens will be invalidated"
```

#### Documentation Update (PATCH)

```bash
git commit -m "docs: update installation guide

- Add Docker setup instructions
- Include troubleshooting section
- Update dependency versions"
```

## Integration with Auto-Versioning

The semantic versioning system works alongside the existing auto-versioning:

### Development Workflow

1. **During Development**: Auto-versioning tracks file changes
2. **Before Commit**: Pre-commit hook analyzes commit message
3. **After Commit**: Semantic versioning can be applied

### Commands Comparison

| Auto-Versioning             | Semantic Versioning          |
| --------------------------- | ---------------------------- |
| `npm run version:watch`     | `npm run semantic:analyze`   |
| `npm run version:status`    | `npm run semantic:status`    |
| `npm run version:increment` | `npm run semantic:increment` |

## Best Practices

### 1. Use Conventional Commits

Always use the conventional commit format:

```bash
# ✅ Good
git commit -m "feat(timer): add pause functionality"

# ❌ Avoid
git commit -m "added pause button"
```

### 2. Be Specific with Scopes

Use scopes to indicate which part of the codebase changed:

```bash
# ✅ Good
git commit -m "feat(ui): add dark mode"
git commit -m "fix(api): resolve authentication bug"
git commit -m "docs(guide): update installation steps"

# ❌ Avoid
git commit -m "feat: add dark mode"
```

### 3. Write Descriptive Messages

Provide clear, concise descriptions:

```bash
# ✅ Good
git commit -m "fix(timer): prevent negative time values"

# ❌ Avoid
git commit -m "fix: bug"
```

### 4. Use Breaking Change Notation

Always mark breaking changes clearly:

```bash
git commit -m "feat(api): redesign user endpoints

BREAKING CHANGE: User API endpoints now require authentication"
```

### 5. Regular Version Updates

Run semantic versioning regularly:

```bash
# After completing a feature
npm run semantic:increment

# Before releases
npm run semantic:analyze
npm run semantic:increment
```

## Troubleshooting

### Common Issues

#### 1. Version Not Incrementing

**Problem**: Semantic versioning doesn't detect changes.

**Solution**: Ensure commits use conventional format:

```bash
git commit -m "feat: add new feature"
```

#### 2. Wrong Increment Type

**Problem**: System suggests wrong version increment.

**Solution**: Check commit message format and use appropriate type:

```bash
# For new features
git commit -m "feat: add feature"

# For bug fixes
git commit -m "fix: resolve bug"

# For breaking changes
git commit -m "feat: new API

BREAKING CHANGE: Old API removed"
```

#### 3. Git History Issues

**Problem**: Can't analyze git history.

**Solution**: Ensure you're in a git repository:

```bash
git status
npm run semantic:analyze
```

### Debugging

Enable verbose output:

```bash
# Check current version
npm run semantic:status

# Analyze specific commits
git log --oneline -5
npm run semantic:analyze
```

## Migration from Auto-Versioning

If you're currently using auto-versioning and want to switch to semantic versioning:

1. **Initialize semantic versioning**:

   ```bash
   npm run semantic:init
   ```

2. **Update commit messages** to use conventional format

3. **Run semantic analysis**:

   ```bash
   npm run semantic:analyze
   ```

4. **Apply semantic versioning**:
   ```bash
   npm run semantic:increment
   ```

## Benefits

### 1. **Accurate Version Numbers**

- Version numbers reflect actual change impact
- Users know what to expect from updates

### 2. **Automated Workflow**

- No manual version management
- Consistent version increments

### 3. **Clear Communication**

- Commit messages clearly indicate change types
- Better collaboration and code review

### 4. **Release Management**

- Easy to identify breaking changes
- Simplified dependency management

### 5. **Professional Standards**

- Follows industry best practices
- Compatible with CI/CD systems

## Integration with CI/CD

The semantic versioning system can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Semantic Versioning
  run: |
    npm run semantic:analyze
    npm run semantic:increment
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

This ensures that version numbers are automatically updated in production releases.
