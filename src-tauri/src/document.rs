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
    pub working_combats: Vec<serde_json::Value>,
    pub combat_checkpoints: Vec<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub party: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub xp: Option<serde_json::Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub banking: Option<serde_json::Value>,
}
impl Document {
    pub fn new() -> Self {
        Self {
            kind: "adnd-campaign".into(),
            schema_version: 18,
            id: uuid::Uuid::new_v4().to_string(),
            title: "Untitled campaign".into(),
            notes: String::new(),
            sessions: Vec::new(),
            records: Vec::new(),
            working_inventories: Vec::new(),
            inventory_checkpoints: Vec::new(),
            working_combats: Vec::new(),
            combat_checkpoints: Vec::new(),
            party: None,
            xp: None,
            banking: None,
            workspace: serde_json::json!({"sessionId":null,"view":"possessions","combatSelections":{}}),
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
    // Decide from the actual on-disk schema, not the already migrated editor state.
    let upgrading = old.as_ref().and_then(|b| serde_json::from_slice::<serde_json::Value>(b).ok())
        .and_then(|v| v.get("schemaVersion").and_then(|v| v.as_u64()))
        .map(|version| version < u64::from(doc.schema_version)).unwrap_or(false);
    let backup = if upgrading {
        let mut backup = tempfile::NamedTempFile::new_in(dir).map_err(|e| e.to_string())?;
        backup.write_all(old.as_ref().ok_or("Missing original campaign")?)
            .and_then(|_| backup.as_file().sync_all()).map_err(|e| e.to_string())?;
        Some(backup)
    } else { None };
    hook()?;
    if read(path)?.as_ref().map(|b| hash(b)).as_deref() != expected {
        return Err(CONFLICT.into());
    }
    if let Some(mut backup) = backup {
        let mut suffix = 1_u32;
        loop {
            let recovery = if suffix == 1 { format!("{}.bak", path.display()) }
                else { format!("{}.upgrade-{}.bak", path.display(), suffix) };
            match backup.persist_noclobber(&recovery) {
                Ok(_) => break,
                Err(error) if error.error.kind() == std::io::ErrorKind::AlreadyExists => {
                    // A prior failed upgrade may already have retained these exact bytes.
                    if read(Path::new(&recovery)).ok().flatten().as_deref() == old.as_deref() {
                        break;
                    }
                    backup = error.file;
                    suffix = suffix.checked_add(1).ok_or("Too many recovery backups")?;
                }
                Err(error) => return Err(error.to_string()),
            }
        }
    }
    if expected.is_none() {
        temp.persist_noclobber(path).map_err(|e| e.to_string())?;
    } else {
        temp.persist(path).map_err(|e| e.to_string())?;
    }
    Ok(hash(&bytes))
}
pub fn is_recovery_path(candidate: &Path, campaign: &Path) -> bool {
    let normalize = |p: &Path| p.parent()?.canonicalize().ok().map(|parent| parent.join(p.file_name().unwrap_or_default()));
    let (Some(candidate), Some(campaign)) = (normalize(candidate), normalize(campaign)) else { return false; };
    if candidate.parent() != campaign.parent() { return false; }
    let Some(base) = campaign.file_name().and_then(|s| s.to_str()) else { return false; };
    let Some(name) = candidate.file_name().and_then(|s| s.to_str()) else { return false; };
    name == format!("{base}.bak") || name.strip_prefix(&format!("{base}.upgrade-"))
        .and_then(|tail| tail.strip_suffix(".bak")).map(|n| !n.is_empty() && n.bytes().all(|b| b.is_ascii_digit())).unwrap_or(false)
}

#[cfg(test)]
fn current_test_inventory(doc: &Document) -> serde_json::Value {
    let mut inventory = doc.records[1]["revisions"][0]["payload"].clone();
    inventory["version"] = 10.into();
    inventory["storageLocations"] = serde_json::json!([]);
    inventory
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
        assert!(!dir.path().join("synthetic.adnd.bak").exists());
        let rev = hash(&fs::read(&p).unwrap());
        save(&p, &next, Some(&rev)).unwrap();
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 1);
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
        v["schemaVersion"] = 19.into();
        assert!(parse(&serde_json::to_vec(&v).unwrap())
            .unwrap_err()
            .contains("schema version"));
        v["schemaVersion"] = 8.into();
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

#[cfg(test)]
pub fn validate_replacement(old: &Document, new: &Document) -> Result<(), String> {
    validate_replacement_with_purpose(old, new, "")
}
pub fn validate_replacement_with_purpose(
    old: &Document,
    new: &Document,
    purpose: &str,
) -> Result<(), String> {
    crate::boundary::validate_transition(
        &serde_json::to_string(new).map_err(|e| e.to_string())?,
        Some(&serde_json::to_string(old).map_err(|e| e.to_string())?),
        purpose,
    )?;
    for checkpoint in &old.combat_checkpoints {
        if !new.combat_checkpoints.contains(checkpoint) {
            return Err("Combat checkpoints are immutable.".into());
        }
    }
    for combat in &old.working_combats {
        let next = new
            .working_combats
            .iter()
            .find(|c| c["id"] == combat["id"])
            .ok_or("Encounters cannot be removed in this slice")?;
        if next["sessionId"] != combat["sessionId"]
            || next["encounterId"] != combat["encounterId"]
            || next["continuedFrom"] != combat["continuedFrom"]
        {
            return Err(
                "Existing encounter instance identity and lineage cannot be reassigned.".into(),
            );
        }
        if next["generation"] != combat["generation"] {
            if next["generation"].as_u64()
                != combat["generation"].as_u64().and_then(|g| g.checked_add(1))
            {
                return Err("Invalid encounter generation.".into());
            }
            if next["removedAt"] == combat["removedAt"]
                && !new.combat_checkpoints.iter().any(|c| {
                    c["combatId"] == combat["id"]
                        && c["sessionId"] == combat["sessionId"]
                        && c["state"] == combat["state"]
                })
            {
                return Err("Checkpoint the encounter before restoring history.".into());
            }
        }
    }
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
        assert_eq!(doc.schema_version, 18);
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
        let inventory = current_test_inventory(&doc);
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
        assert_eq!(doc.schema_version, 18);
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
            serde_json::Value::Array(
                original["sessions"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|s| {
                        let mut s = s.clone();
                        s["notes"] = "".into();
                        s
                    })
                    .collect()
            )
        );
    }
}

