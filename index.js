// Azure App Service entry point for BeAware.fyi
// This file is required by Azure's default Node.js startup process

import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('=== Azure App Service Starting BeAware.fyi ===');
console.log('Node version:', process.version);
console.log('Working directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV || 'development');

// Check if TypeScript server file exists
if (!existsSync('server/index.ts')) {
  console.error('Server file not found: server/index.ts');
  process.exit(1);
}

// Set production environment
process.env.NODE_ENV = 'production';

// Azure App Service sets PORT to 8080 by default
const port = process.env.PORT || 8080;
console.log('Starting server on port:', port);

// Try multiple approaches to start the TypeScript server
console.log('Attempting to start TypeScript server...');

// Method 1: Try using node with tsx loader directly
console.log('Method 1: Using node with tsx/esm loader');
const serverProcess = spawn('node', ['--import', 'tsx/esm', 'server/index.ts'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: port
  }
});

serverProcess.on('error', (err) => {
  console.error('Method 1 failed:', err.message);
  tryMethod2();
});

serverProcess.on('exit', (code, signal) => {
  console.log(`Method 1 exited with code ${code} and signal ${signal}`);
  if (code !== 0 && code !== null) {
    console.error('Method 1 failed, trying Method 2...');
    tryMethod2();
  } else {
    console.log('Server started successfully with Method 1');
  }
});

function tryMethod2() {
  console.log('Method 2: Using npx tsx directly');
  const serverProcess2 = spawn('npx', ['tsx', 'server/index.ts'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: port
    }
  });

  serverProcess2.on('error', (err) => {
    console.error('Method 2 failed:', err.message);
    tryMethod3();
  });

  serverProcess2.on('exit', (code, signal) => {
    console.log(`Method 2 exited with code ${code} and signal ${signal}`);
    if (code !== 0 && code !== null) {
      console.error('Method 2 failed, trying Method 3...');
      tryMethod3();
    } else {
      console.log('Server started successfully with Method 2');
    }
  });
}

function tryMethod3() {
  console.log('Method 3: Compiling TypeScript first then running JavaScript');
  
  try {
    // Try to compile TypeScript to JavaScript
    execSync('npx tsc server/index.ts --outDir ./compiled --module ESNext --target ES2020 --moduleResolution node', { stdio: 'inherit' });
    console.log('TypeScript compilation successful');
    
    const serverProcess3 = spawn('node', ['compiled/server/index.js'], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: port
      }
    });

    serverProcess3.on('error', (err) => {
      console.error('Method 3 failed:', err.message);
      console.error('All startup methods failed. Please check your Azure environment configuration.');
      process.exit(1);
    });

    serverProcess3.on('exit', (code, signal) => {
      console.log(`Method 3 exited with code ${code} and signal ${signal}`);
      if (code !== 0 && code !== null) {
        console.error('All startup methods failed. The application could not start.');
        process.exit(code);
      } else {
        console.log('Server started successfully with Method 3');
      }
    });
  } catch (compileError) {
    console.error('TypeScript compilation failed:', compileError.message);
    console.error('All startup methods exhausted. Application startup failed.');
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

console.log('Entry point setup complete, waiting for server to start...');