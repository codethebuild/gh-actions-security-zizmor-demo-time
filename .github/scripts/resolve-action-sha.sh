#!/usr/bin/env bash
#
# resolve-action-sha.sh - Resolve GitHub Action references to commit SHAs
#
# Usage: ./resolve-action-sha.sh owner/repo@ref
# Example: ./resolve-action-sha.sh actions/checkout@v6
#
# Output format: SHA # version
# Example: de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log errors
error() {
    echo -e "${RED}ERROR: $*${NC}" >&2
}

# Function to log info
info() {
    echo -e "${GREEN}INFO: $*${NC}" >&2
}

# Function to log warnings
warn() {
    echo -e "${YELLOW}WARN: $*${NC}" >&2
}

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    error "gh CLI is not installed. Please install it from https://cli.github.com/"
    exit 1
fi

# Check if gh is authenticated
if ! gh auth status &> /dev/null; then
    error "gh CLI is not authenticated. Run 'gh auth login' first."
    exit 1
fi

# Parse input
if [ $# -eq 0 ]; then
    error "Usage: $0 owner/repo@ref"
    exit 1
fi

INPUT="$1"

# Extract owner, repo, and ref
if [[ ! "$INPUT" =~ ^([^/]+)/([^@]+)@(.+)$ ]]; then
    error "Invalid format. Expected: owner/repo@ref"
    exit 1
fi

OWNER="${BASH_REMATCH[1]}"
REPO="${BASH_REMATCH[2]}"
REF="${BASH_REMATCH[3]}"

info "Resolving: $OWNER/$REPO@$REF"

# Check if ref is already a SHA (40 hex characters)
if [[ "$REF" =~ ^[0-9a-f]{40}$ ]]; then
    info "Already a SHA, no resolution needed"
    echo "$REF # already-pinned"
    exit 0
fi

# Function to get latest patch version for a major version
get_latest_patch_version() {
    local major_version="$1"
    local owner="$2"
    local repo="$3"

    info "Finding latest patch version for $major_version..."

    # Get all tags matching the major version pattern
    local latest_tag
    latest_tag=$(gh api "repos/$owner/$repo/tags" --paginate --jq \
        "[.[] | select(.name | test(\"^$major_version\\\\.\")) | .name] | sort_by(split(\".\") | map(tonumber? // 0)) | last" 2>/dev/null)

    if [ -z "$latest_tag" ] || [ "$latest_tag" = "null" ]; then
        # Try without the 'v' prefix
        latest_tag=$(gh api "repos/$owner/$repo/tags" --paginate --jq \
            "[.[] | select(.name | test(\"^${major_version#v}\\\\.\")) | .name] | sort_by(split(\".\") | map(tonumber? // 0)) | last" 2>/dev/null)
    fi

    if [ -z "$latest_tag" ] || [ "$latest_tag" = "null" ]; then
        warn "No tags found matching pattern $major_version.*"
        echo "$major_version"
    else
        info "Latest patch version: $latest_tag"
        echo "$latest_tag"
    fi
}

# Determine the version to resolve
VERSION_TO_RESOLVE="$REF"

# If ref is a mutable major/minor version (e.g., v6, v1), find latest patch
if [[ "$REF" =~ ^v?[0-9]+$ ]]; then
    # Major version only (e.g., v6 or 6)
    VERSION_TO_RESOLVE=$(get_latest_patch_version "$REF" "$OWNER" "$REPO")
elif [[ "$REF" =~ ^v?[0-9]+\.[0-9]+$ ]]; then
    # Major.minor version (e.g., v6.0 or 6.0)
    VERSION_TO_RESOLVE=$(get_latest_patch_version "$REF" "$OWNER" "$REPO")
fi

info "Resolving version: $VERSION_TO_RESOLVE"

# Get the SHA for the resolved version
SHA=$(gh api "repos/$OWNER/$REPO/commits/$VERSION_TO_RESOLVE" --jq '.sha' 2>/dev/null)

if [ -z "$SHA" ] || [ "$SHA" = "null" ]; then
    error "Failed to resolve $OWNER/$REPO@$VERSION_TO_RESOLVE to a SHA"
    exit 1
fi

info "Resolved SHA: $SHA"

# Output in the format: SHA # version
echo "$SHA # $VERSION_TO_RESOLVE"
