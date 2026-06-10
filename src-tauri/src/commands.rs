use std::collections::{BTreeMap, HashMap, HashSet};
use std::path::PathBuf;

use chrono::{DateTime, Datelike, Duration, TimeZone, Utc};
use tauri::State;

use crate::db::{demo_events, Database};
use crate::models::{
    AppSettings, BreakdownPoint, DashboardSummary, ModelStat, SessionStat, SourceStatus, SummaryCardData,
    TokenSpike, TrendPoint, UsageEvent, UsageFilters,
};
use crate::scanner;
use crate::AppState;

type CommandResult<T> = Result<T, String>;

fn lock_db<'a>(state: &'a State<'_, AppState>) -> Result<std::sync::MutexGuard<'a, crate::db::Database>, String> {
    state.db.lock().map_err(|_| "database lock poisoned".to_string())
}

fn expand_home(path: Option<String>, fallback: &str) -> PathBuf {
    let raw = path.unwrap_or_else(|| fallback.to_string());
    if raw == "~" || raw.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(raw.trim_start_matches("~/"));
        }
    }
    PathBuf::from(raw)
}

fn insert_real_usage_events(db: &Database, events: &[UsageEvent]) -> CommandResult<()> {
    if !events.is_empty() {
        db.delete_demo_events().map_err(|err| err.to_string())?;
        let mut settings = db.get_settings().map_err(|err| err.to_string())?;
        if settings.demo_data_enabled {
            settings.demo_data_enabled = false;
            db.save_settings(&settings).map_err(|err| err.to_string())?;
        }
    }
    db.insert_usage_events(events).map_err(|err| err.to_string())
}

fn parse_time(value: &str) -> Option<DateTime<Utc>> {
    DateTime::parse_from_rfc3339(value)
        .map(|time| time.with_timezone(&Utc))
        .ok()
}

fn range_days(range: &str) -> i64 {
    match range {
        "today" => 1,
        "3d" => 3,
        "30d" => 30,
        _ => 7,
    }
}

fn range_window(range: &str) -> (DateTime<Utc>, DateTime<Utc>, DateTime<Utc>, DateTime<Utc>) {
    let now = Utc::now();
    let days = range_days(range);
    let today = Utc
        .with_ymd_and_hms(now.year(), now.month(), now.day(), 0, 0, 0)
        .single()
        .unwrap_or(now);
    let start = if days == 1 {
        today
    } else {
        today - Duration::days(days - 1)
    };
    let previous_end = start;
    let previous_start = previous_end - Duration::days(days);
    (start, now, previous_start, previous_end)
}

fn in_window(event: &UsageEvent, start: DateTime<Utc>, end: DateTime<Utc>) -> bool {
    parse_time(&event.timestamp)
        .map(|time| time >= start && time <= end)
        .unwrap_or(false)
}

fn filter_range(events: &[UsageEvent], range: &str) -> Vec<UsageEvent> {
    let (start, end, _, _) = range_window(range);
    events
        .iter()
        .filter(|event| in_window(event, start, end))
        .cloned()
        .collect()
}

fn filter_events(events: Vec<UsageEvent>, filters: UsageFilters) -> Vec<UsageEvent> {
    let mut scoped = if let Some(range) = filters.range.as_deref() {
        filter_range(&events, range)
    } else {
        events
    };
    if let Some(query) = filters.query.filter(|value| !value.trim().is_empty()) {
        let query = query.to_lowercase();
        scoped.retain(|event| {
            [
                event.model.as_str(),
                event.source.as_str(),
                event.project_name.as_deref().unwrap_or_default(),
                event.session_id.as_deref().unwrap_or_default(),
            ]
            .iter()
            .any(|value| value.to_lowercase().contains(&query))
        });
    }
    if let Some(source) = filters.source.filter(|value| value != "all") {
        scoped.retain(|event| event.source == source);
    }
    if let Some(model) = filters.model.filter(|value| value != "all") {
        scoped.retain(|event| event.model == model);
    }
    scoped
}

fn sum(events: &[UsageEvent]) -> (i64, i64, i64, f64) {
    events.iter().fold((0, 0, 0, 0.0), |mut acc, event| {
        acc.0 += event.total_tokens;
        acc.1 += event.input_tokens;
        acc.2 += event.output_tokens;
        acc.3 += event.estimated_cost_usd.unwrap_or(0.0);
        acc
    })
}

