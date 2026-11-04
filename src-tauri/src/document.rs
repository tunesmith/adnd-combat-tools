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
    #[serde(default)]
    pub sessions: Vec<serde_json::Value>,
    #[serde(default)]
    pub records: Vec<serde_json::Value>,
    pub working_inventories: Vec<serde_json::Value>,
    pub inventory_checkpoints: Vec<serde_json::Value>,
    pub workspace: serde_json::Value,
}
impl Document {
    pub fn new() -> Self {
        Self {
            kind: "adnd-campaign".into(),
            schema_version: 3,
            id: uuid::Uuid::new_v4().to_string(),
            title: "Untitled campaign".into(),
            notes: String::new(),
            sessions: Vec::new(),
            records: Vec::new(),
            working_inventories: Vec::new(),
            inventory_checkpoints: Vec::new(),
            workspace: serde_json::json!({"sessionId":null,"view":"possessions"}),
        }
    }
    pub fn validate(&self) -> Result<(), String> {
        let text = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        if text.len() > 8_000_000 {
            return Err("Campaign exceeds 8 MB".into());
        }
        crate::boundary::validate(&text)?;
        Ok(())
    }
}
pub fn parse(bytes: &[u8]) -> Result<Document, String> {
    if bytes.len() > 8_000_000 {
        return Err("Campaign exceeds 8 MB".into());
    }
    let text = std::str::from_utf8(bytes).map_err(|e| e.to_string())?;
    let validated = crate::boundary::validate(text)?;
    let d: Document = serde_json::from_str(&validated).map_err(|e| e.to_string())?;
    if serde_json::to_vec_pretty(&d)
        .map_err(|e| e.to_string())?
        .len()
        + 1
        > 8_000_000
    {
        return Err("Campaign exceeds 8 MB when saved".into());
    }
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
    if bytes.len() > 8_000_000 {
        return Err("Campaign exceeds 8 MB".into());
    }
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
        v["schemaVersion"] = 4.into();
        assert!(parse(&serde_json::to_vec(&v).unwrap())
            .unwrap_err()
            .contains("schema version"));
        v["schemaVersion"] = 3.into();
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

pub fn validate_replacement(old: &Document, new: &Document) -> Result<(), String> {
    for checkpoint in &old.inventory_checkpoints {
        if !new.inventory_checkpoints.contains(checkpoint) {
            return Err("Historical inventory checkpoints are immutable.".into());
        }
    }
    for working in &old.working_inventories {
        if !new
            .working_inventories
            .iter()
            .any(|w| w["id"] == working["id"])
            && !new.inventory_checkpoints.iter().any(|c| {
                c["workingId"] == working["id"]
                    && c["document"] == working["document"]
                    && c["sessionId"] == working["sessionId"]
            })
        {
            return Err("Preserve a checkpoint before replacing working inventory.".into());
        }
    }
    for session in &old.sessions {
        if !new.sessions.iter().any(|s| s["id"] == session["id"]) {
            return Err("Sessions cannot be removed in B1".into());
        }
    }
    for record in &old.records {
        let next = new
            .records
            .iter()
            .find(|r| r["id"] == record["id"])
            .ok_or("Records cannot be removed in B1")?;
        if next["type"] != record["type"] {
            return Err("Record type is immutable".into());
        }
        for revision in record["revisions"].as_array().ok_or("Invalid revisions")? {
            if !next["revisions"]
                .as_array()
                .ok_or("Invalid revisions")?
                .iter()
                .any(|r| r == revision)
            {
                return Err("Stored revisions are immutable; add a revision instead".into());
            }
        }
    }
    Ok(())
}

#[cfg(test)]
mod b1_tests {
    use super::*;
    #[test]
    fn embedded_sources_survive_metadata_edits_save_and_reopen() {
        let bytes = include_bytes!("../../src/tests/fixtures/campaignB1V2.json");
        let mut doc = parse(bytes).unwrap();
        let records = doc.records.clone();
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("capture.adnd");
        let revision = save(&path, &doc, None).unwrap();
        doc.title = "Renamed synthetic campaign".into();
        doc.notes = "New metadata".into();
        save(&path, &doc, Some(&revision)).unwrap();
        let reopened = parse(&fs::read(&path).unwrap()).unwrap();
        assert_eq!(reopened.records, records);
        assert_eq!(reopened.title, doc.title);
        doc.records[0]["revisions"][0]["sourceText"] = "{}".into();
        assert!(doc.validate().is_err());
    }
    #[test]
    fn migration_preserves_original_bytes_until_save_then_backs_up_v1() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("old.adnd");
        let bytes=br#"{"kind":"adnd-campaign","schemaVersion":1,"id":"kept","title":"Old","notes":"Keep"}"#;
        fs::write(&path, bytes).unwrap();
        let doc = parse(bytes).unwrap();
        assert_eq!(doc.schema_version, 3);
        assert_eq!(fs::read(&path).unwrap(), bytes);
        save(&path, &doc, Some(&hash(bytes))).unwrap();
        assert_eq!(fs::read(format!("{}.bak", path.display())).unwrap(), bytes);
    }
    #[test]
    fn immutable_revision_cannot_be_replaced_by_metadata_update() {
        let doc = parse(include_bytes!("../../src/tests/fixtures/campaignB1V2.json")).unwrap();
        let mut next = doc.clone();
        next.records[0]["revisions"][0]["sourceName"] = "Changed".into();
        assert!(validate_replacement(&doc, &next).is_err());
    }
}

