#!/usr/bin/env python3
from pathlib import Path
import re
import sys
import yaml

ROOT = Path(__file__).resolve().parent
REQ_FILE = ROOT / "00_UX_REQUIREMENTS.yaml"
MAP_FILE = ROOT / "00_REQUIREMENT_PHASE_MAP.md"
PLAN_FILE = ROOT / "00_IMPLEMENTATION_PLAN.md"

errors = []

try:
    data = yaml.safe_load(REQ_FILE.read_text())
except Exception as exc:
    print(f"errors=1\nPARSE {exc}")
    sys.exit(1)

if data.get("plan") != "detail_edit_ux_overhaul":
    errors.append("supplemental requirements plan id mismatch")

requirements = data.get("requirements") or []
acceptance = data.get("acceptance_criteria") or []
req_ids = [item.get("id") for item in requirements]
ac_ids = [item.get("id") for item in acceptance]
req_set = set(req_ids)
ac_set = set(ac_ids)

if not req_ids:
    errors.append("no supplemental requirements found")
if len(req_set) != len(req_ids):
    errors.append("duplicate supplemental requirement ids")
if any(not isinstance(rid, str) or not re.fullmatch(r"UX-EDIT-\d{3}", rid) for rid in req_ids):
    errors.append("invalid supplemental requirement id format")

if not ac_ids:
    errors.append("no supplemental acceptance criteria found")
if len(ac_set) != len(ac_ids):
    errors.append("duplicate supplemental acceptance ids")
if any(not isinstance(aid, str) or not re.fullmatch(r"AC-UX-EDIT-\d{3}", aid) for aid in ac_ids):
    errors.append("invalid supplemental acceptance id format")

covered = set()
for item in acceptance:
    refs = item.get("requirement_ids") or []
    if not refs:
        errors.append(f"{item.get('id')} has no requirement references")
    for rid in refs:
        if rid not in req_set:
            errors.append(f"{item.get('id')} references unknown requirement {rid}")
        covered.add(rid)
for rid in req_ids:
    if rid not in covered:
        errors.append(f"requirement {rid} has no acceptance coverage")

map_text = MAP_FILE.read_text()
for rid in req_ids:
    if f"`{rid}`" not in map_text:
        errors.append(f"requirement {rid} missing from phase coverage map")

plan_text = PLAN_FILE.read_text()
for phase in range(1, 6):
    phase_id = f"{phase:02d}"
    matches = list(ROOT.glob(f"{phase_id}_*.md"))
    if len(matches) != 1:
        errors.append(f"expected exactly one phase file for {phase_id}, found {len(matches)}")
    if not re.search(rf"^\| {phase_id} \|", plan_text, re.MULTILINE):
        errors.append(f"master plan phase index missing phase {phase_id}")

for required in [
    "00_UX_REVIEW.md",
    "00_UX_REQUIREMENTS.yaml",
    "00_UX_DESIGN.md",
    "00_BASELINE_REVIEW.md",
    "00_IMPLEMENTATION_PLAN.md",
    "00_REQUIREMENT_PHASE_MAP.md",
    "97_ADVERSARIAL_REVIEW.md",
    "98_MECHANICAL_AUDIT.md",
    "99_IMPLEMENTATION_STATUS_TEMPLATE.md",
]:
    if not (ROOT / required).exists():
        errors.append(f"missing required plan document {required}")

print(f"requirements={len(req_ids)}")
print(f"acceptance={len(ac_ids)}")
print("phases=5")
print(f"errors={len(errors)}")
for error in errors:
    print(f"ERROR {error}")

sys.exit(1 if errors else 0)
