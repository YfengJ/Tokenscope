use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct UsageEvent {
    pub id: String,
    pub source: String,
    pub source_type: String,
    pub timestamp: String,
    pub project_name: Option<String>,
    pub session_id: Option<String>,
    pub model: String,
    pub provider: Option<String>,
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub cache_read_tokens: i64,
    pub cache_write_tokens: i64,
    pub reasoning_tokens: i64,
    pub total_tokens: i64,
    pub estimated_cost_usd: Option<f64>,
    pub duration_ms: Option<i64>,
    pub raw_ref: Option<String>,
    pub accuracy: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct UsageFilters {
    pub range: Option<String>,
    pub query: Option<String>,
    pub source: Option<String>,
    pub model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceStatus {
    pub source: String,
    pub label: String,
    pub source_type: String,
    pub status: String,
    pub accuracy: String,
    pub last_sync: Option<String>,
    pub event_count: i64,
    pub action: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AppSettings {
    pub data_dir: String,
    pub codex_home_path: String,
    pub claude_home_path: String,
    pub demo_data_enabled: bool,
    pub hide_project_names: bool,
    pub save_raw_references: bool,
    pub openai_configured: bool,
    pub anthropic_configured: bool,
    pub language: String,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            data_dir: "app-data/tokenscope".to_string(),
            codex_home_path: "~/.codex".to_string(),
            claude_home_path: "~/.claude".to_string(),
            demo_data_enabled: false,
            hide_project_names: false,
            save_raw_references: false,
            openai_configured: false,
            anthropic_configured: false,
            language: "en".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SummaryCardData {
    pub label: String,
    pub total_tokens: i64,
    pub estimated_cost_usd: f64,
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub comparison_delta: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrendPoint {
    pub date: String,
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub cache_tokens: i64,
    pub reasoning_tokens: i64,
    pub total_tokens: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BreakdownPoint {
    pub name: String,
    pub value: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelStat {
    pub model: String,
    pub provider: Option<String>,
    pub total_tokens: i64,
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub cached_tokens: i64,
    pub reasoning_tokens: i64,
    pub estimated_cost_usd: f64,
    pub sessions_count: i64,
    pub last_used: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionStat {
    pub session_id: String,
    pub project_name: Option<String>,
    pub source: String,
    pub model: String,
    pub total_tokens: i64,
    pub estimated_cost_usd: f64,
    pub started_at: String,
    pub events_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenSpike {
    pub date: String,
    pub source: String,
    pub model: String,
    pub total_tokens: i64,
    pub delta_vs_previous_day: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardSummary {
    pub cards: Vec<SummaryCardData>,
    pub daily_trend: Vec<TrendPoint>,
    pub tokens_by_source: Vec<BreakdownPoint>,
    pub tokens_by_model: Vec<BreakdownPoint>,
    pub top_expensive_sessions: Vec<SessionStat>,
    pub spikes: Vec<TokenSpike>,
}
