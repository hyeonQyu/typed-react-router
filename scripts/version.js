#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const ROOT_PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const PACKAGE_NAMES = ['core', 'next', 'react'];

const updateVersion = (newVersion) => {
  // Update root package.json
  const rootPackageJson = JSON.parse(fs.readFileSync(ROOT_PACKAGE_JSON_PATH, 'utf-8'));
  const oldVersion = rootPackageJson.version;
  rootPackageJson.version = newVersion;

  fs.writeFileSync(ROOT_PACKAGE_JSON_PATH, JSON.stringify(rootPackageJson, null, 2) + '\n', 'utf-8');

  console.log(`✅ Root version updated: ${oldVersion} → ${newVersion}`);

  // Update all package versions
  console.log('\n📦 Updating package versions...');
  PACKAGE_NAMES.forEach((packageName) => {
    const packagePath = path.join(PACKAGES_DIR, packageName, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    packageJson.version = newVersion;

    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');

    console.log(`  ✓ Updated @hyeonqyu/typed-router-${packageName}`);
  });

  console.log(`\n✅ All versions updated to ${newVersion}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review changes: git diff`);
  console.log(`  2. Build packages: yarn build`);
  console.log(`  3. Commit changes: git add . && git commit -m "chore: bump version to ${newVersion}"`);
  console.log(`  4. Publish: yarn publish`);
};

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Error: Version argument required');
  console.log('\nUsage:');
  console.log('  yarn bump <version>');
  console.log('\nExample:');
  console.log('  yarn bump 1.0.2');
  process.exit(1);
}

const newVersion = args[0];

if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(newVersion)) {
  console.error(`❌ Error: Invalid version format: ${newVersion}`);
  console.log('Expected format: X.Y.Z or X.Y.Z-tag');
  process.exit(1);
}

updateVersion(newVersion);
