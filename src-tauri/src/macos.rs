//! Cocoa can terminate directly without Tauri's ExitRequested event (e.g. Dock Quit).
//! Install the standard delegate veto so every normal termination reaches our guard.
use objc::{
    class, msg_send,
    runtime::{Object, Sel},
    sel, sel_impl,
};
use std::{
    ffi::{c_char, c_void},
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