fn summary_card(events: &[UsageEvent], range: &str, label: &str) -> SummaryCardData {
    let (start, end, previous_start, previous_end) = range_window(range);
    let current: Vec<_> = events
        .iter()
        .filter(|event| in_window(event, start, end))
        .cloned()
        .collect();
    let previous: Vec<_> = events
        .iter()
        .filter(|event| in_window(event, previous_start, previous_end))
        .cloned()
        .collect();
    let current_sum = sum(&current);
    let previous_sum = sum(&previous);
    let comparison_delta = if previous_sum.0 == 0 {
        if current_sum.0 > 0 { 100.0 } else { 0.0 }
    } else {
        ((current_sum.0 - previous_sum.0) as f64 / previous_sum.0 as f64) * 100.0
    };
    SummaryCardData {
        label: label.to_string(),
        total_tokens: current_sum.0,
        estimated_cost_usd: current_sum.3,
        input_tokens: current_sum.1,
        output_tokens: current_sum.2,
        comparison_delta,
    }
}

fn day_key(time: DateTime<Utc>) -> String {
    format!("{:04}-{:02}-{:02}", time.year(), time.month(), time.day())
}

fn daily_trend(events: &[UsageEvent], range: &str) -> Vec<TrendPoint> {
    let (start, end, _, _) = range_window(range);
    let mut days = BTreeMap::<String, TrendPoint>::new();
    let mut cursor = start;
    while cursor <= end {
        let key = day_key(cursor);
        days.insert(
            key.clone(),
            TrendPoint {
                date: key,
                input_tokens: 0,
                output_tokens: 0,
                cache_tokens: 0,
                reasoning_tokens: 0,
                total_tokens: 0,
            },
        );
        cursor = cursor + Duration::days(1);
    }

    for event in events.iter().filter(|event| in_window(event, start, end)) {
        if let Some(time) = parse_time(&event.timestamp) {
            if let Some(point) = days.get_mut(&day_key(time)) {
                point.input_tokens += event.input_tokens;
                point.output_tokens += event.output_tokens;
                point.cache_tokens += event.cache_read_tokens + event.cache_write_tokens;
                point.reasoning_tokens += event.reasoning_tokens;
                point.total_tokens += event.total_tokens;
            }
        }
    }
    days.into_values().collect()
}

fn breakdown(events: &[UsageEvent], field: &str) -> Vec<BreakdownPoint> {
    let mut map = HashMap::<String, i64>::new();
    for event in events {
        let key = if field == "model" { &event.model } else { &event.source };
        *map.entry(key.clone()).or_default() += event.total_tokens;
    }
    let mut points: Vec<_> = map
        .into_iter()
        .map(|(name, value)| BreakdownPoint { name, value })
        .collect();
    points.sort_by(|a, b| b.value.cmp(&a.value));
    points
}

fn model_stats(events: &[UsageEvent]) -> Vec<ModelStat> {
    #[derive(Default)]
    struct Acc {
        provider: Option<String>,
        total: i64,
        input: i64,
        output: i64,
        cached: i64,
        reasoning: i64,
        cost: f64,
        sessions: HashSet<String>,
        last: String,
    }
    let mut map = HashMap::<String, Acc>::new();
    for event in events {
        let acc = map.entry(event.model.clone()).or_default();
        acc.provider = event.provider.clone().or(acc.provider.clone());
        acc.total += event.total_tokens;
        acc.input += event.input_tokens;
        acc.output += event.output_tokens;
        acc.cached += event.cache_read_tokens + event.cache_write_tokens;
        acc.reasoning += event.reasoning_tokens;
        acc.cost += event.estimated_cost_usd.unwrap_or(0.0);
        acc.sessions.insert(event.session_id.clone().unwrap_or_else(|| event.id.clone()));
        if acc.last.is_empty() || event.timestamp > acc.last {
            acc.last = event.timestamp.clone();
        }
    }
    let mut stats: Vec<_> = map
        .into_iter()
        .map(|(model, acc)| ModelStat {
            model,
            provider: acc.provider,
            total_tokens: acc.total,
            input_tokens: acc.input,
            output_tokens: acc.output,
            cached_tokens: acc.cached,
            reasoning_tokens: acc.reasoning,
            estimated_cost_usd: acc.cost,
            sessions_count: acc.sessions.len() as i64,
            last_used: acc.last,
        })
        .collect();
    stats.sort_by(|a, b| b.total_tokens.cmp(&a.total_tokens));
    stats
}