#[cfg(test)]
mod combat_tests {
    use super::*;
    #[test]
    fn v3_migration_combat_inventory_history_backup_conflict_and_failure() {
        let mut doc = parse(include_bytes!("../../src/tests/fixtures/campaignB1V2.json")).unwrap();
        let inventory = current_test_inventory(&doc);
        doc.working_inventories.push(serde_json::json!({"id":"inventory","sessionId":"session-1","title":"Possessions","document":inventory,"origin":{"kind":"empty"}}));
        let mut old = serde_json::to_value(&doc).unwrap();
        old["schemaVersion"] = 3.into();
        for session in old["sessions"].as_array_mut().unwrap() {
            session.as_object_mut().unwrap().remove("notes");
        }
        old.as_object_mut().unwrap().remove("workingCombats");
        old.as_object_mut().unwrap().remove("combatCheckpoints");
        old["workspace"]
            .as_object_mut()
            .unwrap()
            .remove("combatSelections");
        let old_bytes = serde_json::to_vec_pretty(&old).unwrap();
        doc = parse(&old_bytes).unwrap();
        assert_eq!(doc.working_inventories[0]["document"], inventory);
        let state = doc.records[0]["revisions"][0]["payload"].clone();
        for id in ["gate", "bridge"] {
            doc.working_combats.push(serde_json::json!({"id":id,"sessionId":"session-1","title":id,"generation":0,"encounterId":id,"status":"unspecified","state":state,"origin":{"kind":"empty"}}));
        }
        doc.combat_checkpoints.push(serde_json::json!({"id":"gate-history","combatId":"gate","sessionId":"session-1","label":"At gate","capturedAt":"2026-11-04T12:00:00.000Z","state":state}));
        doc.working_combats[0]["state"]["rounds"][1]["partyStates"][0]["hp"] = "7".into();
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("combat.adnd");
        fs::write(&path, &old_bytes).unwrap();
        let revision = save(&path, &doc, Some(&hash(&old_bytes))).unwrap();
        assert_eq!(
            fs::read(format!("{}.bak", path.display())).unwrap(),
            old_bytes
        );
        assert_eq!(parse(&fs::read(&path).unwrap()).unwrap(), doc);
        let mut next = doc.clone();
        next.working_combats[0]["generation"] = 1.into();
        assert!(validate_replacement(&doc, &next).is_err());
        let mut preserved = doc.combat_checkpoints[0].clone();
        preserved["id"] = "before-restore".into();
        preserved["state"] = doc.working_combats[0]["state"].clone();
        next.combat_checkpoints.push(preserved);
        next.working_combats[0]["state"] = state;
        assert!(validate_replacement(&doc, &next).is_ok());
        let before = fs::read(&path).unwrap();
        assert!(save_with_hook(&path, &next, Some(&revision), || Err(
            "synthetic failure".into()
        ))
        .is_err());
        assert_eq!(fs::read(&path).unwrap(), before);
        fs::write(&path, "external").unwrap();
        assert_eq!(save(&path, &next, Some(&revision)).unwrap_err(), CONFLICT);
        assert_eq!(fs::read_to_string(&path).unwrap(), "external");
        next.combat_checkpoints[0]["label"] = "tampered".into();
        assert!(validate_replacement(&doc, &next).is_err());
    }
}

#[cfg(test)]
mod history_ownership_tests {
    use super::*;
    #[test]
    fn native_boundary_rejects_unrelated_restore_even_with_a_preserved_current_checkpoint() {
        let mut doc = parse(include_bytes!("../../src/tests/fixtures/campaignB1V2.json")).unwrap();
        let mut other = doc.records[0].clone();
        other["id"] = "other-source".into();
        other["revisions"][0]["id"] = "other-revision".into();
        other["currentRevisionId"] = "other-revision".into();
        doc.records.push(other);
        let state = doc.records[0]["revisions"][0]["payload"].clone();
        doc.working_combats.push(serde_json::json!({"id":"A","sessionId":"session-1","title":"Renamable","generation":0,"encounterId":"A","status":"unspecified","state":state,"origin":{"kind":"import","recordId":"combat-1","revisionId":"combat-r1"}}));
        let mut next = doc.clone();
        next.combat_checkpoints.push(serde_json::json!({"id":"preserved","combatId":"A","sessionId":"session-1","label":"Before","capturedAt":"2026-11-04T12:00:00.000Z","state":state}));
        next.working_combats[0]["generation"] = 1.into();
        next.working_combats[0]["origin"] = serde_json::json!({"kind":"import","recordId":"other-source","revisionId":"other-revision"});
        assert!(validate_replacement(&doc, &next)
            .unwrap_err()
            .contains("belong"));
        next.working_combats[0]["origin"] = doc.working_combats[0]["origin"].clone();
        assert!(validate_replacement(&doc, &next).is_ok());
    }
}

#[cfg(test)]
mod continuity_tests {
    use super::*;
    #[test]
    fn dense_profiles_upgrade_and_survive_save_failure_conflict_and_reopen() {
        let expanded = parse(include_bytes!(
            "../../src/tests/fixtures/campaignProfilesV8.json"
        ))
        .unwrap();
        let mut legacy = serde_json::to_value(&expanded).unwrap();
        legacy["schemaVersion"] = 7.into();
        for profile in legacy["party"]["profiles"].as_array_mut().unwrap() {
            profile.as_object_mut().unwrap().remove("reference");
        }
        let bytes = serde_json::to_vec_pretty(&legacy).unwrap();
        let migrated = parse(&bytes).unwrap();
        assert_eq!(migrated.schema_version, 18);
        assert!(migrated.party.as_ref().unwrap()["profiles"][0]["reference"].is_null());
        validate_replacement(&migrated, &expanded).unwrap();
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("dense.adnd");
        fs::write(&path, &bytes).unwrap();
        let revision = save(&path, &expanded, Some(&hash(&bytes))).unwrap();
        assert_eq!(fs::read(format!("{}.bak", path.display())).unwrap(), bytes);
        assert_eq!(parse(&fs::read(&path).unwrap()).unwrap(), expanded);
        let saved = fs::read(&path).unwrap();
        assert!(save_with_hook(&path, &expanded, Some(&revision), || Err(
            "Injected write failure".into()
        ))
        .is_err());
        assert_eq!(fs::read(&path).unwrap(), saved);
        fs::write(&path, b"External change").unwrap();
        assert_eq!(
            save(&path, &expanded, Some(&revision)).unwrap_err(),
            CONFLICT
        );
        assert_eq!(fs::read(&path).unwrap(), b"External change");
    }

