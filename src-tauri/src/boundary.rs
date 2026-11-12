use rquickjs::{Context, Function, Runtime};
use std::time::{Duration, Instant};
/// The same bundled parser used by the frontend, with no filesystem/network bindings.
pub fn validate(text: &str) -> Result<String, String> {
    validate_transition(text, None, "")
}
pub fn validate_transition(
    text: &str,
    previous: Option<&str>,
    purpose: &str,
) -> Result<String, String> {
    let _timing = crate::diagnostics::span("boundary", text.len());
    let rt = Runtime::new().map_err(|e| e.to_string())?;
    rt.set_memory_limit(128 * 1024 * 1024);
    rt.set_max_stack_size(2 * 1024 * 1024);
    let started = Instant::now();
    #[cfg(feature = "diagnostic-harness")]
    let limit = Duration::from_millis(crate::diagnostics::validation_limit());
    #[cfg(not(feature = "diagnostic-harness"))]
    let limit = Duration::from_secs(15);
    rt.set_interrupt_handler(Some(Box::new(move || {
        started.elapsed() > limit
    })));
    let context = Context::full(&rt).map_err(|e| e.to_string())?;
    context.with(|ctx| {
        ctx.eval::<(), _>(include_str!(concat!(
            env!("OUT_DIR"),
            "/snapshot-validator.js"
        )))
        .map_err(|e| format!("Campaign validation could not finish within its limits: {e}. Your edit was not accepted; retry or discard the pending edits."))?;
        let function: Function = ctx
            .globals()
            .get("validateCampaignJson")
            .map_err(|e| e.to_string())?;
        let result: String = function
            .call((text, previous, purpose))
            .map_err(|e| format!("Campaign validation exceeded its limits or failed: {e}. Your edit was not accepted; retry or discard the pending edits."))?;
        let result: serde_json::Value = serde_json::from_str(&result).map_err(|e| e.to_string())?;
        if let Some(error) = result.get("error").and_then(|v| v.as_str()) {
            return Err(error.into());
        }
        result
            .get("document")
            .map(|v| v.to_string())
            .ok_or("Missing validated campaign".into())
    })
}