fn session_stats(events: &[UsageEvent]) -> Vec<SessionStat> {
    let mut map = HashMap::<String, SessionStat>::new();
    for event in events {
        let key = event.session_id.clone().unwrap_or_else(|| event.id.clone());
        let entry = map.entry(key.clone()).or_insert_with(|| SessionStat {
            session_id: key,
            project_name: event.project_name.clone(),
            source: event.source.clone(),
            model: event.model.clone(),
            total_tokens: 0,
            estimated_cost_usd: 0.0,
            started_at: event.timestamp.clone(),
            events_count: 0,
        });
        entry.total_tokens += event.total_tokens;
        entry.estimated_cost_usd += event.estimated_cost_usd.unwrap_or(0.0);
        entry.events_count += 1;
        if event.timestamp < entry.started_at {
            entry.started_at = event.timestamp.clone();
        }
    }
    let mut sessions: Vec<_> = map.into_values().collect();
    sessions.sort_by(|a, b| b.estimated_cost_usd.total_cmp(&a.estimated_cost_usd));
    sessions
}

fn spikes(events: &[UsageEvent]) -> Vec<TokenSpike> {
    let trend = daily_trend(events, "30d");
    let mut spikes = Vec::new();
    for window in trend.windows(2) {
        let previous = &window[0];
        let current = &window[1];
        let delta = current.total_tokens - previous.total_tokens;
        if delta <= 40_000 {
            continue;
        }
        if let Some(top) = events
            .iter()
            .filter(|event| event.timestamp.starts_with(&current.date))
            .max_by_key(|event| event.total_tokens)
        {
            spikes.push(TokenSpike {
                date: current.date.clone(),
                source: top.source.clone(),
                model: top.model.clone(),
                total_tokens: current.total_tokens,
                delta_vs_previous_day: delta,
            });
        }
    }
    spikes.sort_by(|a, b| b.delta_vs_previous_day.cmp(&a.delta_vs_previous_day));
    spikes.truncate(6);
    spikes
}

pub fn build_summary(events: &[UsageEvent], range: &str) -> DashboardSummary {
    let scoped = filter_range(events, range);
    DashboardSummary {
        cards: vec![
            summary_card(events, "today", "Today"),
            summary_card(events, "3d", "Last 3 days"),
            summary_card(events, "7d", "Last 7 days"),
            summary_card(events, "30d", "Last 30 days"),
        ],
        daily_trend: daily_trend(events, range),
        tokens_by_source: breakdown(&scoped, "source"),
        tokens_by_model: breakdown(&scoped, "model").into_iter().take(8).collect(),
        top_expensive_sessions: session_stats(&scoped).into_iter().take(8).collect(),
        spikes: spikes(events),
    }
}

#[tauri::command]
pub fn get_dashboard_summary(state: State<AppState>, range: String) -> CommandResult<DashboardSummary> {
    let db = lock_db(&state)?;
    let events = db.all_usage_events().map_err(|err| err.to_string())?;
    Ok(build_summary(&events, &range))
}

#[tauri::command]
pub fn list_usage_events(state: State<AppState>, filters: Option<UsageFilters>) -> CommandResult<Vec<UsageEvent>> {
    let db = lock_db(&state)?;
    let events = db.all_usage_events().map_err(|err| err.to_string())?;
    Ok(filter_events(events, filters.unwrap_or_default()))
}

#[tauri::command]
pub fn list_model_stats(state: State<AppState>, range: String) -> CommandResult<Vec<ModelStat>> {
    let db = lock_db(&state)?;
    let events = filter_range(&db.all_usage_events().map_err(|err| err.to_string())?, &range);
    Ok(model_stats(&events))
}

#[tauri::command]
pub fn list_source_status(state: State<AppState>) -> CommandResult<Vec<SourceStatus>> {
    let db = lock_db(&state)?;
    db.source_statuses().map_err(|err| err.to_string())
}

#[tauri::command]
pub fn scan_codex(state: State<AppState>, path: Option<String>) -> CommandResult<Vec<UsageEvent>> {
    let root = expand_home(path, "~/.codex");
    let events = scanner::codex::scan(&root).map_err(|err| err.to_string())?;
    let db = lock_db(&state)?;
    insert_real_usage_events(&db, &events)?;
    Ok(events)
}

#[tauri::command]
pub fn scan_claude(state: State<AppState>, path: Option<String>) -> CommandResult<Vec<UsageEvent>> {
    let root = expand_home(path, "~/.claude");
    let events = scanner::claude::scan(&root).map_err(|err| err.to_string())?;
    let db = lock_db(&state)?;
    insert_real_usage_events(&db, &events)?;
    Ok(events)
}

