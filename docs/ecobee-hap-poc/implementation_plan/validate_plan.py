#!/usr/bin/env python3
"""Mechanical consistency checks for the Ecobee HAP POC implementation plan."""

from __future__ import annotations

import re
import sys
from pathlib import Path


PLAN_DIR = Path(__file__).resolve().parent
ROOT = PLAN_DIR.parents[2]
PHASES = list(range(1, 18))
MANDATORY = {
    *(f"OBJ-{i:02d}" for i in range(1, 13)),
    *(f"SAFE-{i:02d}" for i in range(1, 11)),
    *(f"PAIR-{i:02d}" for i in range(1, 6)),
    *(f"ARC-{i:02d}" for i in range(1, 16)),
}
ACCEPTANCE = {f"HAP-{i:03d}" for i in range(1, 18)}
REQUIRED_HEADINGS = {
    "## Objective",
    "## Why this phase exists",
    "## Authoritative requirements",
    "## Relevant design sections",
    "## In scope",
    "## Explicitly out of scope",
    "## Expected repository changes",
    "## Required implementation behavior",
    "## Tests",
    "## Acceptance focus",
    "## Commands/checks",
    "## Persisted implementation evidence",
    "## Exit criteria",
}


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def main() -> int:
    errors: list[str] = []
    shared = [
        PLAN_DIR / "00_IMPLEMENTATION_PLAN.md",
        PLAN_DIR / "00_REQUIREMENT_PHASE_MAP.md",
        PLAN_DIR / "99_PHASE_HANDOFF_TEMPLATE.md",
        ROOT / "docs/ecobee-hap-poc/00_POC_CHARTER.md",
        ROOT / "docs/ecobee-hap-poc/01_TECHNICAL_DESIGN.md",
        ROOT / "docs/ecobee-hap-poc/02_ACCEPTANCE_AND_EVIDENCE.md",
    ]
    for path in shared:
        if not path.is_file():
            fail(errors, f"missing shared file: {path.relative_to(ROOT)}")

    phase_files: list[Path] = []
    phase_primary_ids: dict[str, int] = {}
    acceptance_primary_ids: dict[str, int] = {}
    for number in PHASES:
        matches = sorted(PLAN_DIR.glob(f"{number:02d}_*.md"))
        if len(matches) != 1:
            fail(errors, f"phase {number:02d} has {len(matches)} files, expected 1")
            continue
        phase_files.append(matches[0])
        text = matches[0].read_text(encoding="utf-8")
        if "Before implementation, read:" not in text:
            fail(errors, f"{matches[0].name}: missing prerequisite preamble")
        for heading in REQUIRED_HEADINGS:
            if heading not in text:
                fail(errors, f"{matches[0].name}: missing {heading}")
        evidence = f"implementation_evidence/ecobee-hap-poc/phase-{number:02d}.md"
        if evidence not in text:
            fail(errors, f"{matches[0].name}: missing evidence path {evidence}")
        authority = text.split("## Authoritative requirements", 1)[1].split("\n## ", 1)[0]
        primary_authority = "\n".join(line for line in authority.splitlines() if line.startswith("- PRIMARY:"))
        for identifier in re.findall(r"\b(?:OBJ|SAFE|PAIR|ARC)-\d{2}\b", primary_authority):
            if identifier in phase_primary_ids:
                fail(errors, f"{identifier}: PRIMARY in phases {phase_primary_ids[identifier]:02d} and {number:02d}")
            phase_primary_ids[identifier] = number
        acceptance_focus = text.split("## Acceptance focus", 1)[1].split("\n## ", 1)[0]
        primary_acceptance = "\n".join(
            line.split(";", 1)[0]
            for line in acceptance_focus.splitlines()
            if line.startswith("- PRIMARY:")
        )
        for identifier in re.findall(r"\bHAP-\d{3}\b", primary_acceptance):
            if identifier in acceptance_primary_ids:
                fail(errors, f"{identifier}: PRIMARY acceptance in phases {acceptance_primary_ids[identifier]:02d} and {number:02d}")
            acceptance_primary_ids[identifier] = number

        preamble = text.split("**Prerequisite", 1)[0]
        for referenced in re.findall(r"- `([^`]+)`", preamble):
            referenced_path = ROOT / referenced
            if referenced_path.exists():
                continue
            evidence_match = re.fullmatch(r"implementation_evidence/ecobee-hap-poc/phase-(\d{2})\.md", referenced)
            if evidence_match and int(evidence_match.group(1)) < number:
                continue
            generated_inputs = {
                "spikes/ecobee-hap-poc/docs/HAP_SOURCE_DECISION.md": 2,
                "spikes/ecobee-hap-poc/docs/OBSERVATION_POLICY.md": 11,
            }
            if referenced in generated_inputs and generated_inputs[referenced] < number:
                continue
            fail(errors, f"{matches[0].name}: unresolved prerequisite path {referenced}")

    map_text = (PLAN_DIR / "00_REQUIREMENT_PHASE_MAP.md").read_text(encoding="utf-8")
    owner_rows: dict[str, int] = {}
    for line in map_text.splitlines():
        match = re.match(r"\| ((?:OBJ|SAFE|PAIR|ARC)-\d{2}) \|.*\| (\d{2}) \|$", line)
        if match:
            identifier, phase = match.groups()
            if identifier in owner_rows:
                fail(errors, f"duplicate primary owner row: {identifier}")
            owner_rows[identifier] = int(phase)
    missing = sorted(MANDATORY - owner_rows.keys())
    extra = sorted(owner_rows.keys() - MANDATORY)
    if missing:
        fail(errors, f"mandatory IDs without owner: {', '.join(missing)}")
    if extra:
        fail(errors, f"unknown mandatory IDs in owner map: {', '.join(extra)}")
    for identifier, phase in owner_rows.items():
        if phase not in PHASES:
            fail(errors, f"{identifier}: invalid primary phase {phase:02d}")
        elif phase_primary_ids.get(identifier) != phase:
            actual = phase_primary_ids.get(identifier)
            fail(errors, f"{identifier}: map owner {phase:02d}, phase PRIMARY owner {actual}")
    unexpected_primary = sorted(phase_primary_ids.keys() - MANDATORY)
    if unexpected_primary:
        fail(errors, f"unknown PRIMARY plan IDs: {', '.join(unexpected_primary)}")

    acceptance_owner_rows: dict[str, int] = {}
    for line in map_text.splitlines():
        match = re.match(r"\| (HAP-\d{3}) \| (\d{2}) \|", line)
        if match:
            identifier, phase = match.groups()
            acceptance_owner_rows[identifier] = int(phase)
    if set(acceptance_owner_rows) != ACCEPTANCE:
        fail(errors, "acceptance primary-owner map is incomplete or contains unknown IDs")
    for identifier, phase in acceptance_owner_rows.items():
        if acceptance_primary_ids.get(identifier) != phase:
            actual = acceptance_primary_ids.get(identifier)
            fail(errors, f"{identifier}: map PRIMARY {phase:02d}, phase PRIMARY {actual}")

    phase_text = "\n".join(path.read_text(encoding="utf-8") for path in phase_files)
    referenced_plan_ids = set(re.findall(r"\b(?:OBJ|SAFE|PAIR|ARC)-\d{2}\b", phase_text))
    unknown_plan_ids = sorted(referenced_plan_ids - MANDATORY)
    if unknown_plan_ids:
        fail(errors, f"phase files reference unknown plan IDs: {', '.join(unknown_plan_ids)}")
    missing_acceptance = sorted(ACCEPTANCE - set(re.findall(r"\bHAP-\d{3}\b", phase_text)))
    if missing_acceptance:
        fail(errors, f"acceptance IDs absent from phases: {', '.join(missing_acceptance)}")

    all_plan_text = "\n".join(
        path.read_text(encoding="utf-8") for path in [*shared[:3], *phase_files]
    )
    stale = sorted(set(re.findall(r"(?:SRS|SAD)_\d+\.\d+\.\d+\.yaml", all_plan_text)) - {
        "SRS_2.4.1.yaml",
        "SAD_2.4.1.yaml",
    })
    if stale:
        fail(errors, f"stale production document versions: {', '.join(stale)}")

    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        print(f"errors={len(errors)}")
        return 1
    print(f"phases={len(phase_files)}")
    print(f"mandatory_ids={len(owner_rows)}")
    print(f"acceptance_ids_covered={len(ACCEPTANCE)}")
    print("errors=0")
    return 0


if __name__ == "__main__":
    sys.exit(main())
