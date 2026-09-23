# Heimspy Agent

Node capture service used by [Heimspy VS Code](https://github.com/heimspy/vscode).
Owns capture sessions, rules, certificates, gRPC/SSE/WebSocket handling, the MCP
endpoint, and the shared client protocol. It controls the separately maintained
[Heimspy Core](https://github.com/heimspy/core).

## Develop

Requires Node 24, Git and Go (`core-lock.json` records the core toolchain).

```sh
git clone https://github.com/heimspy/agent.git
cd agent
npm ci --ignore-scripts
npm rebuild esbuild
npm run core:build
npm run typecheck
npm run build
npm test
npm run core:test
```

`core:build` fetches the exact core commit into `.build/core/<sha>` and writes
`core/<platform>-<arch>/`. It accepts the core build flags (`--target`, `--test`).
For a local checkout at that same commit, set `HEIMSPY_CORE_SOURCE=/absolute/path`.
Core fetches the independent [sing-box fork](https://github.com/heimspy/sing-box),
not an embedded submodule. The native core is built explicitly, never by the npm install lifecycle.

Start the agent with a dedicated storage directory and a core binary:

```sh
npm start -- /tmp/heimspy-data ./core/darwin-arm64/sing-box
```

The agent waits for clients on the local socket returned by `@heimspy/agent/paths`.
Clients issue `hello` with a session ID and settings, then `start`; MCP is enabled
according to those settings. It retains the existing client-owned lifecycle and
exits after its clients disconnect. It is not an always-on standalone daemon.

## Consumer contract

The package exposes TypeScript source entry points for bundlers: `model`,
`protoRaw`, `format`, `protocol`, `paths`, `main` and `engine`. Browser consumers
should use the pure `model`/`protoRaw` entry points. `testing` provides integration
helpers; it resolves native test binaries from the consumer's working directory.
No VS Code API or React code is required by this package.

Consumers pin a reviewed full Git commit in package.json and package-lock.json.
Build `@heimspy/agent/main` with esbuild (Node/CJS) and define
`process.env.HEIMSPY_VERSION` from this package's version, not the consumer version.
The extension does this and bundles the result; users need no separate npm install.
`@heimspy/agent/build-core` builds the locked core into the caller's `core/` directory.

On an agent release, update package.json and its lockfile, test the locked core,
and create a tag. On incompatible protocol changes, also bump `PROTOCOL` in
`src/agent/protocol.ts`. Update `core-lock.json` only to a tested core commit.
GitHub release CI attaches the bundled agent and source package; it does not publish to npm.

## History and license

MIT. Extracted with relevant Git history from `heimspy/heimspy` at `7478a34`.
The Go core is distributed separately under its own license and notices.
