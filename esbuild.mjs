import { build } from 'esbuild'
import { readFileSync } from 'node:fs'
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
await build({
    entryPoints: { agent: 'src/agent/main.ts' },
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outdir: 'dist',
    define: { 'process.env.HEIMSPY_VERSION': JSON.stringify(version) },
    sourcemap: true,
    minify: true,
    logLevel: 'info'
})
