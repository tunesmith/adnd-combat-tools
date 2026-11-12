//! Opt-in bounded timings; never log campaign contents or paths.
use std::sync::atomic::{AtomicUsize, Ordering};
use std::time::Instant;
static COUNT: AtomicUsize = AtomicUsize::new(0);
pub struct Span(&'static str, Instant, usize);
pub fn span(name: &'static str, bytes: usize) -> Span {
    Span(name, Instant::now(), bytes)
}
impl Drop for Span {
    fn drop(&mut self) {
        if std::env::var_os("ADND_DIAGNOSTICS").is_some()
            && COUNT.fetch_add(1, Ordering::Relaxed) < 2000 {
            eprintln!("ADND_TIMING name={} ms={:.3} bytes={}", self.0, self.1.elapsed().as_secs_f64()*1000.0, self.2);
        }
    }
}

// Fault injection is compiled only into the explicitly requested test bundle.
#[cfg(feature = "diagnostic-harness")]
static DELAY: AtomicUsize = AtomicUsize::new(0);
#[cfg(feature = "diagnostic-harness")]
static FAULT: AtomicUsize = AtomicUsize::new(0);
#[cfg(feature = "diagnostic-harness")]
static SAVE_DELAY: AtomicUsize = AtomicUsize::new(0);
#[cfg(feature = "diagnostic-harness")]
pub fn configure(kind: &str, value: usize) -> Result<(), String> {
    match kind {
        "prompt-cancel" => PROMPT.store(1, Ordering::SeqCst),
        "prompt-reload" => PROMPT.store(2, Ordering::SeqCst),
        "prompt-save" => PROMPT.store(3, Ordering::SeqCst),
        "save-as" => PICKER.store(1, Ordering::SeqCst),
        "delay" => DELAY.store(value.min(2000), Ordering::SeqCst),
        "reject" => FAULT.store(1, Ordering::SeqCst),
        "timeout" => FAULT.store(2, Ordering::SeqCst),
        "save-failure" => FAULT.store(3, Ordering::SeqCst),
        "save-delay" => SAVE_DELAY.store(value.min(2000), Ordering::SeqCst),
        _ => return Err("Unknown diagnostic fault".into()),
    }
    Ok(())
}
#[cfg(feature = "diagnostic-harness")]
pub fn before_replace() -> Result<(), String> {
    std::thread::sleep(std::time::Duration::from_millis(DELAY.load(Ordering::SeqCst) as u64));
    if FAULT.compare_exchange(1, 0, Ordering::SeqCst, Ordering::SeqCst).is_ok() {
        return Err("Injected replacement rejection; pending input has not been accepted".into());
    }
    Ok(())
}
#[cfg(feature = "diagnostic-harness")]
pub fn validation_limit() -> u64 {
    if FAULT.compare_exchange(2, 0, Ordering::SeqCst, Ordering::SeqCst).is_ok() { 1 } else { 15_000 }
}
#[cfg(feature = "diagnostic-harness")]
pub fn before_persist() -> Result<(), String> {
    std::thread::sleep(std::time::Duration::from_millis(SAVE_DELAY.swap(0, Ordering::SeqCst) as u64));
    if FAULT.compare_exchange(3, 0, Ordering::SeqCst, Ordering::SeqCst).is_ok() {
        return Err("Injected disk write failure; original file is intact".into());
    }
    Ok(())
}
#[cfg(feature = "diagnostic-harness")]
static PROMPT: AtomicUsize = AtomicUsize::new(0);
#[cfg(feature = "diagnostic-harness")]
static PICKER: AtomicUsize = AtomicUsize::new(0);
#[cfg(feature = "diagnostic-harness")]
pub fn prompt() -> Option<String> {
    match PROMPT.swap(0, Ordering::SeqCst) {
        1 => Some("Cancel".into()), 2 => Some("Reload".into()), 3 => Some("Save".into()), _ => None,
    }
}
#[cfg(feature = "diagnostic-harness")]
pub fn save_as() -> Option<std::path::PathBuf> {
    if PICKER.swap(0, Ordering::SeqCst) == 1 { Some(std::env::var_os("ADND_DIAGNOSTIC_SAVE_AS").map(std::path::PathBuf::from).unwrap_or_else(|| std::env::temp_dir().join("SOCK-backlog-save-as.adnd"))) } else { None }
}

pub fn renderer(name: &str, ms: f64, count: usize) {
    if std::env::var_os("ADND_DIAGNOSTICS").is_some() && name.len() < 80
        && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_')
        && COUNT.fetch_add(1, Ordering::Relaxed) < 2000 {
        eprintln!("ADND_RENDERER name={name} ms={ms:.3} count={count}");
    }
}
