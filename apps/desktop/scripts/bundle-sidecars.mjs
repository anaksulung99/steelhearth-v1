/**
 * Bundle API and Worker into standalone CJS files for Electron sidecar.
 *
 * Usage:
 *   node apps/desktop/scripts/bundle-sidecars.mjs
 *   node apps/desktop/scripts/bundle-sidecars.mjs --minify
 *
 * Outputs:
 *   apps/desktop/resources/sidecar/api.cjs
 *   apps/desktop/resources/sidecar/worker.cjs
 *   apps/desktop/resources/sidecar/*.wasm  (Prisma WASM engine)
 */

import { build } from 'esbuild'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..', '..')
const resourcesDir = path.resolve(__dirname, '..', 'resources')
const outDir = path.resolve(__dirname, '..', 'resources', 'sidecar')
const minify = process.argv.includes('--minify')

fs.mkdirSync(outDir, { recursive: true })

const chromiumBidiStubPlugin = {
  name: 'chromium-bidi-stub',
  setup(build) {
    build.onResolve({ filter: /^chromium-bidi(\/.*)?$/ }, (args) => ({
      path: args.path,
      namespace: 'chromium-bidi-stub',
    }))
    build.onLoad({ filter: /.*/, namespace: 'chromium-bidi-stub' }, () => ({
      contents: 'module.exports = {};',
      loader: 'js',
    }))
  },
}

// ─── Load .env for build-time defines ────────────────────────────────────────
// Environment values are baked into the bundle so the packaged app works
// without needing a .env file at runtime (values come via Electron main → env).
// We do NOT bake secrets here; they're passed at runtime via process.env.
// This block only ensures NODE_ENV and non-secret defaults are present.
// ─────────────────────────────────────────────────────────────────────────────

/** @type {string[]} */
const sharedExternal = [
  // Node.js native addons that esbuild cannot inline
  'bufferutil',
  'utf-8-validate',
  'fsevents',
  'sharp',
  'canvas',
]

/** @type {import('esbuild').BuildOptions} */
const base = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  sourcemap: false,
  minify,
  treeShaking: true,
  external: sharedExternal,
  // Copy WASM and native .node files alongside the output bundle
  loader: {
    '.wasm': 'copy',
    '.node': 'copy',
  },
  assetNames: '[name]',
  // Resolve workspace packages via their compiled output
  conditions: ['node', 'require', 'default'],
  mainFields: ['main', 'module'],
  // Fix: in CJS bundles, import.meta is empty. Inject a banner that defines
  // a shim variable, then replace all import.meta.url with that variable.
  banner: {
    js: `const __importMetaUrl = require("url").pathToFileURL(__filename).href;`,
  },
  define: {
    'import.meta.url': '__importMetaUrl',
  },
  plugins: [chromiumBidiStubPlugin],
}

// ─── Bundle API ───────────────────────────────────────────────────────────────
console.log('Bundling API...')
await build({
  ...base,
  entryPoints: [path.resolve(repoRoot, 'apps/api/src/server.ts')],
  outfile: path.resolve(outDir, 'api.cjs'),
})
console.log('  ✓ api.cjs')

// ─── Bundle Worker ────────────────────────────────────────────────────────────
console.log('Bundling Worker...')
await build({
  ...base,
  entryPoints: [path.resolve(repoRoot, 'apps/worker/src/index.ts')],
  outfile: path.resolve(outDir, 'worker.cjs'),
})
console.log('  ✓ worker.cjs')

// ─── Copy data files that packages load via __dirname ─────────────────────────
// Some packages (header-generator, fingerprint-generator) use fs.readFileSync
// with paths relative to __dirname. After bundling, __dirname = outDir, so we
// must copy those data directories alongside the bundle.

function findPackageDir(pkgName) {
  // Search pnpm's content-addressable store
  const pnpmStore = path.resolve(repoRoot, 'node_modules', '.pnpm')
  if (fs.existsSync(pnpmStore)) {
    for (const entry of fs.readdirSync(pnpmStore)) {
      if (entry.startsWith(pkgName + '@') || entry.startsWith(pkgName.replace('/', '+') + '@')) {
        const candidate = path.join(pnpmStore, entry, 'node_modules', pkgName)
        if (fs.existsSync(candidate)) return candidate
      }
    }
  }
  // Fallback: direct node_modules
  const direct = path.resolve(repoRoot, 'node_modules', pkgName)
  return fs.existsSync(direct) ? direct : null
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const dstPath = path.join(dst, entry.name)
    if (entry.isDirectory()) copyDir(srcPath, dstPath)
    else fs.copyFileSync(srcPath, dstPath)
  }
}

// Directories to copy (package loads them via __dirname/dirName)
const dataDirs = [
  { pkg: 'header-generator', dir: 'data_files' },
  { pkg: 'fingerprint-generator', dir: 'data_files' },
  { pkg: 'generative-bayesian-network', dir: 'data_files' },
]

// Individual files to copy (loaded via __dirname/fileName)
const dataFiles = [
  { pkg: 'fingerprint-injector', file: 'utils.js' },
]

// Playwright's bundled core still resolves a few runtime metadata files from
// packageRoot. In the packaged Electron app, that packageRoot resolves to the
// resources directory, so copy the small metadata files there.
const playwrightRuntimeFiles = [
  { pkg: 'playwright-core', file: 'package.json' },
  { pkg: 'playwright-core', file: 'browsers.json' },
  { pkg: 'playwright-core', file: 'api.json' },
  { pkg: 'playwright-core', file: 'cli.js' },
]

console.log('\nCopying runtime data files...')
for (const { pkg, dir } of dataDirs) {
  const pkgDir = findPackageDir(pkg)
  if (!pkgDir) { console.log(`  ⚠ ${pkg} not found, skipping`); continue }
  const src = path.join(pkgDir, dir)
  if (!fs.existsSync(src)) { console.log(`  ⚠ ${pkg}/${dir} not found, skipping`); continue }
  copyDir(src, path.join(outDir, dir))
  console.log(`  ✓ ${pkg}/${dir} → sidecar/${dir}`)
}
for (const { pkg, file } of dataFiles) {
  const pkgDir = findPackageDir(pkg)
  if (!pkgDir) { console.log(`  ⚠ ${pkg} not found, skipping`); continue }
  const src = path.join(pkgDir, file)
  if (!fs.existsSync(src)) { console.log(`  ⚠ ${pkg}/${file} not found, skipping`); continue }
  fs.copyFileSync(src, path.join(outDir, file))
  console.log(`  ✓ ${pkg}/${file} → sidecar/${file}`)
}
for (const { pkg, file } of playwrightRuntimeFiles) {
  const pkgDir = findPackageDir(pkg)
  if (!pkgDir) { console.log(`  ⚠ ${pkg} not found, skipping`); continue }
  const src = path.join(pkgDir, file)
  if (!fs.existsSync(src)) { console.log(`  ⚠ ${pkg}/${file} not found, skipping`); continue }
  fs.copyFileSync(src, path.join(resourcesDir, file))
  console.log(`  ✓ ${pkg}/${file} → resources/${file}`)
}

// ─── Report output sizes ──────────────────────────────────────────────────────
console.log('\nOutput files:')
for (const name of fs.readdirSync(outDir)) {
  const full = path.join(outDir, name)
  const stat = fs.statSync(full)
  if (stat.isDirectory()) {
    console.log(`  ${name}/ (dir)`)
  } else {
    const mb = (stat.size / 1024 / 1024).toFixed(2)
    console.log(`  ${name}: ${mb} MB`)
  }
}

console.log('\nSidecar bundles ready.')
console.log(`Output: ${outDir}`)
