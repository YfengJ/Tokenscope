use std::path::PathBuf;

use tokenscope_lib::{commands::build_summary, db::{demo_events, Database}, scanner};

const SECRET_PROMPT: &str = "SECRET_PROMPT_SHOULD_NOT_APPEAR";
const SECRET_RESPONSE: &str = "SECRET_RESPONSE_SHOULD_NOT_APPEAR";

fn fixture(path: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures").join(path)
}

#[test]
fn codex_fixture_parses_usage_without_prompt_text() {
    let events = scanner::codex::scan(&fixture("codex")).expect("codex fixture parses");
    assert_eq!(events.len(), 1);
    let event = &events[0];
    assert_eq!(event.source, "codex");
    assert_eq!(event.accuracy, "experimental");
    assert_eq!(event.total_tokens, 195);
    let serialized = serde_json::to_string(event).unwrap();
    assert!(!serialized.contains("private prompt"));
}

#[test]
fn claude_fixture_deduplicates_message_ids() {
    let events = scanner::claude::scan(&fixture("claude")).expect("claude fixture parses");
    assert_eq!(events.len(), 1);
    assert_eq!(events[0].source, "claude_code");
    assert_eq!(events[0].total_tokens, 140);
}

#[test]
fn parsers_do_not_persist_prompt_or_response_content() {
    let codex_events = scanner::codex::scan(&fixture("privacy/codex")).expect("codex privacy fixture parses");
    let claude_events = scanner::claude::scan(&fixture("privacy/claude")).expect("claude privacy fixture parses");
    assert_eq!(codex_events.len(), 1);
    assert_eq!(claude_events.len(), 1);
    assert_eq!(codex_events[0].model, "gpt-5.5-codex");

    let mut events = codex_events;
    events.extend(claude_events);
    let parser_json = serde_json::to_string(&events).unwrap();
    assert!(!parser_json.contains(SECRET_PROMPT));
    assert!(!parser_json.contains(SECRET_RESPONSE));

    let db = Database::open_memory().expect("memory database");
    db.insert_usage_events(&events).expect("insert privacy fixtures");
    let stored = db.all_usage_events().expect("load stored events");
    let stored_json = serde_json::to_string(&stored).unwrap();
    assert!(!stored_json.contains(SECRET_PROMPT));
    assert!(!stored_json.contains(SECRET_RESPONSE));
}

#[test]
fn csv_fixture_imports_generic_columns() {
    let events = scanner::csv::import(&fixture("usage.csv")).expect("csv fixture imports");
    assert_eq!(events.len(), 1);
    assert_eq!(events[0].source_type, "csv_import");
    assert_eq!(events[0].total_tokens, 165);
    assert_eq!(events[0].estimated_cost_usd, Some(0.002));
}

#[test]
fn sqlite_replaces_duplicate_event_ids() {
    let db = Database::open_memory().expect("memory database");
    let events = scanner::csv::import(&fixture("usage.csv")).expect("csv fixture imports");
    db.insert_usage_events(&events).expect("first insert");
    db.insert_usage_events(&events).expect("second insert");
    assert_eq!(db.all_usage_events().unwrap().len(), 1);
}

#[test]
fn demo_events_do_not_masquerade_as_real_sources() {
    let events = demo_events();
    assert!(events.iter().all(|event| event.source == "demo"));
    assert!(events.iter().all(|event| event.source_type == "demo"));
    let serialized = serde_json::to_string(&events).unwrap();
    assert!(!serialized.contains("\"source\":\"codex\""));
    assert!(!serialized.contains("\"source\":\"claude_code\""));
    assert!(!serialized.contains("\"source\":\"openai_api\""));
}

#[test]
fn source_status_marks_demo_connected_only_when_demo_events_exist() {
    let db = Database::open_memory().expect("memory database");
    let empty_statuses = db.source_statuses().expect("source statuses");
    let empty_demo = empty_statuses.iter().find(|status| status.source == "demo").unwrap();
    assert_eq!(empty_demo.status, "needs_config");
    assert_eq!(empty_demo.event_count, 0);

    db.insert_usage_events(&demo_events()).expect("insert demo usage");
    let populated_statuses = db.source_statuses().expect("source statuses");
    let populated_demo = populated_statuses.iter().find(|status| status.source == "demo").unwrap();
    assert_eq!(populated_demo.status, "connected");
    assert!(populated_demo.event_count > 0);
}

#[test]
fn aggregation_returns_summary_cards_and_model_breakdown() {
    let mut events = scanner::csv::import(&fixture("usage.csv")).expect("csv fixture imports");
    events[0].timestamp = chrono::Utc::now().to_rfc3339();
    let summary = build_summary(&events, "30d");
    assert_eq!(summary.cards.len(), 4);
    assert_eq!(summary.tokens_by_model[0].name, "gpt-4.1");
    assert_eq!(summary.tokens_by_model[0].value, 165);
}
