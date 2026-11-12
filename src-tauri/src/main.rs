mod boundary;
mod document;
mod macos;
use document::{hash, parse, read, save, Document, CONFLICT};
use serde::Serialize;
use std::{
    fs,
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex,
    },
};
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    Emitter, Manager,
};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogResult};

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct View {
    document: Option<Document>,
    path: Option<PathBuf>,
    recent_path: Option<PathBuf>,
    dirty: bool,
    busy: bool,
    activity: Option<String>,
    save_count: u64,
    status: String,
    token: u64,
    epoch: u64,
    error: Option<String>,
}
struct Session {
    view: View,
    revision: Option<String>,
    saved: Option<Document>,
}
struct State {
    ready: AtomicBool,
    pending_open: Mutex<std::collections::VecDeque<PathBuf>>,
    session: Mutex<Session>,
    exiting: AtomicBool,
}
impl Session {
    fn check_target(&self, id: &str, token: u64) -> Result<(), String> {
        if self.view.token != token
            || self.view.document.as_ref().map(|d| d.id.as_str()) != Some(id)
        {
            return Err("Campaign changed while importing. Preview and apply again.".into());
        }
        Ok(())
    }
    fn new(recent: Option<PathBuf>) -> Self {
        Self {
            view: View {
                document: None,
                path: None,
                recent_path: recent,
                dirty: false,
                busy: false,
                activity: None,
                save_count: 0,
                status: "Create or open a campaign.".into(),
                token: 0,
                epoch: 0,
                error: None,
            },
            revision: None,
            saved: None,
        }
    }
    fn publish(&self, app: &tauri::AppHandle) {
        let _ = app.emit("campaign-state", &self.view);
        if let Some(w) = app.get_webview_window("main") {
            let _ = w.set_title(&format!(
                "{}{}",
                self.view
                    .document
                    .as_ref()
                    .map(|d| d.title.as_str())
                    .unwrap_or("AD&D Campaign"),
                if self.view.dirty { " •" } else { "" }
            ));
        }
    }
    fn remember(&mut self, app: &tauri::AppHandle, path: &PathBuf) {
        self.view.recent_path = Some(path.clone());
        let result = (|| -> Result<(), String> {
            let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            let bytes = serde_json::to_vec(path).map_err(|e| e.to_string())?;
            fs::write(dir.join("recent.tmp"), bytes).map_err(|e| e.to_string())?;
            fs::rename(dir.join("recent.tmp"), dir.join("recent.json")).map_err(|e| e.to_string())
        })();
        if result.is_err() {
            self.view.status += " (Could not remember path; use Open next time.)";
        }
    }
    fn load(&mut self, app: &tauri::AppHandle, path: PathBuf) -> Result<(), String> {
        let bytes = read(&path)?.ok_or("The campaign file is missing. Use Open to locate it; no empty replacement was created.")?;
        let doc = parse(&bytes)?;
        self.saved = Some(doc.clone());
        self.view.document = Some(doc);
        self.view.token += 1;
        self.view.epoch += 1;
        self.revision = Some(hash(&bytes));
        self.view.path = Some(path.clone());
        self.view.dirty = false;
        self.view.status = if serde_json::from_slice::<serde_json::Value>(&bytes)
            .ok()
            .and_then(|v| v.get("schemaVersion").and_then(|v| v.as_u64()))
            .map(|v| v < 21)
            .unwrap_or(false)
        {
            "Opened older campaign — first Save upgrades to V21 and preserves an original recovery copy"
        } else {
            "Opened successfully"
        }
        .into();
        self.remember(app, &path);
        Ok(())
    }
    fn prompt(app: &tauri::AppHandle, text: &str, first: &str, second: &str) -> String {
        let mut d = app.dialog().message(text).title("AD&D Campaign").buttons(
            MessageDialogButtons::YesNoCancelCustom(first.into(), second.into(), "Cancel".into()),
        );
        if let Some(w) = app.get_webview_window("main") {
            d = d.parent(&w);
        }
        match d.blocking_show_with_result() {
            MessageDialogResult::Custom(s) => s,
            MessageDialogResult::Yes => first.into(),
            MessageDialogResult::No => second.into(),
            _ => "Cancel".into(),
        }
    }
    fn save(&mut self, app: &tauri::AppHandle, as_new: bool) -> Result<bool, String> {
        let Some(doc) = self.view.document.clone() else {
            return Ok(false);
        };
        let mut path = self.view.path.clone();
        let mut revision = self.revision.clone();
        if as_new || path.is_none() {
            let mut picker = app
                .dialog()
                .file()
                .add_filter("AD&D Campaign", &["adnd"])
                .set_file_name("Untitled.adnd");
            if let Some(p) = &path {
                if let Some(dir) = p.parent() {
                    picker = picker.set_directory(dir);
                }
                let stem = p
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .trim_end_matches(".adnd-campaign.json")
                    .trim_end_matches(".json")
                    .trim_end_matches(".adnd")
                    .to_owned();
                picker = picker.set_file_name(format!("{stem}.adnd"));
            }
            let Some(selected) = picker.blocking_save_file() else {
                return Ok(false);
            };
            path = Some(selected.into_path().map_err(|e| e.to_string())?);
            let same_destination = path == self.view.path
                || match (
                    path.as_ref().and_then(|p| fs::canonicalize(p).ok()),
                    self.view
                        .path
                        .as_ref()
                        .and_then(|p| fs::canonicalize(p).ok()),
                ) {
                    (Some(a), Some(b)) => a == b,
                    _ => false,
                };
            if !same_destination {
                revision = read(path.as_ref().unwrap())?.map(|b| hash(&b));
            }
        }
        let path = path.unwrap();
        self.view.activity = Some("save".into());
        self.publish(app);
        match save(&path, &doc, revision.as_deref()) {
            Ok(rev) => {
                self.revision = Some(rev);
                self.saved = Some(doc);
                self.view.path = Some(path.clone());
                self.view.dirty = false;
                self.view.status = "Saved successfully".into();
                self.view.save_count += 1;
                self.view.error = None;
                self.remember(app, &path);
                Ok(true)
            }
            Err(e) if e == CONFLICT => {
                self.view.error = Some(e);
                match Self::prompt(app, "The campaign changed outside this app. Save As preserves your edits in another file. Reload replaces your edits with the disk version.", "Save As", "Reload") .as_str() {
                    "Save As" => self.save(app, true),
                    "Reload" => { self.load(app, path)?; self.view.error = None; Ok(false) },
                    _ => Ok(false)
                }
            }
            Err(e) => Err(e),
        }
    }
    fn can_replace(&mut self, app: &tauri::AppHandle) -> Result<bool, String> {
        if !self.view.dirty {
            return Ok(true);
        }
        match Self::prompt(
            app,
            "Save changes to this campaign? Discard loses your unsaved edits.",
            "Save",
            "Discard",
        )
        .as_str()
        {
            "Save" => self.save(app, false),
            "Discard" => Ok(true),
            _ => Ok(false),
        }
    }
    fn command(
        &mut self,
        app: &tauri::AppHandle,
        command: &str,
        opened: Option<PathBuf>,
    ) -> Result<bool, String> {
        self.view.error = None;
        if command == "save" || command == "saveAs" {
            self.save(app, command == "saveAs")?;
            return Ok(false);
        }
        if !self.can_replace(app)? {
            return Ok(false);
        }
        match command {
            "quit" => return Ok(true),
            "open" | "reopen" => {
                let path = if opened.is_some() {
                    opened
                } else if command == "reopen" {
                    self.view.recent_path.clone()
                } else {
                    let mut picker = app
                        .dialog()
                        .file()
                        .add_filter("Campaign or backup", &["adnd", "json", "bak"]);
                    if let Some(dir) = self
                        .view
                        .path
                        .as_ref()
                        .or(self.view.recent_path.as_ref())
                        .and_then(|p| p.parent())
                    {
                        picker = picker.set_directory(dir);
                    }
                    picker
                        .blocking_pick_file()
                        .map(|p| p.into_path().map_err(|e| e.to_string()))
                        .transpose()?
                };
                if let Some(path) = path {
                    self.load(app, path)?;
                }
            }
            "new" | "close" => {
                self.view.token += 1;
                self.view.epoch += 1;
                self.view.document = if command == "new" {
                    Some(Document::new())
                } else {
                    None
                };
                self.saved = None;
                self.view.path = None;
                self.revision = None;
                self.view.dirty = command == "new";
                self.view.status = if command == "new" {
                    "New campaign — not saved yet"
                } else {
                    "Campaign closed"
                }
                .into();
            }
            _ => return Err("Unknown document command".into()),
        }
        Ok(false)
    }
}
fn run(app: tauri::AppHandle, command: String, opened: Option<PathBuf>) {
    std::thread::spawn(move || {
        let state = app.state::<State>();
        let mut session = state.session.lock().unwrap();
        session.view.busy = true;
        session.view.activity = Some(command.clone());
        session.publish(&app);
        let quit = match session.command(&app, &command, opened) {
            Ok(q) => q,
            Err(e) => {
                session.view.error = Some(e);
                session.view.status = "Operation failed — your active document is intact".into();
                false
            }
        };
        session.view.busy = false;
        session.view.activity = None;
        session.publish(&app);
        if quit {
            state.exiting.store(true, Ordering::SeqCst);
            app.exit(0);
        }
    });
}
#[tauri::command]
async fn campaign_state(app: tauri::AppHandle) -> View {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<State>();
        state.ready.store(true, Ordering::SeqCst);
        let session = state.session.lock().unwrap();
        session.publish(&app);
        let view = session.view.clone();
        if !state.pending_open.lock().unwrap().is_empty() {
            let _ = app.emit("campaign-action", "openPending");
        }
        view
    })
    .await
    .unwrap()
}
#[tauri::command]
async fn campaign_edit(app: tauri::AppHandle, title: String, notes: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<State>();
        let mut s = state.session.lock().unwrap();
        if let Some(mut doc) = s.view.document.clone() {
            doc.title = title;
            doc.notes = notes;
            if doc.title.encode_utf16().count() > 1000
                || doc.notes.encode_utf16().count() > 1_000_000
            {
                return Err("Title or notes is too large".into());
            }
            if serde_json::to_vec_pretty(&doc)
                .map_err(|e| e.to_string())?
                .len()
                + 1
                > 8_000_000
            {
                return Err("Campaign exceeds 8 MB".into());
            }
            s.view.dirty = s.saved.as_ref() != Some(&doc);
            s.view.document = Some(doc);
            s.view.token += 1;
            s.view.status = if s.view.dirty {
                "Unsaved changes"
            } else {
                "No unsaved changes"
            }
            .into();
            s.view.error = None;
        }
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}
#[tauri::command]
fn campaign_command(app: tauri::AppHandle, command: String) -> Result<(), String> {
    if command == "openPending" {
        let path = app
            .state::<State>()
            .pending_open
            .lock()
            .unwrap()
            .pop_front();
        if let Some(path) = path {
            run(app, "open".into(), Some(path));
        }
        return Ok(());
    }
    if !["new", "open", "save", "saveAs", "close", "reopen", "quit"].contains(&command.as_str()) {
        return Err("Unknown command".into());
    }
    run(app, command, None);
    Ok(())
}
#[derive(serde::Deserialize)]
struct StandaloneTool { id: String, label: String, path: String }
fn standalone_tools() -> Vec<StandaloneTool> {
    serde_json::from_str(include_str!("../../src/tables/standaloneTools.json"))
        .expect("Bundled standalone tool catalog must be valid")
}

