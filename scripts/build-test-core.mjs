#!/usr/bin/env node
// Local integration-test fixture only. Distribution builds belong to heimspy/vscode.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pin = JSON.parse(readFileSync(join(root, 'sing-box.lock.json'), 'utf8'))
const source = resolve(process.env.HEIMSPY_SING_BOX_SOURCE || join(root, '.build', 'sing-box'))
if (!existsSync(join(source, '.git')))
    throw new Error(
        'Check out the sing-box.lock.json revision in .build/sing-box or set HEIMSPY_SING_BOX_SOURCE'
    )
const git = (...args) => execFileSync('git', args, { cwd: source, encoding: 'utf8' }).trim()
if (git('rev-parse', 'HEAD') !== pin.revision || git('status', '--porcelain'))
    throw new Error(`Test fork checkout must be clean and at ${pin.revision}`)
const target = `${process.platform}-${process.arch}`
const directory = join(root, 'core', target)
mkdirSync(directory, { recursive: true })
const binary = join(directory, process.platform === 'win32' ? 'sing-box.exe' : 'sing-box')
const tags = readFileSync(join(source, 'release/DEFAULT_BUILD_TAGS_OTHERS'), 'utf8').trim()
const ldflags = readFileSync(join(source, 'release/LDFLAGS'), 'utf8').trim()
execFileSync(
    process.env.HEIMSPY_GO || 'go',
    [
        'build',
        '-mod=readonly',
        '-trimpath',
        '-buildvcs=false',
        `-tags=${tags}`,
        `-ldflags=${ldflags} -s -w -X github.com/sagernet/sing-box/constant.Version=${pin.version}`,
        '-o',
        binary,
        './cmd/sing-box'
    ],
    {
        cwd: source,
        stdio: 'inherit',
        env: {
            ...process.env,
            GOTOOLCHAIN: pin.toolchain + '+auto',
            GOWORK: 'off',
            GOENV: 'off',
            GOFLAGS: '',
            CGO_ENABLED: '0',
            GOOS: process.platform === 'win32' ? 'windows' : process.platform,
            GOARCH: process.arch === 'x64' ? 'amd64' : process.arch
        }
    }
)
writeFileSync(
    binary + '.build.json',
    JSON.stringify(
        {
            version: pin.version,
            revision: pin.revision,
            repository: pin.repository,
            target,
            sha256: createHash('sha256').update(readFileSync(binary)).digest('hex')
        },
        null,
        2
    ) + '\n'
)
console.log(`Built integration-test fixture: ${binary}`)