    #[test]
    fn v6_campaign_upgrades_without_changing_evidence_or_backup_bytes() {
        let mut source =
            parse(include_bytes!("../../src/tests/fixtures/campaignB1V2.json")).unwrap();
        let state = source.records[0]["revisions"][0]["payload"].clone();
        let inventory = current_test_inventory(&source);
        source.working_combats.push(serde_json::json!({"id":"fight","encounterId":"fight","status":"unspecified","sessionId":"session-1","title":"Invented fight","generation":1,"removedAt":"2026-11-04T12:00:00.000Z","state":state,"origin":{"kind":"import","recordId":"combat-1","revisionId":"combat-r1"}}));
        source.working_inventories.push(serde_json::json!({"id":"inventory","sessionId":"session-1","title":"Invented possessions","document":inventory,"origin":{"kind":"import","recordId":"inventory-1","revisionId":"inventory-r1"}}));
        source.combat_checkpoints.push(serde_json::json!({"id":"earlier","combatId":"fight","sessionId":"session-1","label":"Before","capturedAt":"2026-11-04T12:00:00.000Z","state":state}));
        source.party = Some(serde_json::json!({
            "roster":[{"id":"pc","name":"Synthetic scout","player":"","notes":"Character notes"}],
            "profiles":[{"characterId":"pc","sessionId":"session-1","characterClass":"cleric","baseLevel":6,"saveBasis":"printed","combatBasis":"class","retainedFighter":null,"retainedThief":null,"adjustment":{"name":"Lantern","enabled":true},"participating":true,"overrides":[null,null,null,null,null],"saveNotes":["","Save note",""]}]
        }));
        let mut legacy = serde_json::to_value(&source).unwrap();
        legacy["schemaVersion"] = 6.into();
        legacy["party"]["inventoryLinks"] = serde_json::json!([]);
        legacy["party"]["combatLinks"] = serde_json::json!([]);
        let bytes = serde_json::to_vec_pretty(&legacy).unwrap();
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("legacy-v6.adnd");
        fs::write(&path, &bytes).unwrap();
        let migrated = parse(&fs::read(&path).unwrap()).unwrap();
        assert_eq!(migrated, source);
        assert_eq!(fs::read(&path).unwrap(), bytes);
        save(&path, &migrated, Some(&hash(&bytes))).unwrap();
        assert_eq!(fs::read(format!("{}.bak", path.display())).unwrap(), bytes);
        assert_eq!(parse(&fs::read(&path).unwrap()).unwrap(), migrated);
        let mut recovered = migrated.clone();
        recovered.working_combats[0]["generation"] = 2.into();
        recovered.working_combats[0]
            .as_object_mut()
            .unwrap()
            .remove("removedAt");
        assert!(validate_replacement(&migrated, &recovered).is_ok());
        recovered.working_combats[0]["state"]["rounds"][0]["party"][0]["level"] = 17.into();
        assert!(validate_replacement(&migrated, &recovered).is_err());
    }

