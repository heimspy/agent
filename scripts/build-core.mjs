#!/usr/bin/env node
// Build the exact core source revision recorded by this agent package.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const pin = JSON.parse(readFileSync(new URL('../core-lock.json', import.meta.url), 'utf8'))
if (!/^[a-f0-9]{40}$/.test(pin.revision))
    throw new Error('core-lock.json requires a full commit SHA')
const root = process.cwd()
const source = resolve(
    process.env.HEIMSPY_CORE_SOURCE || join(root, '.build', 'core', pin.revision)
)
const run = (command, args, cwd = source) => execFileSync(command, args, { cwd, stdio: 'inherit' })
if (!existsSync(join(source, '.git'))) {
    if (process.env.HEIMSPY_CORE_SOURCE)
        throw new Error('HEIMSPY_CORE_SOURCE must be a Git checkout')
    mkdirSync(source, { recursive: true })
    run('git', ['init'])
    run('git', ['remote', 'add', 'origin', pin.repository])
}
let head = ''
try {
    head = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: source,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
    }).trim()
} catch {
    /* A new or interrupted cache checkout still needs its pinned commit. */
}
if (head !== pin.revision) {
    if (process.env.HEIMSPY_CORE_SOURCE) throw new Error(`Core checkout must be at ${pin.revision}`)
    run('git', ['fetch', '--depth', '1', 'origin', pin.revision])
    run('git', ['checkout', '--detach', 'FETCH_HEAD'])
}
run(process.execPath, [
    join(source, 'scripts', 'build-core.mjs'),
    '--output',
    join(root, 'core'),
    ...process.argv.slice(2)
])
