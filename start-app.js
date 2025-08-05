import { spawn } from 'child_process';

const child = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: {
    ...process.env,
    TS_NODE_TRANSPILE_ONLY: 'true',
    NODE_OPTIONS: '--experimental-modules --es-module-specifier-resolution=node --no-warnings'
  }
});

child.on('error', (err) => {
  console.error('Failed to start server:', err);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
  process.exit(0);
});