    #[test]
    fn v4_upgrade_native_continuation_exact_state_backup_failure_and_reopen() {
        let mut source =
            parse(include_bytes!("../../src/tests/fixtures/campaignB1V2.json")).unwrap();
        let state = source.records[0]["revisions"][0]["payload"].clone();
        let inventory = current_test_inventory(&source);
        source.working_combats.push(serde_json::json!({"id":"ongoing","encounterId":"ongoing","status":"unspecified","sessionId":"session-1","title":"Invented fight","generation":0,"state":state,"origin":{"kind":"import","recordId":"combat-1","revisionId":"combat-r1"}}));
        source.working_inventories.push(serde_json::json!({"id":"inventory","sessionId":"session-1","title":"Invented possessions","document":inventory,"origin":{"kind":"import","recordId":"inventory-1","revisionId":"inventory-r1"}}));
        source.workspace = serde_json::json!({"sessionId":"session-1","view":"combats","combatSelections":{"session-1":"ongoing"}});
        let mut legacy = serde_json::to_value(&source).unwrap();
        legacy["schemaVersion"] = 4.into();
        for session in legacy["sessions"].as_array_mut().unwrap() {
            session.as_object_mut().unwrap().remove("notes");
        }
        for combat in legacy["workingCombats"].as_array_mut().unwrap() {
            combat.as_object_mut().unwrap().remove("encounterId");
            combat.as_object_mut().unwrap().remove("status");
        }
        let legacy_bytes = serde_json::to_vec_pretty(&legacy).unwrap();
        let mut source = parse(&legacy_bytes).unwrap();
        assert_eq!(source.working_combats[0]["status"], "unspecified");
        assert_eq!(source.sessions[0]["notes"], "");
        source.working_combats[0]["status"] = "in-progress".into();
        source.sessions[0]["notes"] = "Stopping point\nRemember lantern".into();
        let context = serde_json::json!({"session":source.sessions[0],"records":source.records,"combats":source.working_combats,"inventory":source.working_inventories,"selected":"ongoing"});
        let fingerprint = hash(&serde_json::to_vec(&context).unwrap());
        let choices = serde_json::json!({"sourceSessionId":"session-1","sourceFingerprint":fingerprint,"combatInstanceIds":["ongoing"],"inventoryId":"inventory","copyNotes":true});
        let mut request = choices.clone();
        request["destinationId"] = "next".into();
        request["label"] = "After the gate".into();
        let request_fingerprint = hash(&serde_json::to_vec(&request).unwrap());
        let mut lineage = choices;
        lineage["requestFingerprint"] = request_fingerprint.into();
        let mut next = source.clone();
        next.sessions.push(serde_json::json!({"id":"next","label":"After the gate","notes":source.sessions[0]["notes"],"continuation":lineage}));
        let at = "2026-11-04T12:00:00.000Z";
        next.combat_checkpoints.push(serde_json::json!({"id":"combat-before-next","combatId":"ongoing","sessionId":"session-1","label":"Before next","capturedAt":at,"state":state,"origin":source.working_combats[0]["origin"],"status":"in-progress"}));
        next.inventory_checkpoints.push(serde_json::json!({"id":"inventory-before-next","workingId":"inventory","sessionId":"session-1","label":"Before next","capturedAt":at,"document":inventory,"origin":source.working_inventories[0]["origin"]}));
        let mut combat = source.working_combats[0].clone();
        combat["id"] = "ongoing-next".into();
        combat["sessionId"] = "next".into();
        combat["origin"] =
            serde_json::json!({"kind":"checkpoint","checkpointId":"combat-before-next"});
        combat["continuedFrom"] = serde_json::json!({"sessionId":"session-1","instanceId":"ongoing","checkpointId":"combat-before-next"});
        next.working_combats.push(combat);
        let mut possessions = source.working_inventories[0].clone();
        possessions["id"] = "inventory-next".into();
        possessions["sessionId"] = "next".into();
        possessions["origin"] =
            serde_json::json!({"kind":"checkpoint","checkpointId":"inventory-before-next"});
        possessions["continuedFrom"] = serde_json::json!({"sessionId":"session-1","instanceId":"inventory","checkpointId":"inventory-before-next"});
        next.working_inventories.push(possessions);
        next.workspace["sessionId"] = "next".into();
        next.workspace["view"] = "session".into();
        next.workspace["combatSelections"]["next"] = "ongoing-next".into();
        validate_replacement(&source, &next).unwrap();
        let mut invalid = next.clone();
        invalid.working_combats[1]["state"]["activeRound"] = 0.into();
        assert!(validate_replacement(&source, &invalid).is_err());
        invalid = next.clone();
        invalid.combat_checkpoints.clear();
        assert!(validate_replacement(&source, &invalid).is_err());
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("continuation.adnd");
        fs::write(&path, &legacy_bytes).unwrap();
        let revision = save(&path, &next, Some(&hash(&legacy_bytes))).unwrap();
        assert_eq!(
            fs::read(format!("{}.bak", path.display())).unwrap(),
            legacy_bytes
        );
        let reopened = parse(&fs::read(&path).unwrap()).unwrap();
        assert_eq!(reopened, next);
        let mut later = reopened.clone();
        later.working_combats[1]["state"]["rounds"][1]["partyStates"][0]["hp"] = "3".into();
        later.working_inventories[1]["document"]["characters"][0]["inventory"][2]["quantity"] =
            9.into();
        later.sessions[1]["notes"] = "New-session notes".into();
        validate_replacement(&reopened, &later).unwrap();
        assert_eq!(later.working_combats[0], source.working_combats[0]);
        assert_eq!(later.sessions[0], source.sessions[0]);
        assert_eq!(later.combat_checkpoints, reopened.combat_checkpoints);
        assert_eq!(later.inventory_checkpoints, reopened.inventory_checkpoints);
        let bytes = fs::read(&path).unwrap();
        assert!(save_with_hook(&path, &later, Some(&revision), || Err(
            "Injected failure".into()
        ))
        .is_err());
        assert_eq!(fs::read(&path).unwrap(), bytes);
        save(&path, &later, Some(&revision)).unwrap();
        assert_eq!(parse(&fs::read(&path).unwrap()).unwrap(), later);
    }
}

#[cfg(test)]
mod storage_save_tests {
    use super::*;
    #[test]
    fn upgrades_once_without_clobbering_existing_recovery_and_keeps_routine_saves_quiet() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("synthetic-storage.adnd");
        let mut old = serde_json::to_value(Document::new()).unwrap();
        old["schemaVersion"] = 8.into();
        let original = serde_json::to_vec_pretty(&old).unwrap();
        fs::write(&path, &original).unwrap();
        let previous_backup = dir.path().join("synthetic-storage.adnd.bak");
        fs::write(&previous_backup, "existing recovery").unwrap();
        let mut doc = parse(&original).unwrap();
        let rev = save(&path, &doc, Some(&hash(&original))).unwrap();
        assert_eq!(fs::read(&previous_backup).unwrap(), b"existing recovery");
        let upgrade = dir.path().join("synthetic-storage.adnd.upgrade-2.bak");
        assert_eq!(fs::read(&upgrade).unwrap(), original);
        doc.notes = "Routine edit".into();
        let rev = save(&path, &doc, Some(&rev)).unwrap();
        save(&path, &doc, Some(&rev)).unwrap();
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 3);
        assert_eq!(fs::read(&upgrade).unwrap(), original);
        assert!(is_recovery_path(&upgrade, &path));
        assert!(is_recovery_path(&previous_backup, &path));
        // Save As overwrite is the same atomic/current-schema path.
        let other = dir.path().join("save-as.adnd");
        let old_rev = save(&other, &Document::new(), None).unwrap();
        save(&other, &doc, Some(&old_rev)).unwrap();
        assert!(!dir.path().join("save-as.adnd.bak").exists());
        let bytes = fs::read(&path).unwrap();
        assert!(save_with_hook(&path, &doc, Some(&hash(&bytes)), || Err("Injected failure".into())).is_err());
        assert_eq!(fs::read(&path).unwrap(), bytes);
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 4);
    }
    #[test]
    fn v8_storage_upgrade_retains_old_checkpoint_and_exact_original_then_reopens_new_storage() {
        let mut legacy = serde_json::from_str::<serde_json::Value>(include_str!("../../src/tests/fixtures/campaignB1V2.json")).unwrap();
        legacy["schemaVersion"] = 8.into();
        let inventory = legacy["records"][1]["revisions"][0]["payload"].clone();
        legacy["workingInventories"] = serde_json::json!([{"id":"inventory","sessionId":"session-1","title":"Possessions","document":inventory,"origin":{"kind":"empty"}}]);
        legacy["inventoryCheckpoints"] = serde_json::json!([{"id":"checkpoint","workingId":"inventory","sessionId":"session-1","label":"Old stock","capturedAt":"2026-11-07T12:00:00.000Z","document":inventory}]);
        legacy["workingCombats"] = serde_json::json!([]);
        legacy["combatCheckpoints"] = serde_json::json!([]);
        legacy["workspace"] = serde_json::json!({"sessionId":"session-1","view":"possessions","combatSelections":{}});
        let bytes = serde_json::to_vec_pretty(&legacy).unwrap();
        let mut doc = parse(&bytes).unwrap();
        assert_eq!(doc.inventory_checkpoints[0]["document"], inventory);
        assert_eq!(doc.working_inventories[0]["document"]["version"], 10);
        let items = doc.working_inventories[0]["document"]["characters"][0]["inventory"].take();
        doc.working_inventories[0]["document"]["characters"][0]["inventory"] = serde_json::json!([]);
        doc.working_inventories[0]["document"]["storageLocations"] = serde_json::json!([{"id":"castle","name":"Synthetic Castle","notes":"Test only","inventory":items}]);
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("legacy.adnd");
        fs::write(&path, &bytes).unwrap();
        let rev = save(&path, &doc, Some(&hash(&bytes))).unwrap();
        let reopened = parse(&fs::read(&path).unwrap()).unwrap();
        assert_eq!(reopened, doc);
        assert_eq!(fs::read(dir.path().join("legacy.adnd.bak")).unwrap(), bytes);
        save(&path, &reopened, Some(&rev)).unwrap();
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 2);
    }
}

