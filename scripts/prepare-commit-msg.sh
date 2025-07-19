#!/bin/bash

# Pre-commit hook to help with conventional commit messages
# This script adds a template to the commit message

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2
SHA1=$3

# Only add template if this is a new commit (not a merge, revert, etc.)
if [ "$COMMIT_SOURCE" = "message" ] || [ -z "$COMMIT_SOURCE" ]; then
    # Check if the commit message already has a conventional format
    if ! grep -qE "^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\(.+\))?: " "$COMMIT_MSG_FILE"; then
        # Add conventional commit template
        cat > "$COMMIT_MSG_FILE" << 'EOF'
# Conventional Commit Message Format
# 
# <type>(<scope>): <description>
# 
# [optional body]
# 
# [optional footer(s)]
# 
# Types:
#   feat     - A new feature
#   fix      - A bug fix
#   docs     - Documentation only changes
#   style    - Changes that do not affect the meaning of the code
#   refactor - A code change that neither fixes a bug nor adds a feature
#   perf     - A code change that improves performance
#   test     - Adding missing tests or correcting existing tests
#   chore    - Changes to the build process or auxiliary tools
#   ci       - Changes to CI configuration files and scripts
#   build    - Changes that affect the build system or external dependencies
#   revert   - Reverts a previous commit
# 
# Examples:
#   feat: add user authentication
#   fix(auth): resolve login timeout issue
#   docs: update README with new features
#   style: format code according to style guide
#   refactor(timer): optimize timer performance
#   perf: improve app loading speed
#   test: add unit tests for timer component
#   chore: update dependencies
#   ci: add automated testing workflow
#   build: update webpack configuration
#   revert: revert to previous version
# 
# Breaking Changes:
#   Use ! after type/scope to indicate breaking change
#   Example: feat!: breaking change in API
# 
# Footer:
#   BREAKING CHANGE: <description>
#   Closes #<issue-number>
# 
# Write your commit message above this line:
EOF
    fi
fi 