#[cfg(test)]
mod working_tests {
    use super::*;
    #[test]
    fn working_inventory_and_immutable_history_survive_save_and_reopen() {
        let mut doc = parse(include_bytes!("../../src/tests/fixtures/campaignB1V2.json")).unwrap();
        let original = doc.records.clone();
        let inventory = doc.records[1]["revisions"][0]["payload"].clone();
        doc.working_inventories.push(serde_json::json!({"id":"working","sessionId":"session-1","title":"Working possessions","document":inventory,"origin":{"kind":"import","recordId":"inventory-1","revisionId":"inventory-r1"}}));
        doc.inventory_checkpoints.push(serde_json::json!({"id":"checkpoint","workingId":"working","sessionId":"session-1","label":"Before edits","capturedAt":"2026-11-04T12:00:00.000Z","document":inventory}));
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("working.adnd");
        let revision = save(&path, &doc, None).unwrap();
        doc.working_inventories[0]["document"]["characters"][0]["inventory"][2]["quantity"] =
            6.into();
        save(&path, &doc, Some(&revision)).unwrap();
        let reopened = parse(&fs::read(&path).unwrap()).unwrap();
        assert_eq!(reopened.records, original);
        assert_eq!(
            reopened.working_inventories[0]["document"]["characters"][0]["inventory"][2]
                ["quantity"],
            6
        );
        assert_eq!(
            reopened.inventory_checkpoints[0]["document"]["characters"][0]["inventory"][2]
                ["quantity"],
            2
        );
        let mut tampered = reopened.clone();
        tampered.inventory_checkpoints.clear();
        assert!(validate_replacement(&reopened, &tampered).is_err());
        tampered = reopened.clone();
        tampered.working_inventories.clear();
        assert!(validate_replacement(&reopened, &tampered).is_err());
    }
}

#[cfg(test)]
mod v2_migration_tests {
    use super::*;
    #[test]
    fn v2_save_preserves_complete_original_backup_and_all_b1_evidence() {
        let bytes = include_bytes!("../../src/tests/fixtures/campaignB1V2.json");
        let original: serde_json::Value = serde_json::from_slice(bytes).unwrap();
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("v2.adnd");
        fs::write(&path, bytes).unwrap();
        let doc = parse(&fs::read(&path).unwrap()).unwrap();
        assert_eq!(doc.schema_version, 3);
        assert_eq!(fs::read(&path).unwrap(), bytes);
        save(&path, &doc, Some(&hash(bytes))).unwrap();
        assert_eq!(fs::read(format!("{}.bak", path.display())).unwrap(), bytes);
        let restored = parse(&fs::read(path).unwrap()).unwrap();
        assert_eq!(
            serde_json::to_value(restored.records).unwrap(),
            original["records"]
        );
        assert_eq!(
            serde_json::to_value(restored.sessions).unwrap(),
            original["sessions"]
        );
    }
}
