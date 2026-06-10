use std::{collections::HashMap, path::Path};

use anyhow::Result;
use rusqlite::{params, Connection};

use crate::models::{AppSettings, SourceStatus, UsageEvent};

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn open(path: &Path) -> Result<Self> {
        let conn = Connection::open(path)?;
        let db = Self { conn };
        db.init_schema()?;
        let settings = db.get_settings()?;
        db.delete_demo_events()?;
        if settings.demo_data_enabled {
            db.insert_usage_events(&demo_events())?;
        }
        Ok(db)
    }

    pub fn open_memory() -> Result<Self> {
        let conn = Connection::open_in_memory()?;
        let db = Self { conn };
        db.init_schema()?;
        Ok(db)
    }

    fn init_schema(&self) -> Result<()> {
        self.conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS usage_events (
              id TEXT PRIMARY KEY,
              source TEXT NOT NULL,
              source_type TEXT NOT NULL,
              timestamp TEXT NOT NULL,
              project_name TEXT,
              session_id TEXT,
              model TEXT NOT NULL,
              provider TEXT,
              input_tokens INTEGER NOT NULL DEFAULT 0,
              output_tokens INTEGER NOT NULL DEFAULT 0,
              cache_read_tokens INTEGER NOT NULL DEFAULT 0,
              cache_write_tokens INTEGER NOT NULL DEFAULT 0,
              reasoning_tokens INTEGER NOT NULL DEFAULT 0,
              total_tokens INTEGER NOT NULL DEFAULT 0,
              estimated_cost_usd REAL,
              duration_ms INTEGER,
              raw_ref TEXT,
              accuracy TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_usage_events_timestamp ON usage_events(timestamp);
            CREATE INDEX IF NOT EXISTS idx_usage_events_source ON usage_events(source);
            CREATE INDEX IF NOT EXISTS idx_usage_events_model ON usage_events(model);
            CREATE INDEX IF NOT EXISTS idx_usage_events_session ON usage_events(session_id);

            CREATE TABLE IF NOT EXISTS sources (
              source TEXT PRIMARY KEY,
              status TEXT NOT NULL,
              source_type TEXT NOT NULL,
              accuracy TEXT NOT NULL,
              last_sync TEXT,
              event_count INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS sync_runs (
              id TEXT PRIMARY KEY,
              source TEXT NOT NULL,
              started_at TEXT NOT NULL,
              finished_at TEXT,
              status TEXT NOT NULL,
              events_found INTEGER NOT NULL DEFAULT 0,
              error TEXT
            );

            CREATE TABLE IF NOT EXISTS app_settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            "#,
        )?;
        Ok(())
    }

    pub fn insert_usage_events(&self, events: &[UsageEvent]) -> Result<()> {
        for event in events {
            self.conn.execute(
                r#"
                INSERT OR REPLACE INTO usage_events (
                  id, source, source_type, timestamp, project_name, session_id, model, provider,
                  input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, reasoning_tokens,
                  total_tokens, estimated_cost_usd, duration_ms, raw_ref, accuracy
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)
                "#,
                params![
                    &event.id,
                    &event.source,
                    &event.source_type,
                    &event.timestamp,
                    event.project_name.as_deref(),
                    event.session_id.as_deref(),
                    &event.model,
                    event.provider.as_deref(),
                    event.input_tokens,
                    event.output_tokens,
                    event.cache_read_tokens,
                    event.cache_write_tokens,
                    event.reasoning_tokens,
                    event.total_tokens,
                    event.estimated_cost_usd,
                    event.duration_ms,
                    event.raw_ref.as_deref(),
                    &event.accuracy
                ],
            )?;
        }
        Ok(())
    }

    pub fn delete_source(&self, source: &str) -> Result<()> {
        self.conn
            .execute("DELETE FROM usage_events WHERE source = ?1", params![source])?;
        Ok(())
    }

    pub fn delete_demo_events(&self) -> Result<()> {
        self.conn
            .execute("DELETE FROM usage_events WHERE id LIKE 'demo-%'", [])?;
        Ok(())
    }

    pub fn all_usage_events(&self) -> Result<Vec<UsageEvent>> {
        let mut stmt = self.conn.prepare(
            r#"
            SELECT id, source, source_type, timestamp, project_name, session_id, model, provider,
                   input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, reasoning_tokens,
                   total_tokens, estimated_cost_usd, duration_ms, raw_ref, accuracy
            FROM usage_events
            ORDER BY timestamp DESC
            "#,
        )?;
        let events = stmt
            .query_map([], |row| {
                Ok(UsageEvent {
                    id: row.get(0)?,
                    source: row.get(1)?,
                    source_type: row.get(2)?,
                    timestamp: row.get(3)?,
                    project_name: row.get(4)?,
                    session_id: row.get(5)?,
                    model: row.get(6)?,
                    provider: row.get(7)?,
                    input_tokens: row.get(8)?,
                    output_tokens: row.get(9)?,
                    cache_read_tokens: row.get(10)?,
                    cache_write_tokens: row.get(11)?,
                    reasoning_tokens: row.get(12)?,
                    total_tokens: row.get(13)?,
                    estimated_cost_usd: row.get(14)?,
                    duration_ms: row.get(15)?,
                    raw_ref: row.get(16)?,
                    accuracy: row.get(17)?,
                })
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;
        Ok(events)
    }

    pub fn get_settings(&self) -> Result<AppSettings> {
        let value: Option<String> = self
            .conn
            .query_row("SELECT value FROM app_settings WHERE key = 'settings'", [], |row| row.get(0))
            .ok();
        Ok(value
            .and_then(|text| serde_json::from_str::<AppSettings>(&text).ok())
            .unwrap_or_default())
    }

    pub fn save_settings(&self, settings: &AppSettings) -> Result<()> {
        let value = serde_json::to_string(settings)?;
        self.conn.execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('settings', ?1)",
            params![value],
        )?;
        Ok(())
    }

    pub fn source_statuses(&self) -> Result<Vec<SourceStatus>> {
        let mut counts = HashMap::<String, i64>::new();
        let mut last_sync = HashMap::<String, String>::new();
        let mut stmt = self.conn.prepare(
            "SELECT source, COUNT(*), MAX(timestamp) FROM usage_events GROUP BY source",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, i64>(1)?,
                row.get::<_, Option<String>>(2)?,
            ))
        })?;
        for row in rows {
            let (source, count, last) = row?;
            counts.insert(source.clone(), count);
            if let Some(last) = last {
                last_sync.insert(source, last);
            }
        }

        let descriptors = [
            ("codex", "Codex CLI local logs", "local_log", "experimental", "experimental", "Scan", "Scans local JSONL sessions without prompt content."),
            ("claude_code", "Claude Code local logs", "local_log", "experimental", "experimental", "Scan", "Parses message usage metadata and deduplicates message ids."),
            ("openai_api", "OpenAI API", "official_api", "needs_config", "high", "Configure", "Configuration UI is available; network sync is mocked in MVP."),
            ("anthropic_api", "Anthropic API", "official_api", "needs_config", "high", "Configure", "Configuration UI is available; network sync is mocked in MVP."),
            ("openrouter", "OpenRouter", "official_api", "coming_soon", "medium", "Coming soon", "Connector contract is reserved for a later release."),
            ("litellm", "LiteLLM", "telemetry", "coming_soon", "medium", "Coming soon", "Proxy log ingestion is planned after local parsers stabilize."),
            ("cursor", "Cursor", "telemetry", "coming_soon", "low", "Coming soon", "Telemetry availability depends on local export support."),
            ("copilot", "GitHub Copilot", "telemetry", "coming_soon", "low", "Coming soon", "Reserved for future official and local telemetry paths."),
            ("gemini_cli", "Gemini CLI", "local_log", "coming_soon", "experimental", "Coming soon", "Local parser is not included in the first MVP."),
            ("manual_import", "Manual CSV import", "csv_import", "connected", "medium", "Import", "Imports metadata columns from a generic CSV file."),
            ("demo", "Demo data", "demo", "connected", "high", "Configure", "Deterministic local sample data for first-run exploration."),
        ];

        Ok(descriptors
            .into_iter()
            .map(|(source, label, source_type, status, accuracy, action, description)| {
                let event_count = *counts.get(source).unwrap_or(&0);
                let resolved_status = if source == "demo" && event_count == 0 {
                    "needs_config"
                } else {
                    status
                };
                SourceStatus {
                    source: source.to_string(),
                    label: label.to_string(),
                    source_type: source_type.to_string(),
                    status: resolved_status.to_string(),
                    accuracy: accuracy.to_string(),
                    last_sync: last_sync.get(source).cloned(),
                    event_count,
                    action: action.to_string(),
                    description: description.to_string(),
                }
            })
            .collect())
    }
}

