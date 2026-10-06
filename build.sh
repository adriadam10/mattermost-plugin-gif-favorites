#!/bin/sh
# Builds dist/<plugin-id>-<version>.tar.gz inside a Node container, so only Docker is needed.
# In CI (CI=true) Node is already there and runs directly.
set -eu
cd "$(dirname "$0")"

steps='npm ci --no-audit --no-fund && npm test && npm run build'
if [ "${CI:-}" = true ]; then
    (cd webapp && sh -c "$steps")
else
    docker run --rm -u "$(id -u):$(id -g)" -e HOME=/tmp -v "$PWD:/src" -w /src/webapp node:22-alpine sh -c "$steps"
fi

id=$(sed -n 's/^ *"id": *"\([^"]*\)".*/\1/p' plugin.json)
version=$(sed -n 's/^ *"version": *"\([^"]*\)".*/\1/p' plugin.json)

rm -rf dist && mkdir -p "dist/$id/webapp"
cp plugin.json "dist/$id/"
cp -r webapp/dist "dist/$id/webapp/"
tar -czf "dist/$id-$version.tar.gz" -C dist "$id"
rm -rf "dist/$id"
echo "dist/$id-$version.tar.gz"
