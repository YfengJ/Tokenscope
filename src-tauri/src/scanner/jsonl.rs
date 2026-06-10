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

    let mut files = WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|entry| entry.file_type().is_file())
        .map(|entry| entry.into_path())
        .filter(|path| {
            let name = path.file_name().and_then(|value| value.to_str()).unwrap_or_default();
            let is_jsonl = path.extension().and_then(|value| value.to_str()) == Some("jsonl");
            is_jsonl || (codex_mode && name == "history.jsonl")
        })
        .collect::<Vec<_>>();
    files.sort();

    if !codex_mode {
        return files;
    }

    let preferred = files
        .iter()
        .filter(|path| is_codex_session_file(root, path))
        .cloned()
        .collect::<Vec<_>>();
    if preferred.is_empty() {
        files
    } else {
        preferred
    }
}

fn is_codex_session_file(root: &Path, path: &Path) -> bool {
    let Ok(relative) = path.strip_prefix(root) else {
        return false;
    };
    let mut components = relative.components();
    let Some(first) = components.next() else {
        return false;
    };
    let first = first.as_os_str().to_string_lossy();
    if first == "sessions" || first == "archived_sessions" {
        return path.extension().and_then(|value| value.to_str()) == Some("jsonl");
    }
    first == "history.jsonl" && components.next().is_none()
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::{fs, io::Write};

    #[test]
    fn codex_mode_prefers_real_session_files_over_tmp_or_backup_jsonl() {
        let root = tempfile::tempdir().expect("tempdir");
        let session_dir = root.path().join("sessions/2026/06/10");
        let tmp_dir = root.path().join(".tmp/plugins/plugin-eval/fixtures");
        let backup_dir = root.path().join("backup-old/files/sessions/2026/06/10");
        fs::create_dir_all(&session_dir).expect("session dir");
        fs::create_dir_all(&tmp_dir).expect("tmp dir");
        fs::create_dir_all(&backup_dir).expect("backup dir");

        fs::File::create(session_dir.join("real.jsonl"))
            .expect("real file")
            .write_all(b"{}\n")
            .expect("write real");
        fs::File::create(tmp_dir.join("responses.jsonl"))
            .expect("tmp file")
            .write_all(b"{}\n")
            .expect("write tmp");
        fs::File::create(backup_dir.join("duplicate.jsonl"))
            .expect("backup file")
            .write_all(b"{}\n")
            .expect("write backup");

        let files = jsonl_files(root.path(), true);
        assert_eq!(files, vec![session_dir.join("real.jsonl")]);
    }
}
