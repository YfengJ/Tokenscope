use std::{
    fs::File,
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
};

use anyhow::Result;
use serde_json::Value;
use walkdir::WalkDir;

pub fn jsonl_files(root: &Path, codex_mode: bool) -> Vec<PathBuf> {
    if !root.exists() {
        return Vec::new();
    }

    WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|entry| entry.file_type().is_file())
        .map(|entry| entry.into_path())
        .filter(|path| {
            let name = path.file_name().and_then(|value| value.to_str()).unwrap_or_default();
            let is_jsonl = path.extension().and_then(|value| value.to_str()) == Some("jsonl");
            if codex_mode {
                is_jsonl
                    || name == "history.jsonl"
                    || path.components().any(|part| {
                        let part = part.as_os_str().to_string_lossy();
                        part == "sessions" || part == "archived_sessions"
                    })
            } else {
                is_jsonl
            }
        })
        .collect()
}

pub fn read_jsonl(path: &Path) -> Result<Vec<(usize, Value)>> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let mut values = Vec::new();
    for (index, line) in reader.lines().enumerate() {
        let line = line?;
        if line.trim().is_empty() {
            continue;
        }
        if let Ok(value) = serde_json::from_str::<Value>(&line) {
            values.push((index + 1, value));
        }
    }
    Ok(values)
}

pub fn string_at<'a>(value: &'a Value, paths: &[&[&str]]) -> Option<String> {
    for path in paths {
        let mut cursor = value;
        let mut found = true;
        for key in *path {
            if let Some(next) = cursor.get(*key) {
                cursor = next;
            } else {
                found = false;
                break;
            }
        }
        if found {
            if let Some(text) = cursor.as_str() {
                if !text.trim().is_empty() {
                    return Some(text.to_string());
                }
            }
        }
    }
    None
}

pub fn number_at(value: &Value, paths: &[&[&str]]) -> i64 {
    for path in paths {
        let mut cursor = value;
        let mut found = true;
        for key in *path {
            if let Some(next) = cursor.get(*key) {
                cursor = next;
            } else {
                found = false;
                break;
            }
        }
        if found {
            if let Some(number) = cursor.as_i64() {
                return number.max(0);
            }
            if let Some(number) = cursor.as_u64() {
                return number.min(i64::MAX as u64) as i64;
            }
            if let Some(number) = cursor.as_f64() {
                return number.max(0.0) as i64;
            }
        }
    }
    0
}
