use std::{collections::HashSet, path::Path};

use anyhow::Result;
use serde_json::Value;
use uuid::Uuid;

use crate::{
    models::UsageEvent,
    pricing::estimate_cost_usd,
    scanner::jsonl::{jsonl_files, number_at, read_jsonl, string_at},
};

pub fn scan(path: &Path) -> Result<Vec<UsageEvent>> {
    let mut events = Vec::new();
    let mut seen_messages = HashSet::new();
    for file in jsonl_files(path, false) {
        for (line, value) in read_jsonl(&file)? {
            let message_id = string_at(&value, &[&["message", "id"], &["id"]]);
            if let Some(message_id) = message_id.as_ref() {
                if !seen_messages.insert(message_id.clone()) {
                    continue;
                }
            }
            if let Some(event) = event_from_value(&value, &format!("{}:{}", file.display(), line)) {
                events.push(event);
            }
        }
    }
    Ok(events)
}

fn event_from_value(value: &Value, raw_ref: &str) -> Option<UsageEvent> {
    let usage = value.get("usage").or_else(|| value.pointer("/message/usage"))?;
    let input = number_at(usage, &[&["input_tokens"]]);
    let output = number_at(usage, &[&["output_tokens"]]);
    let cache_read = number_at(usage, &[&["cache_read_input_tokens"], &["cache_read_tokens"]]);
    let cache_write = number_at(usage, &[&["cache_creation_input_tokens"], &["cache_write_tokens"]]);
    let total = input + output + cache_read + cache_write;
    if total == 0 {
        return None;
    }

    let timestamp = string_at(value, &[&["timestamp"], &["created_at"], &["message", "created_at"]])
        .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());
    let model = string_at(value, &[&["model"], &["message", "model"]]).unwrap_or_else(|| "unknown".to_string());
    let session_id = string_at(value, &[&["session_id"], &["conversation_id"]]);

    Some(UsageEvent {
        id: string_at(value, &[&["message", "id"], &["id"]]).unwrap_or_else(|| Uuid::new_v4().to_string()),
        source: "claude_code".to_string(),
        source_type: "local_log".to_string(),
        timestamp,
        project_name: string_at(value, &[&["project_name"], &["cwd"]])
            .and_then(|text| text.rsplit('/').next().map(|part| part.to_string())),
        session_id,
        model: model.clone(),
        provider: Some("Anthropic".to_string()),
        input_tokens: input,
        output_tokens: output,
        cache_read_tokens: cache_read,
        cache_write_tokens: cache_write,
        reasoning_tokens: 0,
        total_tokens: total,
        estimated_cost_usd: estimate_cost_usd(&model, total),
        duration_ms: None,
        raw_ref: Some(raw_ref.to_string()),
        accuracy: if model == "unknown" { "experimental" } else { "medium" }.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_message_usage() {
        let value: Value = serde_json::json!({
            "timestamp": "2026-01-01T12:00:00Z",
            "session_id": "claude-session",
            "message": {
                "id": "msg_1",
                "model": "claude-sonnet-4.5",
                "usage": {
                    "input_tokens": 90,
                    "output_tokens": 30,
                    "cache_creation_input_tokens": 10,
                    "cache_read_input_tokens": 20
                }
            }
        });
        let event = event_from_value(&value, "fixture.jsonl:1").expect("event");
        assert_eq!(event.total_tokens, 150);
        assert_eq!(event.accuracy, "medium");
    }
}