#[tauri::command]
pub fn preview_csv(path: String) -> CommandResult<Vec<UsageEvent>> {
    if path.trim().is_empty() {
        return Ok(Vec::new());
    }
    scanner::csv::preview(&PathBuf::from(path), 8).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn import_csv(state: State<AppState>, path: String) -> CommandResult<Vec<UsageEvent>> {
    if path.trim().is_empty() {
        return Ok(Vec::new());
    }
    let events = scanner::csv::import(&PathBuf::from(path)).map_err(|err| err.to_string())?;
    let db = lock_db(&state)?;
    insert_real_usage_events(&db, &events)?;
    Ok(events)
}

#[tauri::command]
pub fn toggle_demo_data(state: State<AppState>, enabled: bool) -> CommandResult<Vec<UsageEvent>> {
    let db = lock_db(&state)?;
    db.delete_demo_events().map_err(|err| err.to_string())?;
    let mut settings = db.get_settings().map_err(|err| err.to_string())?;
    settings.demo_data_enabled = enabled;
    db.save_settings(&settings).map_err(|err| err.to_string())?;
    if enabled {
        let events = demo_events();
        db.insert_usage_events(&events).map_err(|err| err.to_string())?;
        Ok(events)
    } else {
        db.all_usage_events().map_err(|err| err.to_string())
    }
}

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> CommandResult<AppSettings> {
    let db = lock_db(&state)?;
    db.get_settings().map_err(|err| err.to_string())
}

#[tauri::command]
pub fn update_settings(state: State<AppState>, settings: AppSettings) -> CommandResult<AppSettings> {
    let db = lock_db(&state)?;
    db.save_settings(&settings).map_err(|err| err.to_string())?;
    db.delete_demo_events().map_err(|err| err.to_string())?;
    if settings.demo_data_enabled {
        db.insert_usage_events(&demo_events()).map_err(|err| err.to_string())?;
    }
    Ok(settings)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aggregates_model_sessions_without_duplicate_session_count() {
        let events = vec![
            UsageEvent {
                id: "a".to_string(),
                source: "demo".to_string(),
                source_type: "demo".to_string(),
                timestamp: Utc::now().to_rfc3339(),
                project_name: Some("TokenScope".to_string()),
                session_id: Some("s1".to_string()),
                model: "gpt-4.1".to_string(),
                provider: Some("OpenAI".to_string()),
                input_tokens: 100,
                output_tokens: 50,
                cache_read_tokens: 0,
                cache_write_tokens: 0,
                reasoning_tokens: 0,
                total_tokens: 150,
                estimated_cost_usd: Some(0.01),
                duration_ms: None,
                raw_ref: None,
                accuracy: "high".to_string(),
            },
            UsageEvent {
                id: "b".to_string(),
                source: "demo".to_string(),
                source_type: "demo".to_string(),
                timestamp: Utc::now().to_rfc3339(),
                project_name: Some("TokenScope".to_string()),
                session_id: Some("s1".to_string()),
                model: "gpt-4.1".to_string(),
                provider: Some("OpenAI".to_string()),
                input_tokens: 10,
                output_tokens: 20,
                cache_read_tokens: 5,
                cache_write_tokens: 0,
                reasoning_tokens: 0,
                total_tokens: 35,
                estimated_cost_usd: Some(0.01),
                duration_ms: None,
                raw_ref: None,
                accuracy: "high".to_string(),
            },
        ];
        let stats = model_stats(&events);
        assert_eq!(stats[0].total_tokens, 185);
        assert_eq!(stats[0].sessions_count, 1);
    }

    #[test]
    fn real_import_disables_demo_data_when_events_exist() {
        let db = Database::open_memory().expect("memory database");
        let mut settings = AppSettings::default();
        settings.demo_data_enabled = true;
        db.save_settings(&settings).expect("save settings");
        db.insert_usage_events(&demo_events()).expect("insert demo");

        let real_event = UsageEvent {
            id: "codex-real-1".to_string(),
            source: "codex".to_string(),
            source_type: "local_log".to_string(),
            timestamp: Utc::now().to_rfc3339(),
            project_name: Some("TokenScope".to_string()),
            session_id: Some("real-session".to_string()),
            model: "gpt-5.5".to_string(),
            provider: Some("OpenAI".to_string()),
            input_tokens: 100,
            output_tokens: 50,
            cache_read_tokens: 20,
            cache_write_tokens: 0,
            reasoning_tokens: 10,
            total_tokens: 150,
            estimated_cost_usd: Some(0.01),
            duration_ms: None,
            raw_ref: None,
            accuracy: "experimental".to_string(),
        };

        insert_real_usage_events(&db, &[real_event]).expect("insert real usage");

        let stored = db.all_usage_events().expect("stored events");
        assert!(stored.iter().all(|event| event.source != "demo"));
        assert!(stored.iter().any(|event| event.source == "codex" && event.model == "gpt-5.5"));
        assert!(!db.get_settings().expect("settings").demo_data_enabled);
    }
}
