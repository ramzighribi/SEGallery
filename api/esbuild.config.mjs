import * as esbuild from 'esbuild';
import { readdirSync, cpSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const functionsDir = './dist/functions';
const outDir = './build';

// Clean build dir
if (existsSync(outDir)) {
  const { rmSync } = await import('fs');
  rmSync(outDir, { recursive: true });
}
mkdirSync(outDir, { recursive: true });

// Get all function entry points
const functionFiles = readdirSync(functionsDir)
  .filter(f => f.endsWith('.js'))
  .map(f => join(functionsDir, f));

// Bundle each function and its dependencies into a single file
await esbuild.build({
  entryPoints: functionFiles,
  bundle: true,
  platform: 'node',
  target: 'node20',
  outdir: join(outDir, 'functions'),
  format: 'cjs',
  external: ['@azure/functions-core'],
  minify: true,
  sourcemap: false,
});

// Also bundle index entry point that imports all functions
await esbuild.build({
  entryPoints: ['./dist/index.js'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: join(outDir, 'index.js'),
  format: 'cjs',
  external: ['@azure/functions-core'],
  minify: true,
  sourcemap: false,
});

// Copy host.json and package.json (minimal) to build dir
cpSync('./host.json', join(outDir, 'host.json'));

// Create minimal package.json
const { writeFileSync } = await import('fs');
writeFileSync(join(outDir, 'package.json'), JSON.stringify({
  name: 'segallery-api',
  version: '1.0.0',
  main: 'index.js',
  scripts: { build: 'echo build done' }
}, null, 2));

// Create .oryx_manifest for SWA deploy with skip_api_build
writeFileSync(join(outDir, '.oryx_manifest'), [
  'NodeVersion="20"',
  'Framework="NODEJS"',
  'CompressedDestinationDir="/bin/staticsites/ss-oryx-api"',
].join('\n'));