#[cfg(test)]
mod xp_tests {
    use super::*;
    fn replay() -> (Document, Document) {
        let fixture: serde_json::Value = serde_json::from_str(include_str!("../../src/tests/fixtures/xpSyntheticReplay.json")).unwrap();
        let accepted = parse(&serde_json::to_vec(&fixture["confirmed"]).unwrap()).unwrap();
        let corrected = parse(&serde_json::to_vec(&fixture["corrected"]).unwrap()).unwrap();
        (accepted, corrected)
    }
    #[test]
    fn native_exact_xp_replay_correction_history_quiet_save_failure_and_reopen() {
        // This executes the shared BigInt calculator inside the actual QuickJS boundary.
        let (accepted, corrected) = replay();
        let mut legacy = serde_json::to_value(&accepted).unwrap();
        legacy["schemaVersion"] = 9.into();
        legacy["workspace"]["view"] = "session".into();
        legacy.as_object_mut().unwrap().remove("xp");
        let original = serde_json::to_vec_pretty(&legacy).unwrap();
        let migrated = parse(&original).unwrap();
        assert_eq!(migrated.schema_version, 18);
        assert!(migrated.xp.is_none());
        validate_replacement(&migrated, &accepted).unwrap();
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("synthetic-xp.adnd");
        fs::write(&path, &original).unwrap();
        let revision = save(&path, &accepted, Some(&hash(&original))).unwrap();
        assert_eq!(fs::read(dir.path().join("synthetic-xp.adnd.bak")).unwrap(), original);
        let reopened = parse(&fs::read(&path).unwrap()).unwrap();
        assert_eq!(reopened, accepted);
        let xp = reopened.xp.as_ref().unwrap();
        assert_eq!(xp["events"][0]["rows"][0]["award"], 507);
        assert_eq!(xp["events"][0]["rows"][3]["award"], 461);
        assert_eq!(xp["events"][0]["rows"][0]["allocations"][0]["calculated"], "129/5");
        assert_eq!(xp["events"][0]["rows"][0]["allocations"][0]["accepted"], "26");
        assert_eq!(xp["rewards"].as_array().unwrap().len(), 4);
        assert_eq!(xp["events"].as_array().unwrap().len(), 1);
        validate_replacement(&accepted, &corrected).unwrap();
        let bytes = fs::read(&path).unwrap();
        assert!(save_with_hook(&path, &corrected, Some(&revision), || Err("Injected failure".into())).is_err());
        assert_eq!(fs::read(&path).unwrap(), bytes);
        save(&path, &corrected, Some(&revision)).unwrap();
        assert_eq!(parse(&fs::read(&path).unwrap()).unwrap(), corrected);
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 2);
        assert_eq!(fs::read(dir.path().join("synthetic-xp.adnd.bak")).unwrap(), original);
        let mut changed = corrected.clone();
        changed.xp.as_mut().unwrap()["events"][0]["rows"][0]["award"] = 999.into();
        assert!(changed.validate().is_err());
        assert!(validate_replacement(&corrected, &changed).is_err());
        let mut duplicate = accepted.clone();
        let event = duplicate.xp.as_ref().unwrap()["events"][0].clone();
        duplicate.xp.as_mut().unwrap()["events"].as_array_mut().unwrap().push(event);
        assert!(duplicate.validate().is_err());
        let actual = fs::read(&path).unwrap();
        fs::write(&path, b"external synthetic edit").unwrap();
        assert_eq!(save(&path, &corrected, Some(&hash(&actual))).unwrap_err(), CONFLICT);
        assert_eq!(fs::read(&path).unwrap(), b"external synthetic edit");
    }
}

