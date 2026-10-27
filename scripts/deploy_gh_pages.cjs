const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const tempDir = path.join(process.env.TEMP || 'C:/Users/bsd/AppData/Local/Temp', 'sq-gh-pages-' + Date.now());

console.log('1. Building production assets...');
execSync('npm run build', { stdio: 'inherit' });

console.log('2. Preparing deploy directory at', tempDir);
fs.cpSync('dist', tempDir, { recursive: true });

console.log('3. Initializing git and pushing to gh-pages...');
execSync('git init', { cwd: tempDir, stdio: 'inherit' });
execSync('git remote add origin https://mercy306@github.com/mercy306/shadow-quest.git', { cwd: tempDir, stdio: 'inherit' });
execSync('git checkout -b gh-pages', { cwd: tempDir, stdio: 'inherit' });
execSync('git add -A', { cwd: tempDir, stdio: 'inherit' });
execSync('git commit -m "deploy: update production build on gh-pages"', { cwd: tempDir, stdio: 'inherit' });
execSync('git push -f origin gh-pages', { cwd: tempDir, stdio: 'inherit' });

console.log('4. Cleaning up temp directory...');
fs.rmSync(tempDir, { recursive: true, force: true });

console.log('🎉 Successfully published production build to gh-pages branch!');
