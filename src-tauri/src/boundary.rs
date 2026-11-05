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
    let rt = Runtime::new().map_err(|e| e.to_string())?;
    rt.set_memory_limit(128 * 1024 * 1024);
    rt.set_max_stack_size(2 * 1024 * 1024);
    let started = Instant::now();
    rt.set_interrupt_handler(Some(Box::new(move || {
        started.elapsed() > Duration::from_secs(15)
    })));
    let context = Context::full(&rt).map_err(|e| e.to_string())?;
    context.with(|ctx| {
        ctx.eval::<(), _>(include_str!(concat!(
            env!("OUT_DIR"),
            "/snapshot-validator.js"
        )))
        .map_err(|e| format!("Campaign validator failed: {e}"))?;
        let function: Function = ctx
            .globals()
            .get("validateCampaignJson")
            .map_err(|e| e.to_string())?;
        let result: String = function
            .call((text, previous, purpose))
            .map_err(|e| format!("Campaign validation exceeded its limits or failed: {e}"))?;
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