#[cfg(test)]
mod xp_cap_tests {
    use super::*;
    #[test]
    fn caps_rebase_migration_atomic_failure_conflict_and_reopen() {
        let fixture: serde_json::Value = serde_json::from_str(include_str!("../../src/tests/fixtures/xpCapReplay.json")).unwrap();
        let capped = parse(&serde_json::to_vec(&fixture["capped"]).unwrap()).unwrap();
        let row = &capped.xp.as_ref().unwrap()["events"][0]["rows"][0];
        assert_eq!(row["fullAward"], 550);
        assert_eq!(row["award"], 201);
        assert_eq!(row["discarded"], 349);
        assert_eq!(row["cap"]["limit"], 35001);
        assert_eq!(row["after"], 35001);
        let accepted = parse(&serde_json::to_vec(&fixture["accepted"]).unwrap()).unwrap();
        let corrected = parse(&serde_json::to_vec(&fixture["corrected"]).unwrap()).unwrap();
        validate_replacement(&accepted, &corrected).unwrap();
        let xp = corrected.xp.as_ref().unwrap();
        assert_eq!(xp["events"][3]["rows"][0]["award"],151);
        assert_eq!(xp["events"][3]["rows"][0]["discarded"],49);
        assert_eq!(xp["events"][3]["rows"][0]["cap"]["baseLevel"],5);
        let dir=tempfile::tempdir().unwrap();
        let path=dir.path().join("synthetic-cap.adnd");
        let bytes=serde_json::to_vec(&accepted).unwrap();fs::write(&path,&bytes).unwrap();
        assert!(save_with_hook(&path,&corrected,Some(&hash(&bytes)),|| Err("Injected cap save failure".into())).is_err());
        assert_eq!(fs::read(&path).unwrap(),bytes);
        save(&path,&corrected,Some(&hash(&bytes))).unwrap();
        assert_eq!(parse(&fs::read(&path).unwrap()).unwrap(),corrected);
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(),1);
        let actual=fs::read(&path).unwrap();fs::write(&path,b"external synthetic change").unwrap();
        assert_eq!(save(&path,&corrected,Some(&hash(&actual))).unwrap_err(),CONFLICT);
        assert_eq!(fs::read(&path).unwrap(),b"external synthetic change");
        let legacy=dir.path().join("legacy.adnd");let original=serde_json::to_vec_pretty(&fixture["legacy"]).unwrap();
        fs::write(&legacy,&original).unwrap();fs::write(dir.path().join("legacy.adnd.bak"),b"existing backup").unwrap();
        let migrated=parse(&original).unwrap();assert_eq!(migrated.schema_version,18);
        assert_eq!(migrated.xp.as_ref().unwrap()["events"],fixture["legacy"]["xp"]["events"]);
        save(&legacy,&migrated,Some(&hash(&original))).unwrap();
        assert_eq!(fs::read(dir.path().join("legacy.adnd.bak")).unwrap(),b"existing backup");
        assert_eq!(fs::read(dir.path().join("legacy.adnd.upgrade-2.bak")).unwrap(),original);
        assert_eq!(parse(&fs::read(&legacy).unwrap()).unwrap().xp.as_ref().unwrap()["events"],fixture["legacy"]["xp"]["events"]);
    }
}

#[cfg(test)]
mod xp_extension_tests {
    use super::*;

    #[test]
    fn reconciled_batch_requires_prior_drafts_and_saves_atomically() {
        let bytes = include_bytes!("../../src/tests/fixtures/xpExtensionReplay.json");
        let accepted = parse(bytes).unwrap();
        let mut draft = accepted.clone();
        let xp = draft.xp.as_mut().unwrap();
        let audit = xp.as_object_mut().unwrap().remove("extensions").unwrap();
        let batch = &audit[0];
        xp["events"].as_array_mut().unwrap().truncate(1);
        for opening in xp["openings"].as_array_mut().unwrap() {
            if let Some(entry) = batch["openings"]
                .as_array()
                .unwrap()
                .iter()
                .find(|entry| entry["previous"]["id"] == opening["id"])
            {
                *opening = entry["previous"].clone();
            }
        }
        for point in xp["points"].as_array_mut().unwrap() {
            if batch["eventIds"].as_array().unwrap().contains(&point["confirmedEventId"]) {
                point["confirmedEventId"] = serde_json::Value::Null;
            }
        }
        draft.validate().unwrap();
        validate_replacement(&draft, &accepted).unwrap();
        let mut tampered = accepted.clone();
        tampered.xp.as_mut().unwrap()["events"][0]["confirmedAt"] =
            "2026-11-08T12:00:00.000Z".into();
        assert!(validate_replacement_with_purpose(&draft, &tampered, "xp-extension").is_err());
        let mut wrong_total = accepted.clone();
        wrong_total.xp.as_mut().unwrap()["extensions"][0]["openings"][0]["applied"] = 4001.into();
        assert!(wrong_total.validate().is_err());
        let mut unreviewed = draft.clone();
        unreviewed.xp.as_mut().unwrap()["points"][1]["label"] = "Different draft".into();
        assert!(validate_replacement(&unreviewed, &accepted).is_err());

        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("synthetic-extension.adnd");
        let mut legacy = serde_json::to_value(&draft).unwrap();
        legacy["schemaVersion"] = 12.into();
        let original = serde_json::to_vec(&legacy).unwrap();
        fs::write(&path, &original).unwrap();
        let migrated = parse(&original).unwrap();
        assert_eq!(migrated, draft);
        let rev = save(&path, &migrated, Some(&hash(&original))).unwrap();
        let draft_bytes = fs::read(&path).unwrap();
        let backup = dir.path().join("synthetic-extension.adnd.bak");
        assert_eq!(fs::read(&backup).unwrap(), original);
        assert!(save_with_hook(&path, &accepted, Some(&rev), || Err("Injected save failure".into())).is_err());
        assert_eq!(fs::read(&path).unwrap(), draft_bytes);
        fs::write(&path, b"external synthetic change").unwrap();
        assert_eq!(save(&path, &accepted, Some(&rev)).unwrap_err(), CONFLICT);
        assert_eq!(fs::read(&path).unwrap(), b"external synthetic change");
        fs::write(&path, draft_bytes).unwrap();
        save(&path, &accepted, Some(&rev)).unwrap();
        let reopened = parse(&fs::read(&path).unwrap()).unwrap();
        assert_eq!(reopened, accepted);
        assert_eq!(reopened.xp.unwrap()["events"][0], draft.xp.unwrap()["events"][0]);
        assert_eq!(fs::read(&backup).unwrap(), original);
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 2);
    }
}

