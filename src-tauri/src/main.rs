mod boundary;
mod diagnostics;
mod document;
mod macos;
use document::{hash, parse, read, save_accepted, Document, CONFLICT};
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
    pending_open: Mutex<Vec<(String, PathBuf)>>,
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
        #[cfg(feature = "diagnostic-harness")]
        if std::env::var_os("ADND_DIAGNOSTIC_CAMPAIGN").is_some() {
            self.view.recent_path = Some(path.clone());
            return;
        }
        self.view.recent_path = Some(path.clone());
        if macos::note_recent(app, path).is_err() {
            self.view.status += " (Could not update Open Recent.)";
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
        self.view.status = "Opened successfully".into();
        self.remember(app, &path);
        Ok(())
    }
    fn prompt(app: &tauri::AppHandle, text: &str, first: &str, second: &str) -> String {
        #[cfg(feature = "diagnostic-harness")]
        if let Some(choice) = diagnostics::prompt() { return choice; }
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
            #[cfg(feature = "diagnostic-harness")]
            let injected = diagnostics::save_as();
            #[cfg(not(feature = "diagnostic-harness"))]
            let injected: Option<PathBuf> = None;
            path = if let Some(selected) = injected { Some(selected) } else {
                let Some(selected) = picker.blocking_save_file() else { return Ok(false); };
                Some(selected.into_path().map_err(|e| e.to_string())?)
            };
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
        match save_accepted(&path, &doc, revision.as_deref()) {
            Ok(rev) => {
                self.revision = Some(rev);
                self.saved = Some(doc);
                let new_path = self.view.path.as_ref() != Some(&path);
                self.view.path = Some(path.clone());
                self.view.dirty = false;
                self.view.status = "Saved successfully".into();
                self.view.save_count += 1;
                self.view.error = None;
                if new_path {
                    self.remember(app, &path);
                }
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
        if command == "clearRecent" {
            macos::clear_recents(app)?;
            self.view.recent_path = None;
            return Ok(false);
        }
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
fn run_command(app: tauri::AppHandle, command: String, opened: Option<PathBuf>) -> Result<(), String> {
    let state = app.state::<State>();
    let _command = diagnostics::span("command_total", 0);
    let lock = diagnostics::span("command_lock_wait", 0);
    let mut session = state.session.lock().map_err(|e| e.to_string())?;
    drop(lock);
    session.view.busy = true;
    session.view.activity = Some(command.clone());
    session.publish(&app);
    let result = session.command(&app, &command, opened);
    if let Err(error) = &result {
        session.view.error = Some(error.clone());
        session.view.status = "Operation failed — your active document is intact".into();
    }
    session.view.busy = false;
    session.view.activity = None;
    session.publish(&app);
    if matches!(result, Ok(true)) {
        state.exiting.store(true, Ordering::SeqCst);
        app.exit(0);
    }
    result.map(|_| ())
}
#[tauri::command]
async fn campaign_state(app: tauri::AppHandle) -> View {
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<State>();
        {
            let pending = state.pending_open.lock().unwrap();
            if !state.ready.swap(true, Ordering::SeqCst) {
                for (id, _) in pending.iter() {
                    let _ = app.emit("campaign-action", format!("openPending:{id}"));
                }
            }
        }
        let session = state.session.lock().unwrap();
        session.publish(&app);
        session.view.clone()
    })
    .await
    .unwrap()
}
#[tauri::command]
async fn campaign_command(app: tauri::AppHandle, command: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        if let Some((action @ ("openPending" | "cancelPending"), id)) = command.split_once(':') {
            // Only a path supplied by Finder or selected in the native menu is eligible.
            let path = {
                let state = app.state::<State>();
                let mut pending = state.pending_open.lock().unwrap();
                pending.iter().position(|(key, _)| key == id).map(|i| pending.remove(i).1)
            };
            if let ("openPending", Some(path)) = (action, path) {
                return run_command(app, "open".into(), Some(path));
            }
            return Ok(());
        }
        if !["new", "open", "save", "saveAs", "close", "reopen", "quit", "clearRecent"].contains(&command.as_str()) {
            return Err("Unknown command".into());
        }
        run_command(app, command, None)
    }).await.map_err(|e| e.to_string())?
}
#[derive(serde::Deserialize)]
struct StandaloneTool { id: String, label: String, path: String }
fn standalone_tools() -> Vec<StandaloneTool> {
    serde_json::from_str(include_str!("../../src/tables/standaloneTools.json"))
        .expect("Bundled standalone tool catalog must be valid")
}

