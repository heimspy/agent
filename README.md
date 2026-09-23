# Heimspy Agent

Node capture service used by [Heimspy VS Code](https://github.com/heimspy/vscode).
Owns capture sessions, rules, certificates, gRPC/SSE/WebSocket handling, the MCP
endpoint, and the shared client protocol. It controls the separately maintained
[sing-box fork](https://github.com/heimspy/sing-box).

## Develop

Requires Node 24, Git and Go (`sing-box.lock.json` records the test fork and toolchain).

```sh
git clone https://github.com/heimspy/agent.git
cd agent
npm ci --ignore-scripts
npm rebuild esbuild
mkdir -p .build
git clone https://github.com/heimspy/sing-box.git .build/sing-box
git -C .build/sing-box checkout --detach "$(node -p "require('./sing-box.lock.json').revision")"
npm run test:core
npm run typecheck
npm run build
npm test
```

`test:core` builds only a local integration-test binary and SHA-256 manifest in
`core/<platform>-<arch>/`. It requires a clean checkout at `sing-box.lock.json`'s
revision, either in `.build/sing-box` or selected with `HEIMSPY_SING_BOX_SOURCE`.
CI checks out that exact fork commit directly. An existing compatible binary can
instead be supplied to tests with `HEIMSPY_TEST_CORE=/absolute/path/to/sing-box`.

Production builds, license notices and VSIX distribution belong to
[heimspy/vscode](https://github.com/heimspy/vscode). Agent does not depend on vscode
or the retired core repository. Go race tests, vet and govulncheck run in the fork.

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

On an agent release, update package.json and its lockfile, test the locked core,
and create a tag. On incompatible protocol changes, also bump `PROTOCOL` in
`src/agent/protocol.ts`. Update `sing-box.lock.json` only to a tested fork commit.
GitHub release CI attaches the bundled agent and source package; it does not publish to npm.

## History and license

MIT. Extracted with relevant Git history from `heimspy/heimspy` at `7478a34`.
The Go core is distributed separately under its own license and notices.