pub fn demo_events() -> Vec<UsageEvent> {
    use chrono::{Duration, Utc};

    let specs = [
        ("gpt-5.5-codex", "OpenAI", 8.5),
        ("gpt-5-codex", "OpenAI", 8.5),
        ("claude-sonnet-4.5", "Anthropic", 10.0),
        ("openrouter/auto", "OpenRouter", 4.5),
    ];
    let mut events = Vec::new();
    for day in 0..34 {
        for session in 0..3 {
            let spec = specs[(day + session) % specs.len()];
            let input = 18_000 + (day as i64 * 1400) + (session as i64 * 8100);
            let output = 9_000 + (day as i64 * 760) + (session as i64 * 3300);
            let cache_read = if session % 2 == 0 { input / 5 } else { input / 12 };
            let cache_write = input / 18;
            let reasoning = if spec.0.contains("gpt-5") || spec.0.contains("opus") {
                output / 6
            } else {
                0
            };
            let total = input + output + cache_read + cache_write + reasoning;
            let now = Utc::now();
            let today = now
                .date_naive()
                .and_hms_opt(0, 0, 0)
                .map(|naive| chrono::DateTime::<Utc>::from_naive_utc_and_offset(naive, Utc))
                .unwrap_or(now);
            let timestamp = if day == 0 {
                let elapsed_ms = (now - today).num_milliseconds().max(1);
                today + Duration::milliseconds((elapsed_ms * (session as i64 + 1)) / 3)
            } else {
                now - Duration::days(day as i64) + Duration::hours((session * 3) as i64)
            };
            events.push(UsageEvent {
                id: format!("demo-{}-{}", day, session),
                source: "demo".to_string(),
                source_type: "demo".to_string(),
                timestamp: timestamp.to_rfc3339(),
                project_name: Some("Demo Workspace".to_string()),
                session_id: Some(format!("demo-workspace-{}-{}", day, session % 2)),
                model: spec.0.to_string(),
                provider: Some(spec.1.to_string()),
                input_tokens: input,
                output_tokens: output,
                cache_read_tokens: cache_read,
                cache_write_tokens: cache_write,
                reasoning_tokens: reasoning,
                total_tokens: total,
                estimated_cost_usd: Some((total as f64 / 1_000_000.0) * spec.2),
                duration_ms: Some(120_000 + session as i64 * 44_000),
                raw_ref: Some(format!("demo:{}:{}", day, session)),
                accuracy: "high".to_string(),
            });
        }
    }
    events
}
