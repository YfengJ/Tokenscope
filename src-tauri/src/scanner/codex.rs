use std::path::Path;

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
    for file in jsonl_files(path, true) {
        for (line, value) in read_jsonl(&file)? {
            if let Some(event) = event_from_value(&value, &format!("{}:{}", file.display(), line)) {
                events.push(event);
            }
        }
    }
    Ok(events)
}

fn event_from_value(value: &Value, raw_ref: &str) -> Option<UsageEvent> {
    let usage = value
        .get("usage")
        .or_else(|| value.get("token_count"))
        .or_else(|| value.pointer("/payload/usage"))
        .or_else(|| value.pointer("/event/usage"))?;

    let input = number_at(
        usage,
        &[
            &["input_tokens"],
            &["prompt_tokens"],
            &["input"],
            &["requests", "input_tokens"],
        ],
    );
    let output = number_at(
        usage,
        &[
            &["output_tokens"],
            &["completion_tokens"],
            &["output"],
            &["requests", "output_tokens"],
        ],
    );
    let cache_read = number_at(
        usage,
        &[
            &["cache_read_tokens"],
            &["cached_input_tokens"],
            &["input_token_details", "cache_read_tokens"],
        ],
    );
    let cache_write = number_at(
        usage,
        &[
            &["cache_write_tokens"],
            &["input_token_details", "cache_write_tokens"],
        ],
    );
    let reasoning = number_at(
        usage,
        &[
            &["reasoning_tokens"],
            &["output_token_details", "reasoning_tokens"],
        ],
    );
    let explicit_total = number_at(usage, &[&["total_tokens"], &["total"]]);
    let total = explicit_total.max(input + output + cache_read + cache_write + reasoning);
    if total == 0 {
        return None;
    }

    let timestamp = string_at(
        value,
        &[
            &["timestamp"],
            &["created_at"],
            &["time"],
            &["payload", "timestamp"],
            &["event", "timestamp"],
        ],
    )
    .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());
    let model = string_at(
        value,
        &[
            &["model"],
            &["payload", "model"],
            &["turn", "model"],
            &["event", "model"],
        ],
    )
    .unwrap_or_else(|| "unknown".to_string());
    let session_id = string_at(
        value,
        &[
            &["session_id"],
            &["conversation_id"],
            &["payload", "session_id"],
        ],
    );
    let project_name = string_at(value, &[&["project_name"], &["workspace"], &["cwd"]])
        .and_then(|text| text.rsplit('/').next().map(|part| part.to_string()));

    Some(UsageEvent {
        id: string_at(value, &[&["id"], &["event_id"]]).unwrap_or_else(|| Uuid::new_v4().to_string()),
        source: "codex".to_string(),
        source_type: "local_log".to_string(),
        timestamp,
        project_name,
        session_id,
        model: model.clone(),
        provider: Some("OpenAI".to_string()),
        input_tokens: input,
        output_tokens: output,
        cache_read_tokens: cache_read,
        cache_write_tokens: cache_write,
        reasoning_tokens: reasoning,
        total_tokens: total,
        estimated_cost_usd: estimate_cost_usd(&model, total),
        duration_ms: number_at(value, &[&["duration_ms"], &["elapsed_ms"]]).gt(&0).then_some(number_at(
            value,
            &[&["duration_ms"], &["elapsed_ms"]],
        )),
        raw_ref: Some(raw_ref.to_string()),
        accuracy: "experimental".to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_usage_without_prompt_content() {
        let value: Value = serde_json::json!({
            "id": "evt_1",
            "timestamp": "2026-01-01T12:00:00Z",
            "model": "gpt-5-codex",
            "session_id": "s1",
            "prompt": "do not save this",
            "usage": {
                "input_tokens": 100,
                "output_tokens": 40,
                "cache_read_tokens": 12,
                "reasoning_tokens": 8
            }
        });
        let event = event_from_value(&value, "fixture.jsonl:1").expect("event");
        assert_eq!(event.total_tokens, 160);
        assert_eq!(event.raw_ref, Some("fixture.jsonl:1".to_string()));
        assert!(!serde_json::to_string(&event).unwrap().contains("do not save this"));
    }
}
