#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const ROOT_PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

const updateVersion = (newVersion) => {
  const packageJson = JSON.parse(fs.readFileSync(ROOT_PACKAGE_JSON_PATH, 'utf-8'));
  
  const oldVersion = packageJson.version;
  packageJson.version = newVersion;
  
  fs.writeFileSync(
    ROOT_PACKAGE_JSON_PATH,
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf-8'
  );
  
  console.log(`✅ Version updated: ${oldVersion} → ${newVersion}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review changes`);
  console.log(`  2. Run: yarn publish`);
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Error: Version argument required');
  console.log('\nUsage:');
  console.log('  yarn version:update <version>');
  console.log('\nExample:');
  console.log('  yarn version:update 0.2.0');
  process.exit(1);
}

const newVersion = args[0];

// 버전 형식 검증
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(newVersion)) {
  console.error(`❌ Error: Invalid version format: ${newVersion}`);
  console.log('Expected format: X.Y.Z or X.Y.Z-tag');
  process.exit(1);
}

updateVersion(newVersion);

