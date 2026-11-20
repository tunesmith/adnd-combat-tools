//! Cocoa can terminate directly without Tauri's ExitRequested event (e.g. Dock Quit).
//! Install the standard delegate veto so every normal termination reaches our guard.
use objc::{
    class, msg_send,
    runtime::{Object, Sel},
    sel, sel_impl,
};
use std::{
    ffi::{c_char, c_void, CStr, CString, OsStr},
    os::unix::ffi::OsStrExt,
    path::{Path, PathBuf},
    sync::{atomic::Ordering, OnceLock},
};
use tauri::{Emitter, Manager};
static APP: OnceLock<tauri::AppHandle> = OnceLock::new();
#[link(name = "objc")]
extern "C" {
    fn class_addMethod(
        class: *mut c_void,
        name: Sel,
        implementation: unsafe extern "C" fn(*mut Object, Sel, *mut Object) -> usize,
        types: *const c_char,
    ) -> bool;
}
unsafe extern "C" fn should_terminate(
    _this: *mut Object,
    _selector: Sel,
    _sender: *mut Object,
) -> usize {
    if let Some(app) = APP.get() {
        if app.state::<super::State>().exiting.load(Ordering::SeqCst) {
            return 1;
        }
        let _ = app.emit("campaign-action", "quit");
    }
    0 // NSTerminateCancel: exit explicitly only after Save/Discard completes.
}
pub fn install(app: &tauri::AppHandle) -> Result<(), String> {
    let _ = APP.set(app.clone());
    // SAFETY: setup runs on Cocoa's main thread. Tauri owns the live NSApplication
    // delegate. This adds its absent standard applicationShouldTerminate: method;
    // the callback has the matching NSUInteger(id, SEL, id) ABI and static lifetime.
    unsafe {
        let application: *mut Object = msg_send![class!(NSApplication), sharedApplication];
        let delegate: *mut Object = msg_send![application, delegate];
        if delegate.is_null() {
            return Err("Missing Cocoa application delegate".into());
        }
        let class = (*delegate).class() as *const _ as *mut c_void;
        if !class_addMethod(
            class,
            sel!(applicationShouldTerminate:),
            should_terminate,
            b"Q@:@\0".as_ptr().cast(),
        ) {
            return Err("Could not install the unsaved-document termination guard".into());
        }
    }
    Ok(())
}

extern "C" {
    fn campaign_install_recent_menu() -> bool;
    fn campaign_note_recent(path: *const c_char);
    fn campaign_clear_recents();
    fn campaign_last_recent_path() -> *const c_char;
}

#[no_mangle]
extern "C" fn campaign_recent_selected(path: *const c_char) {
    if let Some(app) = APP.get() {
        // AppKit supplies a file URL's representation for the duration of this action.
        if !path.is_null() {
            let path = unsafe { OsStr::from_bytes(CStr::from_ptr(path).to_bytes()).to_owned() };
            super::queue_open(app, path.into());
        }
    }
}

#[no_mangle]
extern "C" fn campaign_recent_clear_requested() {
    if let Some(app) = APP.get() {
        let _ = app.emit("campaign-action", "clearRecent");
    }
}

// The caller is in app setup on the main thread.
pub fn install_recent_menu() -> Result<(), String> {
    unsafe { campaign_install_recent_menu() }
        .then_some(())
        .ok_or_else(|| "Could not install Open Recent.".into())
}

fn last_recent() -> Option<PathBuf> {
    // Copy the autoreleased URL's path immediately, on the setup thread.
    unsafe {
        let path = campaign_last_recent_path();
        (!path.is_null()).then(|| PathBuf::from(OsStr::from_bytes(CStr::from_ptr(path).to_bytes())))
    }
}

pub fn note_recent(app: &tauri::AppHandle, path: &Path) -> Result<(), String> {
    let path = CString::new(path.as_os_str().as_bytes()).map_err(|e| e.to_string())?;
    app.run_on_main_thread(move || unsafe { campaign_note_recent(path.as_ptr()) })
        .map_err(|e| e.to_string())
}

pub fn clear_recents(app: &tauri::AppHandle) -> Result<(), String> {
    app.run_on_main_thread(|| unsafe { campaign_clear_recents() })
        .map_err(|e| e.to_string())
}

// Restore the old single-path preference only on the first upgraded launch.
// Opening the app should still work if the preference directory is read-only.
pub fn restore_recent(app: &tauri::AppHandle) -> Option<PathBuf> {
    let mut recent = last_recent();
    if let Ok(dir) = app.path().app_data_dir() {
        let legacy = dir.join("recent.json");
        if let Ok(bytes) = std::fs::read(&legacy) {
            if let Ok(path) = serde_json::from_slice::<PathBuf>(&bytes) {
                if recent.is_none() && path.is_file() {
                    if let Ok(path_c) = CString::new(path.as_os_str().as_bytes()) {
                        // Called in setup on the main thread, before accepting commands.
                        unsafe { campaign_note_recent(path_c.as_ptr()) };
                        recent = last_recent();
                    }
                }
                let _ = std::fs::remove_file(legacy);
            }
        }
    }
    recent
}
