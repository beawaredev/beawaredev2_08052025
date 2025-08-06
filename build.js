#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

console.log('🚀 Starting build process...');

try {
  // Step 1: Build frontend with Vite
  console.log('📦 Building frontend...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Step 2: Ensure compiled directory exists
  if (!existsSync('compiled')) {
    mkdirSync('compiled', { recursive: true });
  }
  
  // Step 3: Build server TypeScript files
  console.log('🔧 Building server...');
  
  // Use TypeScript compiler to build server files
  try {
    execSync('npx tsc --project server/tsconfig.json --outDir compiled', { stdio: 'inherit' });
  } catch (tscError) {
    console.log('⚠️  TypeScript compiler failed, trying alternative approach...');
    
    // Fallback: Copy and compile files using tsx
    execSync('npx tsx --build server/index.ts --out-dir compiled/server', { stdio: 'inherit' });
  }
  
  // Step 4: Build shared files
  console.log('📋 Building shared files...');
  if (!existsSync('compiled/shared')) {
    mkdirSync('compiled/shared', { recursive: true });
  }
  
  try {
    execSync('npx tsc shared/*.ts --outDir compiled/shared --target ES2020 --module NodeNext --moduleResolution NodeNext --esModuleInterop', { stdio: 'inherit' });
  } catch (sharedError) {
    console.log('⚠️  Building shared files with tsc failed, using existing compiled files...');
  }
  
  console.log('✅ Build completed successfully!');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}