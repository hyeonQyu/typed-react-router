# Scripts

This folder contains automation scripts for project management.

## Publishing Workflow

### 1. Update Version

```bash
yarn version:update <new-version>
```

**Example:**
```bash
yarn version:update 0.2.0
```

This command updates the version in the root `package.json`.

### 2. Publish Packages

```bash
yarn publish
```

This command automatically performs the following tasks:

1. Apply the root `package.json` version to all packages (`core`, `next`, `react`)
2. Replace `workspace:*` with actual versions (e.g., `^0.2.0`) in each package's `dependencies`
3. Build all packages (`yarn build`)
4. Publish each package to npm
5. Restore all `package.json` files to their original state (revert to `workspace:*`) after publishing

## Complete Publishing Process Example

```bash
# 1. Update version
yarn version:update 0.2.0

# 2. Review changes
git diff

# 3. Publish (automatically builds + publishes + restores)
yarn publish

# 4. Commit and tag in Git
git add .
git commit -m "chore: release v0.2.0"
git tag v0.2.0
git push origin main --tags
```

## Script Details

### `version.js`

A script that updates the version in the root `package.json`.

- **Input:** New version number
- **Output:** Updated root `package.json`
- **Format:** `X.Y.Z` or `X.Y.Z-tag` (e.g., `1.0.0`, `1.0.0-beta.1`)

### `publish.js`

A script that publishes all packages to npm.

**Automated tasks:**

1. **Version sync**: Apply root version to all packages
2. **Dependency transformation**: `workspace:*` → `^X.Y.Z`
3. **Build**: Parallel build using Turbo
4. **Publish**: Sequential publish to npm
5. **Restore**: Restore all `package.json` files to their original state

**Error handling:**
- If an error occurs during publishing, automatically restores all files to their original state
- Outputs error message and exits

## Important Notes

1. Always run tests before publishing
2. Make sure you're logged in to npm (`npm whoami`)
3. It's recommended to commit to git and create a tag after publishing

