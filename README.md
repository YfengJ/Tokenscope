# TokenScope

[中文说明](README.zh-CN.md)

TokenScope is a local-first desktop analytics app for AI coding tool and LLM provider token usage. It helps developers inspect recent token volume, model mix, source mix, time trends, session-level estimated cost, and spikes without uploading usage data by default.

## Why TokenScope

AI coding tools now run across CLIs, IDEs, provider APIs, and local logs. TokenScope gives those events a single local dashboard so teams can understand spend, catch spikes, and compare model usage while keeping prompts out of the database.

## Supported Sources

### Implemented in 0.1.0

- Demo data
- Manual CSV import
- Experimental Codex local log parser
- Experimental Claude Code local log parser

### UI scaffold / planned

- OpenAI API
- Anthropic API
- OpenRouter
- LiteLLM
- Cursor
- GitHub Copilot
- Gemini CLI

| Source | Status | Type | Accuracy |
| --- | --- | --- | --- |
| Demo data | Implemented in 0.1.0 | Demo | High for UI testing only |
| Manual CSV import | Implemented | CSV import | Medium |
| Codex CLI local logs | Experimental | Local log | Experimental |
| Claude Code local logs | Experimental | Local log | Experimental/medium |
| OpenAI API | UI scaffold / planned | Official API | Planned high accuracy |
| Anthropic API | UI scaffold / planned | Official API | Planned high accuracy |
| OpenRouter | UI scaffold / planned | Official API | Planned medium accuracy |
| LiteLLM | UI scaffold / planned | Telemetry | Planned medium accuracy |
| Cursor | UI scaffold / planned | Telemetry | Planned low accuracy |
| GitHub Copilot | UI scaffold / planned | Telemetry | Planned low accuracy |
| Gemini CLI | UI scaffold / planned | Local log | Planned experimental |

API connectors are not fully implemented in 0.1.0 unless explicitly listed as implemented above.

## Screenshots

Screenshots will be added before public release. Placeholder structure:

### Dashboard

Placeholder: hero summary, period cards, stacked trend chart, source donut, and model usage.

### Sources

Placeholder: connector status cards, source type badges, accuracy labels, and CSV preview.

### Sessions

Placeholder: filters, density toggle, sticky header, row hover, and empty state.

### Settings

Placeholder: Data, Sources, Privacy, Appearance, Developer, About, and language settings.

Real images should be saved under `docs/screenshots/` before the first public release:

- `docs/screenshots/dashboard.png`
- `docs/screenshots/sources.png`
- `docs/screenshots/sessions.png`
- `docs/screenshots/settings.png`

## Accuracy

Estimated cost is approximate. Accuracy depends on source. Official API sources are designed to be high accuracy once network sync is implemented, but API connectors are not fully implemented in 0.1.0. Local log parsers are experimental because log formats can change and may omit fields. CSV imports are medium accuracy because TokenScope trusts the provided columns.

## Privacy

TokenScope is local-first. The MVP does not upload data by default and does not call LLM APIs. TokenScope does not store prompt or response content by default. Parsers extract token metadata, model, source, timestamp, project/session identifiers, and safe raw references.

## Development Setup

Install Node.js, pnpm, and Rust. Tauri also requires platform-specific desktop build dependencies.

```bash
pnpm install
pnpm dev
```

Run the desktop app:

```bash
pnpm tauri dev
```

## Install from Release

Prebuilt desktop installers are published on GitHub Releases.

- macOS: download the `.dmg`.
- Windows: download the `.msi` or `.exe` installer.
- Current MVP builds are unsigned and may show macOS Gatekeeper or Windows SmartScreen warnings.
- Configure macOS notarization and Windows code signing before a formal public release.

Releases page: [github.com/YfengJ/Tokenscope/releases](https://github.com/YfengJ/Tokenscope/releases)

## Test Commands

```bash
pnpm typecheck
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
pnpm build
```

## Build Release

Local unsigned build:

```bash
pnpm tauri build
```

GitHub Releases are built by pushing a tag matching `v*`. The current workflow allows unsigned builds. Production distribution still needs macOS notarization and Windows code signing.

## CSV Format

CSV import supports these columns:

```csv
timestamp,source,model,input_tokens,output_tokens,cache_read_tokens,cache_write_tokens,reasoning_tokens,total_tokens,estimated_cost_usd,project_name,session_id
```

Missing numeric fields default to `0`. Missing `source` defaults to `manual_import`. If `total_tokens` is absent, TokenScope sums input, output, cache, and reasoning tokens.

## Roadmap

- File picker and CSV preview before import.
- Real OpenAI and Anthropic usage sync behind secure storage.
- Better local parser fixtures as Codex and Claude Code formats evolve.
- Signed macOS and Windows release builds.
- Exportable reports and team-safe sharing workflows.

## Contributing

Keep parsers prompt-safe. Add fixture tests whenever parser behavior changes. For UI changes, verify dark and light modes.

## License

MIT. See [LICENSE](LICENSE).
