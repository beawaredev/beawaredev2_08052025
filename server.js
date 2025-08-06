// Azure deployment entry point - fallback for when compiled files aren't available
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting BeAware server...');
console.log('📁 Current directory:', process.cwd());
console.log('🔍 Looking for compiled server files...');

// Try to use compiled version first
const compiledPath = join(__dirname, 'compiled', 'server', 'index.js');
const directPath = join(__dirname, 'server', 'index.ts');

if (existsSync(compiledPath)) {
    console.log('✅ Using compiled server:', compiledPath);
    import(compiledPath).catch(error => {
        console.error('❌ Failed to import compiled server:', error);
        console.log('🔄 Falling back to TypeScript server...');
        // Fallback to TypeScript version
        import('tsx').then(tsx => {
            return import(directPath);
        }).catch(tsError => {
            console.error('❌ Failed to import TypeScript server:', tsError);
            process.exit(1);
        });
    });
} else {
    console.log('⚠️  Compiled server not found, using TypeScript directly...');
    // Use tsx to run TypeScript directly
    import('tsx').then(tsx => {
        return import(directPath);
    }).catch(error => {
        console.error('❌ Failed to start server:', error);
        console.log('📝 Available files:');
        console.log('- Compiled path checked:', compiledPath, '(exists:', existsSync(compiledPath), ')');
        console.log('- Direct path checked:', directPath, '(exists:', existsSync(directPath), ')');
        process.exit(1);
    });
}