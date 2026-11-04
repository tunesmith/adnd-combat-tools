fn main() {
    let root = std::path::PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap()).join("..");
    let output =
        std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap()).join("snapshot-validator.js");
    let status = std::process::Command::new("node")
        .current_dir(&root)
        .arg("scripts/buildCampaignBoundary.cjs")
        .arg(output)
        .status()
        .expect("Node and npm ci are required to build the shared campaign validator");
    assert!(
        status.success(),
        "Shared campaign validator build failed; run npm ci first"
    );
    println!("cargo:rerun-if-changed=../src");
    println!("cargo:rerun-if-changed=../scripts");
    println!("cargo:rerun-if-changed=../package-lock.json");
    tauri_build::build()
}
