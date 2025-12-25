#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const PACKAGE_NAMES = ['core', 'next', 'react'];

const getRootVersion = () => {
  const rootPackageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
  return rootPackageJson.version;
};

const readPackageJson = (packageName) => {
  const packagePath = path.join(PACKAGES_DIR, packageName, 'package.json');
  return {
    path: packagePath,
    data: JSON.parse(fs.readFileSync(packagePath, 'utf-8')),
  };
};

const writePackageJson = (packagePath, data) => {
  fs.writeFileSync(packagePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
};

const replaceWorkspaceWithVersion = (dependencies, version) => {
  if (!dependencies) return dependencies;

  return Object.entries(dependencies).reduce((acc, [key, value]) => {
    acc[key] = value === 'workspace:*' ? `^${version}` : value;
    return acc;
  }, {});
};

const preparePackagesForPublish = (version, originalPackages) => {
  console.log('\n🔄 Preparing packages for publish...');

  PACKAGE_NAMES.forEach((packageName) => {
    const { path: packagePath, data } = readPackageJson(packageName);

    originalPackages.push({ path: packagePath, data: { ...data } });

    data.version = version;

    if (data.dependencies) {
      data.dependencies = replaceWorkspaceWithVersion(data.dependencies, version);
    }

    writePackageJson(packagePath, data);
    console.log(`  ✓ Updated ${packageName}`);
  });
};

const checkAuthentication = () => {
  console.log('\n🔐 Checking npm authentication...');
  try {
    execSync('yarn npm whoami', { cwd: ROOT_DIR, stdio: 'pipe' });
    console.log('  ✓ Already authenticated');
  } catch {
    console.log('  ⚠️  Not authenticated. Please login to npm.');
    console.log('\n🔑 Running npm login...\n');
    execSync('yarn npm login', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('\n  ✓ Authentication successful');
  }
};

const buildPackages = () => {
  console.log('\n🔨 Building packages...');
  execSync('yarn build', { cwd: ROOT_DIR, stdio: 'inherit' });
};

const publishPackages = () => {
  console.log('\n🚀 Publishing packages...');
  PACKAGE_NAMES.forEach((packageName) => {
    const packageDir = path.join(PACKAGES_DIR, packageName);
    console.log(`  Publishing @hyeonqyu/typed-router-${packageName}...`);
    execSync('yarn npm publish --access public', {
      cwd: packageDir,
      stdio: 'inherit',
    });
  });
};

const restoreOriginalPackages = (originalPackages) => {
  console.log('\n🔄 Restoring original package.json files...');
  originalPackages.forEach(({ path: packagePath, data }) => {
    writePackageJson(packagePath, data);
  });
  console.log('  ✓ Restored all package.json files');
};

const main = async () => {
  const version = getRootVersion();
  console.log(`📦 Publishing version: ${version}`);

  const originalPackages = [];

  try {
    checkAuthentication();
    preparePackagesForPublish(version, originalPackages);
    buildPackages();
    publishPackages();
    console.log('\n✅ All packages published successfully!');
  } catch (error) {
    console.error('\n❌ Error during publish:', error.message);
    process.exit(1);
  } finally {
    restoreOriginalPackages(originalPackages);
  }
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