fn queue_open(app: &tauri::AppHandle, path: PathBuf) {
    let state = app.state::<State>();
    let id = uuid::Uuid::new_v4().to_string();
    let mut pending = state.pending_open.lock().unwrap();
    pending.push((id.clone(), path));
    if state.ready.load(Ordering::SeqCst) {
        let _ = app.emit("campaign-action", format!("openPending:{id}"));
    }
}

fn main() {
    tauri::Builder::default()
        .manage(State {
            ready: AtomicBool::new(false),
            pending_open: Mutex::new(Vec::new()),
            session: Mutex::new(Session::new(None)),
            exiting: AtomicBool::new(false),
        })
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            campaign_diagnostic,
            campaign_diagnostic_fault,
            campaign_state,
            campaign_command,
            campaign_replace,
            campaign_pick_source,
            campaign_export,
            campaign_export_working
        ])
        .setup(|app| {
            let builder = tauri::WebviewWindowBuilder::from_config(app, &app.config().app.windows[0])?;
            #[cfg(feature = "diagnostic-harness")]
            let builder = if let Ok(path) = std::env::var("ADND_DIAGNOSTIC_SCRIPT") {
                builder.initialization_script(fs::read_to_string(path)?)
            } else { builder };
            builder
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
                if id == "open" {
                    file.append(&Submenu::new(app.handle(), "Open Recent", true)?)?;
                }
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
            macos::install_recent_menu()?;
            #[cfg(feature = "diagnostic-harness")]
            if let Ok(path) = std::env::var("ADND_DIAGNOSTIC_CAMPAIGN") {
                app.state::<State>().session.lock().unwrap().load(app.handle(), path.into())?;
                return Ok(());
            }
            let recent = macos::restore_recent(app.handle());
            app.state::<State>().session.lock().unwrap().view.recent_path = recent;
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
                        queue_open(app, path);
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
        let _total = diagnostics::span("replace_total", text.len());
        #[cfg(feature = "diagnostic-harness")]
        diagnostics::before_replace()?;
        let state = app.state::<State>();
        let lock = diagnostics::span("replace_lock_wait", 0);
        let mut s = state.session.lock().unwrap();
        drop(lock);
        s.check_target(&id, token)?;
        let history = diagnostics::span("replace_history", 0);
        let document = document::parse_replacement(text.as_bytes(),
            s.view.document.as_ref().unwrap(), purpose.as_deref().unwrap_or(""))?;
        if document.id != id { return Err("Campaign identity cannot be replaced".into()); }
        drop(history);
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
        #[cfg(feature = "diagnostic-harness")]
        let injected = std::env::var_os("ADND_DIAGNOSTIC_EXPORT").map(PathBuf::from);
        #[cfg(not(feature = "diagnostic-harness"))]
        let injected: Option<PathBuf> = None;
        let path = if let Some(path) = injected { path } else {
            let Some(file)=app.dialog().file().set_file_name("working-DM-inventory.json").blocking_save_file() else{return Ok(false)};
            file.into_path().map_err(|e|e.to_string())?
        };
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

#[tauri::command]
fn campaign_diagnostic(name: String, ms: f64, count: usize) {
    diagnostics::renderer(&name, ms, count);
}

#[tauri::command]
fn campaign_diagnostic_fault(app: tauri::AppHandle, kind: String, value: usize) -> Result<(), String> {
    #[cfg(feature = "diagnostic-harness")]
    {
        if kind == "menu-save" { return app.emit("campaign-action", "save").map_err(|e| e.to_string()); }
        diagnostics::configure(&kind, value)
    }
    #[cfg(not(feature = "diagnostic-harness"))]
    { let _ = (app, kind, value); Err("Diagnostics are not enabled in this build".into()) }
}
