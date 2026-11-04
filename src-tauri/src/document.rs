use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{fs, io::Write, path::Path};

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Document {
    pub kind: String,
    pub schema_version: u32,
    pub id: String,
    pub title: String,
    pub notes: String,
}
impl Document {
    pub fn new() -> Self {
        Self {
            kind: "adnd-campaign".into(),
            schema_version: 1,
            id: uuid::Uuid::new_v4().to_string(),
            title: "Untitled campaign".into(),
            notes: String::new(),
        }
    }
    pub fn validate(&self) -> Result<(), String> {
        if self.kind != "adnd-campaign" {
            return Err("Not an AD&D campaign document.".into());
        }
        if self.schema_version != 1 {
            return Err("Unsupported campaign schema version. This app supports version 1.".into());
        }
        if self.id.trim().is_empty()
            || self.title.encode_utf16().count() > 1000
            || self.notes.encode_utf16().count() > 1_000_000
        {
            return Err("Invalid campaign ID or title/notes size.".into());
        }
        Ok(())
    }
}
pub fn parse(bytes: &[u8]) -> Result<Document, String> {
    let d: Document =
        serde_json::from_slice(bytes).map_err(|e| format!("Invalid campaign JSON: {e}"))?;
    d.validate()?;
    Ok(d)
}
pub fn hash(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}
pub fn read(path: &Path) -> Result<Option<Vec<u8>>, String> {
    let meta = match fs::symlink_metadata(path) {
        Ok(m) => m,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(e) => return Err(e.to_string()),
    };
    if !meta.is_file() || meta.file_type().is_symlink() || meta.len() > 8_000_000 {
        return Err("Choose a regular campaign file smaller than 8 MB.".into());
    }
    fs::read(path).map(Some).map_err(|e| e.to_string())
}
pub const CONFLICT: &str = "The file changed or moved outside this app.";
pub fn save(path: &Path, doc: &Document, expected: Option<&str>) -> Result<String, String> {
    save_with_hook(path, doc, expected, || Ok(()))
}
fn save_with_hook(
    path: &Path,
    doc: &Document,
    expected: Option<&str>,
    hook: impl FnOnce() -> Result<(), String>,
) -> Result<String, String> {
    doc.validate()?;
    let bytes = (serde_json::to_string_pretty(doc).map_err(|e| e.to_string())? + "\n").into_bytes();
    let old = read(path)?;
    if old.as_ref().map(|b| hash(b)).as_deref() != expected {
        return Err(CONFLICT.into());
    }
    let dir = path.parent().ok_or("No parent directory")?;
    let mut temp = tempfile::NamedTempFile::new_in(dir).map_err(|e| e.to_string())?;
    temp.write_all(&bytes)
        .and_then(|_| temp.as_file().sync_all())
        .map_err(|e| e.to_string())?;
    let mut backup = if let Some(old) = &old {
        let mut file = tempfile::NamedTempFile::new_in(dir).map_err(|e| e.to_string())?;
        file.write_all(old)
            .and_then(|_| file.as_file().sync_all())
            .map_err(|e| e.to_string())?;
        Some(file)
    } else {
        None
    };
    hook()?;
    if read(path)?.as_ref().map(|b| hash(b)).as_deref() != expected {
        return Err(CONFLICT.into());
    }
    if let Some(backup) = backup.take() {
        backup
            .persist(format!("{}.bak", path.display()))
            .map_err(|e| e.to_string())?;
    }
    if expected.is_none() {
        temp.persist_noclobber(path).map_err(|e| e.to_string())?;
    } else {
        temp.persist(path).map_err(|e| e.to_string())?;
    }
    Ok(hash(&bytes))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn round_trip_backup_and_failure() {
        let dir = tempfile::tempdir().unwrap();
        let p = dir.path().join("synthetic.adnd");
        let first = Document::new();
        let rev = save(&p, &first, None).unwrap();
        let mut next = first.clone();
        next.notes = "Invented lantern expedition".into();
        assert!(save_with_hook(&p, &next, Some(&rev), || Err("Injected failure".into())).is_err());
        assert_eq!(parse(&fs::read(&p).unwrap()).unwrap(), first);
        save(&p, &next, Some(&rev)).unwrap();
        assert_eq!(parse(&fs::read(&p).unwrap()).unwrap(), next);
        assert_eq!(
            parse(&fs::read(format!("{}.bak", p.display())).unwrap()).unwrap(),
            first
        );
    }
    #[test]
    fn conflict_and_missing_file() {
        let dir = tempfile::tempdir().unwrap();
        let p = dir.path().join("synthetic.adnd");
        let doc = Document::new();
        let rev = save(&p, &doc, None).unwrap();
        fs::write(&p, "external").unwrap();
        assert_eq!(save(&p, &doc, Some(&rev)).unwrap_err(), CONFLICT);
        fs::remove_file(&p).unwrap();
        assert_eq!(save(&p, &doc, Some(&rev)).unwrap_err(), CONFLICT);
    }
    #[test]
    fn detects_change_during_staging() {
        let dir = tempfile::tempdir().unwrap();
        let p = dir.path().join("synthetic.adnd");
        let doc = Document::new();
        let rev = save(&p, &doc, None).unwrap();
        assert_eq!(
            save_with_hook(&p, &doc, Some(&rev), || {
                fs::write(&p, "external").unwrap();
                Ok(())
            })
            .unwrap_err(),
            CONFLICT
        );
        assert_eq!(fs::read_to_string(p).unwrap(), "external");
    }
    #[test]
    fn rejects_unknown_malformed_future() {
        assert!(parse(b"{bad").is_err());
        let mut v = serde_json::to_value(Document::new()).unwrap();
        v["schemaVersion"] = 2.into();
        assert!(parse(&serde_json::to_vec(&v).unwrap())
            .unwrap_err()
            .contains("schema version"));
        v["schemaVersion"] = 1.into();
        v["unknown"] = true.into();
        assert!(parse(&serde_json::to_vec(&v).unwrap()).is_err());
    }
}

#[cfg(test)]
mod legacy_tests {
    use super::*;
    #[test]
    fn legacy_json_can_be_saved_as_adnd_without_changing_identity_or_content() {
        let dir = tempfile::tempdir().unwrap();
        let legacy = dir.path().join("synthetic.adnd-campaign.json");
        let native = dir.path().join("synthetic.adnd");
        let bytes = br#"{"kind":"adnd-campaign","schemaVersion":1,"id":"legacy-synthetic-id","title":"Invented company","notes":"Only synthetic notes"}"#;
        fs::write(&legacy, bytes).unwrap();
        let doc = parse(&read(&legacy).unwrap().unwrap()).unwrap();
        save(&native, &doc, None).unwrap();
        assert_eq!(parse(&read(&native).unwrap().unwrap()).unwrap(), doc);
        assert_eq!(fs::read(&legacy).unwrap(), bytes);
    }
}
