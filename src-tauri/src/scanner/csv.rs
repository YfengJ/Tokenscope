use std::{collections::HashMap, path::Path};

use anyhow::Result;
use uuid::Uuid;

use crate::{models::UsageEvent, pricing::estimate_cost_usd};

pub fn import(path: &Path) -> Result<Vec<UsageEvent>> {
    let mut reader = csv::ReaderBuilder::new().flexible(true).from_path(path)?;
    let headers = reader.headers()?.clone();
    let mut events = Vec::new();
    for row in reader.records() {
        let record = row?;
        let mut map = HashMap::new();
        for (index, header) in headers.iter().enumerate() {
            map.insert(header.trim().to_string(), record.get(index).unwrap_or_default().trim().to_string());
        }
        if let Some(event) = event_from_map(&map) {
            events.push(event);
        }
    }
    Ok(events)
}

pub fn preview(path: &Path, limit: usize) -> Result<Vec<UsageEvent>> {
    let mut events = import(path)?;
    events.truncate(limit);
    Ok(events)
}

fn parse_i64(map: &HashMap<String, String>, key: &str) -> i64 {
    map.get(key)
        .and_then(|value| value.parse::<f64>().ok())
        .map(|value| value.max(0.0) as i64)
        .unwrap_or(0)
}

fn parse_f64(map: &HashMap<String, String>, key: &str) -> Option<f64> {
    map.get(key).and_then(|value| value.parse::<f64>().ok())
}

fn event_from_map(map: &HashMap<String, String>) -> Option<UsageEvent> {
    let model = map.get("model").filter(|value| !value.is_empty())?.to_string();
    let input = parse_i64(map, "input_tokens");
    let output = parse_i64(map, "output_tokens");
    let cache_read = parse_i64(map, "cache_read_tokens");
    let cache_write = parse_i64(map, "cache_write_tokens");
    let reasoning = parse_i64(map, "reasoning_tokens");
    let explicit_total = parse_i64(map, "total_tokens");
    let total = explicit_total.max(input + output + cache_read + cache_write + reasoning);
    if total == 0 {
        return None;
    }
    let timestamp = map
        .get("timestamp")
        .filter(|value| !value.is_empty())
        .cloned()
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());
    let source = map
        .get("source")
        .filter(|value| !value.is_empty())
        .cloned()
        .unwrap_or_else(|| "manual_import".to_string());

    Some(UsageEvent {
        id: map
            .get("id")
            .filter(|value| !value.is_empty())
            .cloned()
            .unwrap_or_else(|| Uuid::new_v4().to_string()),
        source,
        source_type: "csv_import".to_string(),
        timestamp,
        project_name: map.get("project_name").filter(|value| !value.is_empty()).cloned(),
        session_id: map.get("session_id").filter(|value| !value.is_empty()).cloned(),
        model: model.clone(),
        provider: map.get("provider").filter(|value| !value.is_empty()).cloned(),
        input_tokens: input,
        output_tokens: output,
        cache_read_tokens: cache_read,
        cache_write_tokens: cache_write,
        reasoning_tokens: reasoning,
        total_tokens: total,
        estimated_cost_usd: parse_f64(map, "estimated_cost_usd").or_else(|| estimate_cost_usd(&model, total)),
        duration_ms: parse_i64(map, "duration_ms").gt(&0).then_some(parse_i64(map, "duration_ms")),
        raw_ref: None,
        accuracy: "medium".to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn imports_defaults_and_total() {
        let map = HashMap::from([
            ("timestamp".to_string(), "2026-01-01T00:00:00Z".to_string()),
            ("model".to_string(), "gpt-4.1".to_string()),
            ("input_tokens".to_string(), "100".to_string()),
            ("output_tokens".to_string(), "50".to_string()),
        ]);
        let event = event_from_map(&map).expect("event");
        assert_eq!(event.source, "manual_import");
        assert_eq!(event.total_tokens, 150);
        assert_eq!(event.source_type, "csv_import");
    }
}