fn main() {
    tauri::Builder::default()
        .manage(State {
            ready: AtomicBool::new(false),
            pending_open: Mutex::new(std::collections::VecDeque::new()),
            session: Mutex::new(Session::new(None)),
            exiting: AtomicBool::new(false),
        })
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            campaign_state,
            campaign_edit,
            campaign_command,
            campaign_replace,
            campaign_pick_source,
            campaign_export,
            campaign_export_working
        ])
        .setup(|app| {
            let recent = app
                .path()
                .app_data_dir()
                .ok()
                .and_then(|p| fs::read(p.join("recent.json")).ok())
                .and_then(|b| serde_json::from_slice(&b).ok());
            {
                let state = app.state::<State>();
                let mut session = state.session.lock().unwrap();
                if session.view.recent_path.is_none() {
                    session.view.recent_path = recent;
                }
            }
            tauri::WebviewWindowBuilder::from_config(app, &app.config().app.windows[0])?
                .on_navigation(|url| {
                    url.scheme() == "tauri"
                        || (url.scheme() == "http" && url.host_str() == Some("tauri.localhost"))
                })
                .build()?;
            macos::install(app.handle())?;
            let menu = Menu::default(app.handle())?;
            if let Some(item) = menu.items()?.get(1) {
                menu.remove(item)?;
            }
            let file = Submenu::new(app.handle(), "File", true)?;
            for (id, label, key) in [
                ("new", "New Campaign", "CmdOrCtrl+N"),
                ("open", "Open…", "CmdOrCtrl+O"),
                ("save", "Save", "CmdOrCtrl+S"),
                ("saveAs", "Save As…", "CmdOrCtrl+Shift+S"),
                ("close", "Close Campaign", "CmdOrCtrl+W"),
            ] {
                file.append(&MenuItem::with_id(
                    app.handle(),
                    id,
                    label,
                    true,
                    Some(key),
                )?)?;
            }
            file.append(&PredefinedMenuItem::separator(app.handle())?)?;
            file.append(&MenuItem::with_id(
                app.handle(),
                "reopen",
                "Reopen Last Campaign",
                true,
                None::<&str>,
            )?)?;
            menu.insert(&file, 1)?;
            let tools = Submenu::new(app.handle(), "Tools", true)?;
            for tool in standalone_tools() {
                tools.append(&MenuItem::with_id(app.handle(), tool.id, tool.label, true, None::<&str>)?)?;
            }
            let items = menu.items()?;
            let mut tools_index = items.len();
            for (index, item) in items.into_iter().enumerate() {
                if let tauri::menu::MenuItemKind::Submenu(sub) = item {
                    if sub.text()? == "Window" {
                        if let Some(last) = sub.items()?.last() {
                            sub.remove(last)?;
                        }
                        tools_index = index;
                        break;
                    }
                }
            }
            menu.insert(&tools, tools_index)?;
            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            if let Some(tool) = standalone_tools().into_iter().find(|tool| tool.id == id) {
                let _ = app.emit("open-standalone-tool", tool.path);
            } else if ["new", "open", "save", "saveAs", "close", "reopen"].contains(&id) {
                let _ = app.emit("campaign-action", id);
            }
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if !window.state::<State>().exiting.load(Ordering::SeqCst) {
                    api.prevent_close();
                    let _ = window.emit("campaign-action", "quit");
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("Unable to build desktop app")
        .run(|app, event| match event {
            tauri::RunEvent::ExitRequested { api, .. }
                if !app.state::<State>().exiting.load(Ordering::SeqCst) =>
            {
                api.prevent_exit();
                let _ = app.emit("campaign-action", "quit");
            }
            tauri::RunEvent::Opened { urls } => {
                for url in urls {
                    if let Ok(path) = url.to_file_path() {
                        let state = app.state::<State>();
                        if state.ready.load(Ordering::SeqCst) {
                            state.pending_open.lock().unwrap().push_back(path);
                            let _ = app.emit("campaign-action", "openPending");
                        } else {
                            run(app.clone(), "open".into(), Some(path));
                        }
                    }
                }
            }
            _ => (),
        });
}

#[tauri::command]
async fn campaign_replace(
    purpose: Option<String>,
    app: tauri::AppHandle,
    id: String,
    token: u64,
    text: String,
) -> Result<View, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let document = document::parse(text.as_bytes())?;
        let state = app.state::<State>();
        let mut s = state.session.lock().unwrap();
        s.check_target(&id, token)?;
        if document.id != id {
            return Err("Campaign identity cannot be replaced".into());
        }
        document::validate_replacement_with_purpose(
            s.view.document.as_ref().unwrap(),
            &document,
            purpose.as_deref().unwrap_or(""),
        )?;
        s.view.document = Some(document);
        s.view.token += 1;
        s.view.dirty = s.view.document != s.saved;
        s.view.status = if s.view.dirty {
            "Unsaved campaign changes"
        } else {
            "No unsaved changes"
        }
        .into();
        s.view.error = None;
        s.publish(&app);
        Ok(s.view.clone())
    })
    .await
    .map_err(|e| e.to_string())?
}
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SourceInput {
    name: String,
    text: String,
}
#[tauri::command]
async fn campaign_pick_source(app: tauri::AppHandle) -> Result<Option<SourceInput>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let Some(file) = app
            .dialog()
            .file()
            .add_filter("Tool JSON", &["json"])
            .blocking_pick_file()
        else {
            return Ok(None);
        };
        let path = file.into_path().map_err(|e| e.to_string())?;
        let bytes = document::read(&path)?.ok_or("Source file is missing")?;
        if bytes.len() > 1_000_000 {
            return Err("Source exceeds 1 MB".into());
        }
        Ok(Some(SourceInput {
            name: path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
            text: String::from_utf8(bytes).map_err(|e| e.to_string())?,
        }))
    })
    .await
    .map_err(|e| e.to_string())?
}
#[tauri::command]
async fn campaign_export(
    app: tauri::AppHandle,
    id: String,
    record_id: String,
    revision_id: String,
) -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(move || {
        let (text, kind, original_path) = {
            let state = app.state::<State>();
            let s = state.session.lock().unwrap();
            let doc = s.view.document.as_ref().ok_or("No campaign open")?;
            if doc.id != id {
                return Err("Campaign changed".into());
            }
            let rev = doc
                .records
                .iter()
                .find(|r| r["id"] == record_id)
                .and_then(|r| r["revisions"].as_array())
                .and_then(|rs| rs.iter().find(|r| r["id"] == revision_id))
                .ok_or("Revision not found")?;
            (
                rev["sourceText"]
                    .as_str()
                    .ok_or("Invalid source")?
                    .to_owned(),
                rev["sourceKind"].as_str().unwrap_or("").to_owned(),
                s.view.path.clone(),
            )
        };
        let name = if kind == "tracker-url" {
            "combat-source-url.txt"
        } else if kind == "inventory-json" {
            "DM-inventory-source.json"
        } else {
            "combat-source.json"
        };
        let Some(file) = app.dialog().file().set_file_name(name).blocking_save_file() else {
            return Ok(false);
        };
        let path = file.into_path().map_err(|e| e.to_string())?;
        let current_path=app.state::<State>().session.lock().unwrap().view.path.clone();
        for protected in [original_path,current_path].into_iter().flatten() {
            for protected in [protected.clone(),PathBuf::from(format!("{}.bak",protected.display()))] {
                let normalize=|p:&std::path::Path| p.canonicalize().ok().or_else(|| Some(p.parent()?.canonicalize().ok()?.join(p.file_name()?)));
                if document::is_recovery_path(&path, &protected) || path==protected || matches!((normalize(&path),normalize(&protected)),(Some(a),Some(b)) if a==b) { return Err("Export to a different file; campaign files and their backups are protected.".into()); }
            }
        }
        // Explicitly chosen destination, write through a same-directory temporary file.
        use std::io::Write;
        let mut temp = tempfile::NamedTempFile::new_in(path.parent().ok_or("No folder")?)
            .map_err(|e| e.to_string())?;
        temp.write_all(text.as_bytes())
            .and_then(|_| temp.as_file().sync_all())
            .map_err(|e| e.to_string())?;
        temp.persist(path).map_err(|e| e.to_string())?;
        Ok(true)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod capture_target_tests {
    use super::*;
    #[test]
    fn stale_import_cannot_attach_to_replaced_or_edited_campaign() {
        let mut session = Session::new(None);
        let original = Document::new();
        let id = original.id.clone();
        session.view.document = Some(original);
        session.view.token = 12;
        assert!(session.check_target(&id, 12).is_ok());
        session.view.token += 1;
        assert!(session.check_target(&id, 12).is_err());
        session.view.document = Some(Document::new());
        assert!(session.check_target(&id, 13).is_err());
        session.view.document = None;
        assert!(session.check_target(&id, 13).is_err());
    }
}

#[tauri::command]
async fn campaign_export_working(
    app: tauri::AppHandle,
    id: String,
    epoch: u64,
    working_id: String,
) -> Result<bool, String> {
    tauri::async_runtime::spawn_blocking(move||{
        let (text,protected)={let state=app.state::<State>();let s=state.session.lock().unwrap();
            if s.view.epoch!=epoch||s.view.document.as_ref().map(|d|d.id.as_str())!=Some(id.as_str()){return Err("Campaign changed; export cancelled.".into());}
            let working=s.view.document.as_ref().unwrap().working_inventories.iter().find(|w|w["id"]==working_id).ok_or("Working inventory changed")?;
            (serde_json::to_string_pretty(&working["document"]).map_err(|e|e.to_string())?+"\n",s.view.path.clone())};
        let Some(file)=app.dialog().file().set_file_name("working-DM-inventory.json").blocking_save_file() else{return Ok(false)};
        let path=file.into_path().map_err(|e|e.to_string())?;
        let current=app.state::<State>().session.lock().unwrap().view.path.clone();
        for p in [protected,current].into_iter().flatten(){for p in [p.clone(),PathBuf::from(format!("{}.bak",p.display()))]{if document::is_recovery_path(&path,&p)||path==p||matches!((path.canonicalize().ok(),p.canonicalize().ok()),(Some(a),Some(b)) if a==b){return Err("Export to a different file; campaign and backup are protected.".into());}}}
        use std::io::Write;
        let mut temp=tempfile::NamedTempFile::new_in(path.parent().ok_or("No folder")?).map_err(|e|e.to_string())?;temp.write_all(text.as_bytes()).and_then(|_|temp.as_file().sync_all()).map_err(|e|e.to_string())?;temp.persist(path).map_err(|e|e.to_string())?;Ok(true)
    }).await.map_err(|e|e.to_string())?
}

#[cfg(test)]
mod standalone_tool_tests {
    use super::*;
    #[test]
    fn native_tool_catalog_is_unique_and_bundled() {
        let tools=standalone_tools();assert_eq!(tools.len(),6);
        let ids:std::collections::HashSet<_>=tools.iter().map(|t| &t.id).collect();
        let paths:std::collections::HashSet<_>=tools.iter().map(|t| &t.path).collect();
        assert_eq!(ids.len(),6);assert_eq!(paths.len(),6);
        for tool in tools {assert!(tool.id.starts_with("tool-"));assert!(tool.path.starts_with('/'));assert!(!tool.path.contains("://"));assert!(!tool.label.is_empty());}
    }
}
