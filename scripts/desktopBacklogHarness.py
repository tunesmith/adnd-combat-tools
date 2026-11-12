"""Run the diagnostic-feature Tauri bundle on disposable copies, never the input file.

Requires: npm run desktop:build -- --features diagnostic-harness
No campaign contents are written to diagnostics; retained copies stay in the printed
private temporary directory for inspection. Native file-picker/prompt choices are
injected in this test feature; the normal Session command and atomic save paths run.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading

parser = argparse.ArgumentParser()
parser.add_argument('--campaign', type=Path, required=True)
parser.add_argument('--mode', choices=['timing', 'validation'], default='validation')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
source = args.campaign.read_bytes()
original_hash = hashlib.sha256(source).digest()
folder = Path(tempfile.mkdtemp(prefix='adnd-backlog-'))
campaign = folder / 'campaign.adnd'
save_as = folder / 'save-as.adnd'
document = json.loads(source)
combat = next(c for c in document['workingCombats'] if c['title'] == 'Hobgoblins')
document['workspace'].update(sessionId=combat['sessionId'], view='combats')
document['workspace']['combatSelections'][combat['sessionId']] = combat['id']
campaign.write_text(json.dumps(document, indent=2) + '\n')
script = root / 'src-tauri/diagnostics' / ('timing.js' if args.mode == 'timing' else 'validation.js')
env = dict(os.environ, ADND_DIAGNOSTICS='1', ADND_DIAGNOSTIC_CAMPAIGN=str(campaign),
           ADND_DIAGNOSTIC_SCRIPT=str(script), ADND_DIAGNOSTIC_SAVE_AS=str(save_as))
app = root / 'src-tauri/target/release/bundle/macos/AD&D Campaign.app/Contents/MacOS/adnd-tools-desktop'
checks = []
external_bytes = None
disk_before_failure = None

def summary(path):
    doc = json.loads(path.read_bytes())
    fight = next(c for c in doc['workingCombats'] if c['title'] == 'Hobgoblins')
    return fight['state']['rounds'][fight['state']['activeRound']]['summary']

with (folder / 'native.log').open('w') as output:
    process = subprocess.Popen([str(app)], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    timer = threading.Timer(120, lambda: process.terminate() if process.poll() is None else None)
    timer.start()
    try:
        for line in process.stdout:
            output.write(line)
            output.flush()
            if 'ADND_RENDERER name=FAIL_' in line:
                raise RuntimeError(line.strip())
            if 'ADND_RENDERER name=pass_' in line:
                checks.append(line.strip())
            if 'name=during_save_snapshot ' in line:
                assert summary(campaign) == 'saved snapshot'
            if 'name=before_disk_failure ' in line:
                disk_before_failure = campaign.read_bytes()
            if 'name=disk_failure_preserved ' in line:
                assert campaign.read_bytes() == disk_before_failure
            if 'name=await_external_edit ' in line:
                external = json.loads(save_as.read_bytes())
                fight = next(c for c in external['workingCombats'] if c['title'] == 'Hobgoblins')
                fight['state']['rounds'][fight['state']['activeRound']]['summary'] = 'external round note'
                external_bytes = (json.dumps(external, indent=2) + '\n').encode()
                save_as.write_bytes(external_bytes)
            if 'name=pass_conflict_cancel ' in line:
                assert save_as.read_bytes() == external_bytes
        assert process.wait() == 0, 'Native process failed or timed out'
    finally:
        timer.cancel()
        if process.poll() is None:
            process.terminate()
            process.wait()
        assert hashlib.sha256(args.campaign.read_bytes()).digest() == original_hash, 'Original file changed'
final_path = save_as if args.mode == 'validation' else campaign
assert summary(final_path) == ('Immediate quit final input' if args.mode == 'validation' else 'Native typed!')
final = json.loads(final_path.read_bytes())
for key in ('banking', 'xp', 'records', 'inventoryCheckpoints', 'combatCheckpoints', 'workingInventories', 'party'):
    assert final.get(key) == document.get(key), f'{key} changed'
for original in document['workingCombats']:
    if original['id'] != combat['id']:
        assert next(c for c in final['workingCombats'] if c['id'] == original['id']) == original
assert len(checks) >= 12 if args.mode == 'validation' else True
print(f'PASS: {len(checks)} native checks; original and financial/history data preserved. Artifacts: {folder}')
