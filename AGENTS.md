# AGENTS.md

## Development Commands

- `pnpm install`
- `pnpm dev`
- `pnpm tauri dev`
- `pnpm build`
- `pnpm tauri build`

## Test Commands

- `pnpm typecheck`
- `pnpm test`
- `cargo test --manifest-path src-tauri/Cargo.toml`

## Architecture

TokenScope uses Tauri v2, React, TypeScript, Vite, Tailwind CSS, Recharts, Rust commands, and SQLite via rusqlite.

The frontend lives in `src/`:

- `src/routes/` contains Dashboard, Models, Sources, Timeline, Sessions, and Settings.
- `src/lib/` contains shared types, demo data, formatting, time ranges, API fallback, and aggregation.
- `src/components/` contains layout, charts, onboarding, and small shadcn-style UI primitives.

The backend lives in `src-tauri/src/`:

- `commands.rs` exposes Tauri commands and aggregation.
- `db.rs` owns SQLite schema and persistence.
- `scanner/` owns CSV, Codex, Claude Code, and JSONL parsing.
- `pricing/` contains estimated cost heuristics.

## Privacy Rules

- Do not read, save, or display prompt content.
- Store token metadata, model, tool/source, timestamp, project/session id, and safe raw references only.
- Keep raw references disabled by default unless the setting is explicitly enabled.

## Parser Rules

- Parser changes must add or update fixture tests.
- Unknown log structures must be skipped without crashing.
- Codex parser results are experimental.
- Claude Code parser results are medium only when usage and model are recognized; otherwise experimental.
- Deduplicate Claude Code message ids before counting.

## UI Rules

- Dark and light themes must remain usable.
- Keep the UI calm, dense, and developer-tool oriented.
- Avoid admin-template filler and prompt/design commentary in the app.

## Completion Checklist

Before marking work complete, run:

```bash
pnpm test
cargo test --manifest-path src-tauri/Cargo.toml
pnpm build
```
