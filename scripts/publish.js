#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const PACKAGE_NAMES = ['core', 'next', 'react'];

const getRootVersion = () => {
  const rootPackageJson = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf-8')
  );
  return rootPackageJson.version;
}

const readPackageJson = (packageName) => {
  const packagePath = path.join(PACKAGES_DIR, packageName, 'package.json');
  return {
    path: packagePath,
    data: JSON.parse(fs.readFileSync(packagePath, 'utf-8')),
  };
}

const writePackageJson = (packagePath, data) => {
  fs.writeFileSync(packagePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}


const replaceWorkspaceWithVersion = (dependencies, version) => {
  if (!dependencies) return dependencies;
  
  const updated = { ...dependencies };
  for (const [key, value] of Object.entries(updated)) {
    if (value === 'workspace:*') {
      updated[key] = `^${version}`;
    }
  }
  return updated;
}

const main = async () => {
  const version = getRootVersion();
  console.log(`📦 Publishing version: ${version}`);

  const originalPackages = [];

  try {
    // 1. 모든 패키지의 버전 업데이트 및 workspace:* 제거
    console.log('\n🔄 Preparing packages for publish...');
    for (const packageName of PACKAGE_NAMES) {
      const { path: packagePath, data } = readPackageJson(packageName);
      
      // 원본 저장
      originalPackages.push({ path: packagePath, data: { ...data } });

      // 버전 업데이트
      data.version = version;

      // dependencies의 workspace:* 를 실제 버전으로 변경
      if (data.dependencies) {
        data.dependencies = replaceWorkspaceWithVersion(data.dependencies, version);
      }

      writePackageJson(packagePath, data);
      console.log(`  ✓ Updated ${packageName}`);
    }

    // 2. 빌드
    console.log('\n🔨 Building packages...');
    execSync('yarn build', { cwd: ROOT_DIR, stdio: 'inherit' });

    // 3. 배포
    console.log('\n🚀 Publishing packages...');
    for (const packageName of PACKAGE_NAMES) {
      const packageDir = path.join(PACKAGES_DIR, packageName);
      console.log(`  Publishing @hyeonqyu/typed-router-${packageName}...`);
      execSync('yarn npm publish --access public', {
        cwd: packageDir,
        stdio: 'inherit',
      });
    }

    console.log('\n✅ All packages published successfully!');
  } catch (error) {
    console.error('\n❌ Error during publish:', error.message);
    process.exit(1);
  } finally {
    // 4. 원본 복구
    console.log('\n🔄 Restoring original package.json files...');
    for (const { path: packagePath, data } of originalPackages) {
      writePackageJson(packagePath, data);
    }
    console.log('  ✓ Restored all package.json files');
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

