#!/usr/bin/env node

/**
 * Development Cache Clear Script
 * Run this script to clear Next.js development cache and force rebuild
 */

const fs = require('fs');
const path = require('path');

const clearDirectory = (dirPath) => {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✅ Cleared: ${dirPath}`);
  } else {
    console.log(`⚠️  Directory not found: ${dirPath}`);
  }
};

console.log('🧹 Clearing Next.js development cache...\n');

// Clear Next.js cache directories
clearDirectory(path.join(__dirname, '.next'));
clearDirectory(path.join(__dirname, 'node_modules', '.cache'));
clearDirectory(path.join(__dirname, '.turbo'));

console.log('\n✨ Cache cleared! Run `npm run dev` to restart with fresh cache.');
console.log('💡 Also consider clearing your browser cache (Ctrl+Shift+R or Cmd+Shift+R)');
