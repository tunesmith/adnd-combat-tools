"""Run the diagnostic-feature Tauri bundle on disposable copies, never the input file.

Requires: npm run desktop:build:diagnostic
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
parser.add_argument('--app', type=Path, help='Packaged executable for a comparison run')
parser.add_argument('--campaign', type=Path, required=True)
parser.add_argument('--mode', choices=['timing', 'validation', 'inventory-timing', 'inventory-validation'], default='validation')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
source = args.campaign.read_bytes()
original_hash = hashlib.sha256(source).digest()
folder = Path(tempfile.mkdtemp(prefix='adnd-backlog-'))
campaign = folder / 'campaign.adnd'
save_as = folder / 'save-as.adnd'
document = json.loads(source)
inventory_mode = args.mode.startswith('inventory-')
if inventory_mode:
    session = next(s for s in document['sessions'] if s['label'].startswith('Day5'))
    working = next(w for w in document['workingInventories'] if w['sessionId'] == session['id'])
    holder = next(h for h in working['document']['storageLocations'] if
                  len([i for i in h['inventory'] if i['catalogId'].startswith('coin-') and i.get('name')]) >= 2)
    working['document']['activeCharacterId'] = holder['id']
    document['workspace'].update(sessionId=session['id'], view='possessions')
else:
    combat = next(c for c in document['workingCombats'] if c['title'] == 'Hobgoblins')
    document['workspace'].update(sessionId=combat['sessionId'], view='combats')
    document['workspace']['combatSelections'][combat['sessionId']] = combat['id']
campaign.write_text(json.dumps(document, indent=2) + '\n')
script = root / 'src-tauri/diagnostics' / ('inventory.js' if inventory_mode else args.mode + '.js')
env = dict(os.environ, ADND_DIAGNOSTICS='1', ADND_DIAGNOSTIC_CAMPAIGN=str(campaign),
           ADND_DIAGNOSTIC_SCRIPT=str(script), ADND_DIAGNOSTIC_SAVE_AS=str(save_as))
app = args.app or root / 'desktop-build/diagnostics/release/bundle/macos/AD&D Campaign Diagnostics.app/Contents/MacOS/adnd-tools-desktop'
checks = []
external_bytes = None
disk_before_failure = None

def summary(path):
    doc = json.loads(path.read_bytes())
    fight = next(c for c in doc['workingCombats'] if c['title'] == 'Hobgoblins')
    return fight['state']['rounds'][fight['state']['activeRound']]['summary']

if inventory_mode:
    env['ADND_DIAGNOSTIC_EXPORT'] = str(folder / 'inventory-export.json')
    injected = folder / 'inventory.js'
    injected.write_text('window.inventoryValidation=' + json.dumps(args.mode == 'inventory-validation') + ';\n' + script.read_text())
    env['ADND_DIAGNOSTIC_SCRIPT'] = str(injected)
with (folder / 'native.log').open('w') as output:
    process = subprocess.Popen([str(app)], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    timer = threading.Timer(180 if args.mode == 'inventory-validation' else 120, lambda: process.terminate() if process.poll() is None else None)
    timer.start()
    try:
        for line in process.stdout:
            output.write(line)
            output.flush()
            if 'ADND_RENDERER name=FAIL_' in line:
                raise RuntimeError(line.strip())
            if 'ADND_RENDERER name=pass_' in line:
                checks.append(line.strip())
            if 'name=inventory_check_export ' in line:
                export = json.loads((folder / 'inventory-export.json').read_bytes())
                assert any(i['playerNotes'] == 'export final 確定' for h in export['storageLocations'] for i in h['inventory'])
            if 'name=inventory_during_save ' in line:
                saved = json.loads(campaign.read_bytes())
                assert any(i['playerNotes'] == 'saving snapshot' for w in saved['workingInventories'] for h in w['document']['storageLocations'] for i in h['inventory'])
            if 'name=inventory_external_edit ' in line:
                external = json.loads(save_as.read_bytes())
                external['notes'] += ' (external test)'
                external_bytes = (json.dumps(external, indent=2) + '\n').encode()
                save_as.write_bytes(external_bytes)
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
if inventory_mode:
    final = json.loads((save_as if args.mode == 'inventory-validation' else campaign).read_bytes())
    for key in ('banking', 'xp', 'records','inventoryCheckpoints','combatCheckpoints','workingCombats','party'):
        assert final.get(key) == document.get(key), f'{key} changed'
    assert 'ADND_RENDERER name=pass_inventory_exact ' in (folder / 'native.log').read_text()
    if args.mode == 'inventory-validation':
        assert any(i['playerNotes'] == 'quit final' for w in final['workingInventories'] for h in w['document']['storageLocations'] for i in h['inventory'])
        assert final['notes'].endswith(' (external test)')
        assert len(checks) >= 10
    # Independently compare saved inventories, allowing only the exact fixture edits.
    expected = json.loads(json.dumps(document['workingInventories']))
    inventory = next(w['document'] for w in expected if w['id'] == working['id'])
    location = next(h for h in inventory['storageLocations'] if h['id'] == holder['id'])
    first, second = [i for i in location['inventory'] if i['catalogId'].startswith('coin-') and i.get('name')][:2]
    first.update(day=123, playerNotes='quit final' if args.mode == 'inventory-validation' else 'first source')
    second['playerNotes'] = 'second lot'
    if args.mode == 'inventory-validation':
        other = next(h for h in inventory['characters'] if any(i.get('name') for i in h['inventory']))
        other['dmNotes'] = 'character notes test'
        next(i for i in other['inventory'] if i.get('name'))['day'] = 17
    assert final['workingInventories'] == expected
    print(f'PASS: inventory edits persisted; original and histories preserved. Artifacts: {folder}')
    raise SystemExit(0)
assert summary(final_path) == ('Immediate quit final input' if args.mode == 'validation' else 'Native typed!')
final = json.loads(final_path.read_bytes())
for key in ('banking', 'xp', 'records', 'inventoryCheckpoints', 'combatCheckpoints', 'workingInventories', 'party'):
    assert final.get(key) == document.get(key), f'{key} changed'
for original in document['workingCombats']:
    if original['id'] != combat['id']:
        assert next(c for c in final['workingCombats'] if c['id'] == original['id']) == original
assert len(checks) >= 12 if args.mode == 'validation' else True
print(f'PASS: {len(checks)} native checks; original and financial/history data preserved. Artifacts: {folder}')
