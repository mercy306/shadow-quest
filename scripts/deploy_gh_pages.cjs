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

// 5. Automatic Portfolio & Vercel Sync
const portfolioPath = path.resolve('C:/Users/bsd/Desktop/all in one/New folder 123/portfolio/portfolio');
if (fs.existsSync(portfolioPath)) {
  console.log('5. Syncing portfolio repository for automatic Vercel deployment...');
  try {
    const status = execSync('git status --porcelain components/Projects.tsx', { cwd: portfolioPath, encoding: 'utf8' });
    if (status && status.trim().length > 0) {
      execSync('git add components/Projects.tsx', { cwd: portfolioPath, stdio: 'inherit' });
      execSync('git commit -m "chore(sync): update Shadow Quest Harar Jugol 3D CGI cinematic and gate live project"', { cwd: portfolioPath, stdio: 'inherit' });
      execSync('git push origin main', { cwd: portfolioPath, stdio: 'inherit' });
      console.log('🚀 Successfully pushed portfolio update to GitHub (triggers automatic Vercel deploy)!');
    } else {
      console.log('ℹ️ Portfolio repository is already up to date with Vercel.');
    }
  } catch (err) {
    console.warn('⚠️ Could not automatically push portfolio sync:', err.message);
  }
}
