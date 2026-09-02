# Scripts

This folder contains automation scripts for project management.

## Publishing Workflow

### 1. Update Version

```bash
yarn bump <new-version>
```

**Example:**
```bash
yarn bump 2.1.0
```

This command writes the new version to the root `package.json` and to all three package manifests (`core`, `next`, `react`).

### 2. Publish Packages

```bash
yarn publish
```

This command automatically performs the following tasks:

1. Check npm authentication (`yarn npm whoami`), running `yarn npm login` if you are not logged in
2. Replace any `workspace:*` entry in a package's `dependencies` with `^<that package's version>`
3. Build all packages (`yarn build`)
4. Prompt for an npm OTP, then publish each package to npm
5. Restore all `package.json` files to their original state after publishing

Two things this does **not** do. It publishes whatever version the manifests already carry, so run
`yarn bump` first. And step 2 is a safety net rather than the normal path: the published packages
declare their `@hyeonqyu/typed-router-core` range explicitly (`packages/next` and `packages/react`
both depend on `^X.Y.0`), so raising the minor means raising that range by hand — only
`examples/*`, which are never published, use `workspace:*`.

## Complete Publishing Process Example

```bash
# 1. Update version
yarn bump 2.1.0

# 2. Review changes — including the core range in packages/next and packages/react
git diff

# 3. Publish (checks auth + builds + publishes + restores)
yarn publish

# 4. Commit and tag in Git
git add .
git commit -m "chore: release v2.1.0"
git tag v2.1.0
git push origin develop --tags
```

## Script Details

### `version.js`

A script that updates the version in the root `package.json` and in every package under `packages/`.

- **Input:** New version number
- **Output:** Updated root and per-package `package.json`
- **Format:** `X.Y.Z` or `X.Y.Z-tag` (e.g., `1.0.0`, `1.0.0-beta.1`)

### `publish.js`

A script that publishes all packages to npm.

**Automated tasks:**

1. **Authentication**: Verify the npm login, prompting for one if needed
2. **Dependency transformation**: `workspace:*` → `^X.Y.Z`, for any package that uses the protocol
3. **Build**: Parallel build using Turbo
4. **Publish**: Prompt for an OTP, then publish sequentially to npm
5. **Restore**: Restore all `package.json` files to their original state

**Error handling:**
- If an error occurs during publishing, automatically restores all files to their original state
- Outputs error message and exits

## Important Notes

1. Always run tests before publishing
2. Each package's `files` array decides what ships — a `files` entry that matches nothing is silently skipped, so confirm additions with `npm pack --dry-run` in the package directory
3. It's recommended to commit to git and create a tag after publishing