#[cfg(test)]
mod banking_tests {
    use super::*;
    #[test]
    fn banking_money_is_atomic_validated_and_survives_native_save_and_reopen() {
        let after = parse(include_bytes!("../../src/tests/fixtures/bankingNative.json")).unwrap();
        let mut before = after.clone();
        before.banking.as_mut().unwrap()["entries"] = serde_json::json!([]);
        let opening_inventory = before.working_inventories.iter()
            .find(|w| w["sessionId"] == "day2").unwrap()["document"].clone();
        before.working_inventories.iter_mut()
            .find(|w| w["sessionId"] == "day3").unwrap()["document"] = opening_inventory;
        before.validate().unwrap();
        validate_replacement(&before, &after).unwrap();
        let mut unbalanced = after.clone();
        unbalanced.banking.as_mut().unwrap()["entries"][0]["kind"] = "transfer".into();
        assert!(unbalanced.validate().is_err());
        unbalanced.banking.as_mut().unwrap()["entries"][0]["kind"] = "exchange".into();
        assert!(unbalanced.validate().is_err());
        let mut missing_money = after.clone();
        missing_money.working_inventories = before.working_inventories.clone();
        assert!(validate_replacement(&before, &missing_money).is_err());
        let mut missing_ledger = after.clone();
        missing_ledger.banking = before.banking.clone();
        assert!(validate_replacement(&before, &missing_ledger).is_err());
        let mut rewritten = after.clone();
        rewritten.banking.as_mut().unwrap()["entries"][0]["description"] = "Changed prior record".into();
        assert!(validate_replacement(&after, &rewritten).is_err());
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("synthetic-bank.adnd");
        let mut old = serde_json::to_value(&before).unwrap();
        old.as_object_mut().unwrap().remove("banking");
        old["schemaVersion"] = 14.into();
        let original = serde_json::to_vec(&old).unwrap();
        fs::write(&path, &original).unwrap();
        let migrated = parse(&original).unwrap();
        assert_eq!(migrated.schema_version, 18);
        let revision = save(&path, &before, Some(&hash(&original))).unwrap();
        assert_eq!(fs::read(dir.path().join("synthetic-bank.adnd.bak")).unwrap(), original);
        let saved = fs::read(&path).unwrap();
        assert!(save_with_hook(&path, &after, Some(&revision), || Err("Injected banking failure".into())).is_err());
        assert_eq!(fs::read(&path).unwrap(), saved);
        save(&path, &after, Some(&revision)).unwrap();
        assert_eq!(parse(&fs::read(&path).unwrap()).unwrap(), after);
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 2);
        let latest = fs::read(&path).unwrap();
        fs::write(&path, b"external synthetic edit").unwrap();
        assert_eq!(save(&path, &after, Some(&hash(&latest))).unwrap_err(), CONFLICT);
        assert_eq!(fs::read(&path).unwrap(), b"external synthetic edit");
    }
}

#[cfg(test)]
mod existing_money_tests {
    use super::*;
    #[test]
    fn receipts_allocate_existing_money_once_without_mutating_possessions() {
        let after = parse(include_bytes!("../../src/tests/fixtures/bankingExistingNative.json")).unwrap();
        let mut before = after.clone();
        before.banking.as_mut().unwrap()["entries"] = serde_json::json!([]);
        before.validate().unwrap();
        validate_replacement(&before, &after).unwrap();
        assert_eq!(before.working_inventories, after.working_inventories);
        assert_eq!(before.xp, after.xp);
        let entry = &after.banking.as_ref().unwrap()["entries"][0];
        assert_eq!(entry["receiptMode"], "existing");
        assert_eq!(entry["effect"], "ledger");
        let mut duplicate = after.clone();
        let mut receipt = entry.clone();
        receipt["id"] = "duplicate-existing-receipt".into();
        receipt["transactionId"] = "duplicate-transaction".into();
        receipt["order"] = 1.into();
        duplicate.banking.as_mut().unwrap()["entries"].as_array_mut().unwrap().push(receipt);
        assert!(validate_replacement(&after, &duplicate).is_err());
        let mut changed_money = after.clone();
        changed_money.working_inventories[0]["document"]["characters"][0]["inventory"][3]["quantity"] = 301.into();
        assert!(validate_replacement(&before, &changed_money).is_err());
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("synthetic-existing-money.adnd");
        let mut legacy = serde_json::to_value(&before).unwrap();
        legacy["schemaVersion"] = 15.into();
        let original = serde_json::to_vec(&legacy).unwrap();
        fs::write(&path, &original).unwrap();
        assert_eq!(parse(&original).unwrap(), before);
        let rev = save(&path, &before, Some(&hash(&original))).unwrap();
        assert_eq!(fs::read(dir.path().join("synthetic-existing-money.adnd.bak")).unwrap(), original);
        let saved = fs::read(&path).unwrap();
        assert!(save_with_hook(&path, &after, Some(&rev), || Err("Injected existing money failure".into())).is_err());
        assert_eq!(fs::read(&path).unwrap(), saved);
        save(&path, &after, Some(&rev)).unwrap();
        let reopened = parse(&fs::read(&path).unwrap()).unwrap();
        assert_eq!(reopened, after);
        assert_eq!(reopened.working_inventories, before.working_inventories);
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 2);
        let current = fs::read(&path).unwrap();
        fs::write(&path, b"external edit").unwrap();
        assert_eq!(save(&path, &after, Some(&hash(&current))).unwrap_err(), CONFLICT);
        assert_eq!(fs::read(&path).unwrap(), b"external edit");
    }
}

#[cfg(test)]
mod existing_transfer_tests {
    use super::*;

