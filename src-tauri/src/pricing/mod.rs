pub fn estimate_cost_usd(model: &str, total_tokens: i64) -> Option<f64> {
    let per_million = if model.contains("opus") {
        15.0
    } else if model.contains("sonnet") {
        10.0
    } else if model.contains("gpt-5") {
        8.5
    } else if model.contains("gpt-4") {
        6.0
    } else if model.contains("cursor") {
        3.0
    } else if model.trim().is_empty() {
        return None;
    } else {
        4.0
    };
    Some((total_tokens as f64 / 1_000_000.0) * per_million)
}
