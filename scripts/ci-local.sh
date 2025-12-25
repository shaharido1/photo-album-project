#!/bin/bash
# Run the full CI pipeline locally using Docker
# This mirrors what GitHub Actions runs before deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

echo "🚀 Running CI pipeline locally..."
echo "=================================="
echo ""
echo "This will run:"
echo "  1. TypeScript typecheck"
echo "  2. ESLint"
echo "  3. Prettier check"
echo "  4. Server unit tests"
echo "  5. Client unit tests"
echo "  6. E2E tests (Playwright)"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Build and run the CI Dockerfile
echo "📦 Building CI container..."
echo ""

if docker build -f Dockerfile.ci -t photo-album-ci:local . ; then
    echo ""
    echo "=================================="
    echo "✅ All CI checks passed!"
    echo "=================================="
    echo ""
    echo "Safe to push to main branch."
else
    echo ""
    echo "=================================="
    echo "❌ CI checks failed!"
    echo "=================================="
    echo ""
    echo "Fix the issues above before pushing."
    exit 1
fi