    #[test]
    fn reviewed_transfers_relocate_ledger_balances_without_moving_money_twice() {
        let mut before = parse(include_bytes!("../../src/tests/fixtures/bankingExistingNative.json")).unwrap();
        before.sessions.push(serde_json::json!({"id":"day2","label":"Day 2"}));
        let mut working = before.working_inventories[0].clone();
        working["id"] = "day2-stock".into();
        working["sessionId"] = "day2".into();
        let items = working["document"]["characters"][0]["inventory"].as_array_mut().unwrap();
        let mut coins: Vec<serde_json::Value> = items.iter()
            .filter(|i| i["catalogId"] == "coin-electrum").cloned().collect();
        items.retain(|i| i["catalogId"] != "coin-electrum");
        for coin in &mut coins { coin["containerId"] = serde_json::Value::Null; }
        working["document"]["storageLocations"][0]["inventory"] = serde_json::json!(coins);
        before.working_inventories.push(working);
        before.validate().unwrap();
        let mut source = coins[0].clone();
        source["id"] = "ledger-balance:reatha-inventory:ep".into();
        source["name"] = "Recorded ledger balance".into();
        source["quantity"] = 700.into();
        let mut changes = Vec::new();
        for coin in &coins {
            let quantity = coin["quantity"].as_i64().unwrap();
            changes.push(serde_json::json!({"holderId":"reatha-inventory","denomination":"ep","quantity":-quantity,"item":source}));
            changes.push(serde_json::json!({"holderId":"castle-storage","denomination":"ep","quantity":quantity,"item":coin}));
        }
        let entry = serde_json::json!({
            "id":"native-existing-transfer","transactionId":"chest-move","sessionId":"day2",
            "replaces":null,"order":0,"description":"Chest transfer already in possessions",
            "kind":"transfer","status":"posted","effect":"ledger","receiptMode":"existing",
            "changes":changes,"at":"2026-11-10T12:00:00.000Z"
        });
        let mut after = before.clone();
        after.banking.as_mut().unwrap()["entries"].as_array_mut().unwrap().push(entry.clone());
        after.validate().unwrap();
        validate_replacement(&before, &after).unwrap();
        assert_eq!(before.working_inventories, after.working_inventories);
        assert_eq!(before.xp, after.xp);
        let mut duplicate = after.clone();
        let mut repeated = entry.clone();
        repeated["id"] = "duplicate-transfer".into();
        repeated["transactionId"] = "duplicate-transfer".into();
        repeated["order"] = 1.into();
        duplicate.banking.as_mut().unwrap()["entries"].as_array_mut().unwrap().push(repeated);
        assert!(validate_replacement(&after, &duplicate).is_err());
        let mut unbalanced = after.clone();
        unbalanced.banking.as_mut().unwrap()["entries"][1]["changes"][0]["quantity"] = (-301).into();
        assert!(unbalanced.validate().is_err());
        let mut changed_money = after.clone();
        changed_money.working_inventories[1]["document"]["storageLocations"][0]["inventory"][0]["quantity"] = 301.into();
        assert!(validate_replacement(&before, &changed_money).is_err());
        let mut revised = entry.clone();
        revised["id"] = "revised-transfer".into();
        revised["replaces"] = "native-existing-transfer".into();
        revised["description"] = "Clarified transfer note".into();
        let mut edited = after.clone();
        edited.banking.as_mut().unwrap()["entries"].as_array_mut().unwrap().push(revised.clone());
        validate_replacement(&after, &edited).unwrap();
        let mut removed = edited.clone();
        revised["id"] = "deleted-transfer".into();
        revised["replaces"] = "revised-transfer".into();
        revised["status"] = "void".into();
        removed.banking.as_mut().unwrap()["entries"].as_array_mut().unwrap().push(revised);
        validate_replacement(&edited, &removed).unwrap();
        assert_eq!(removed.working_inventories, before.working_inventories);
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("synthetic-existing-transfer.adnd");
        let mut legacy = serde_json::to_value(&before).unwrap();
        legacy["schemaVersion"] = 16.into();
        let original = serde_json::to_vec(&legacy).unwrap();
        fs::write(&path, &original).unwrap();
        assert_eq!(parse(&original).unwrap(), before);
        let revision = save(&path, &before, Some(&hash(&original))).unwrap();
        let saved = fs::read(&path).unwrap();
        assert!(save_with_hook(&path, &after, Some(&revision), || Err("Injected transfer failure".into())).is_err());
        assert_eq!(fs::read(&path).unwrap(), saved);
        save(&path, &after, Some(&revision)).unwrap();
        let reopened = parse(&fs::read(&path).unwrap()).unwrap();
        assert_eq!(reopened, after);
        assert_eq!(reopened.working_inventories, before.working_inventories);
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 2);
        assert_eq!(fs::read(dir.path().join("synthetic-existing-transfer.adnd.bak")).unwrap(), original);
    }
}

#[cfg(test)]
mod multiclass_tests {
    use super::*;
    #[test]
    fn multiclass_awards_round_trip_atomically_with_independent_caps() {
        let after = parse(include_bytes!("../../src/tests/fixtures/multiclassNative.json")).unwrap();
        let row = &after.xp.as_ref().unwrap()["events"][0]["rows"][0];
        assert_eq!(row["award"], 66);
        assert_eq!(row["classes"][0]["award"], 11);
        assert_eq!(row["classes"][0]["discarded"], 44);
        assert_eq!(row["classes"][1]["after"], 1155);
        let mut before = after.clone();
        before.xp.as_mut().unwrap()["events"] = serde_json::json!([]);
        before.xp.as_mut().unwrap()["points"][0]["confirmedEventId"] = serde_json::Value::Null;
        before.validate().unwrap();
        validate_replacement(&before, &after).unwrap();
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("multiclass.adnd");
        let revision=save(&path, &before, None).unwrap();
        let original=fs::read(&path).unwrap();
        assert!(save_with_hook(&path, &after, Some(&revision), || Err("Synthetic failed save".into())).is_err());
        assert_eq!(fs::read(&path).unwrap(), original);
        let revision=save(&path, &after, Some(&revision)).unwrap();
        assert_eq!(parse(&fs::read(&path).unwrap()).unwrap(), after);
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(), 1);
        let mut tampered=after.clone();
        tampered.xp.as_mut().unwrap()["events"][0]["rows"][0]["classes"][0]["award"]=55.into();
        assert!(tampered.validate().is_err());
        assert!(validate_replacement(&after, &tampered).is_err());
        fs::write(&path,b"external synthetic edit").unwrap();
        assert_eq!(save(&path,&after,Some(&revision)).unwrap_err(),CONFLICT);
        assert_eq!(fs::read(&path).unwrap(),b"external synthetic edit");
    }
}

#[cfg(test)]
mod party_order_tests {
    use super::*;
    #[test]
    fn roster_display_order_saves_without_rewriting_xp_or_upgrading_schema() {
        let before=parse(include_bytes!("../../src/tests/fixtures/multiclassNative.json")).unwrap();
        let mut after=before.clone();
        after.party.as_mut().unwrap()["roster"].as_array_mut().unwrap().swap(0,1);
        after.validate().unwrap();
        validate_replacement(&before,&after).unwrap();
        assert_eq!(after.xp,before.xp);
        assert_eq!(after.party.as_ref().unwrap()["profiles"],before.party.as_ref().unwrap()["profiles"]);
        let dir=tempfile::tempdir().unwrap();
        let path=dir.path().join("party-order.adnd");
        let revision=save(&path,&before,None).unwrap();
        save(&path,&after,Some(&revision)).unwrap();
        let reopened=parse(&fs::read(&path).unwrap()).unwrap();
        assert_eq!(reopened,after);
        assert_eq!(reopened.party.unwrap()["roster"][0]["id"],"xp-tal");
        assert_eq!(fs::read_dir(dir.path()).unwrap().count(),1);
    }
}
