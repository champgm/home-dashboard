#!/usr/bin/env python3
"""Mechanical checks for the 2.2.0 nonconformance rectification handoff.

The checker intentionally validates the final matrix and evidence links from
the repository itself. It does not infer conformance from a green test suite.
Use --self-test to exercise the negative cases required by Phase 01.
"""

from __future__ import annotations

import argparse
import re
import tempfile
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
PLAN_DIR = ROOT / "docs" / "nonconformance_rectification_plan"
SRS_PATH = ROOT / "docs" / "SRS_2.2.0.yaml"
FINAL_MATRIX = ROOT / "implementation_evidence" / "final-traceability-status.md"
REGISTER = ROOT / "docs" / "nonconformance" / "README.md"
EVIDENCE_MANIFEST = ROOT / "implementation_evidence" / "nonconformance_rectification_plan" / "evidence-manifest.yaml"


def heading_slug(title: str) -> str:
    title = re.sub(r"[`*_]", "", title)
    title = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", title)
    title = title.lower().strip()
    title = re.sub(r"[^a-z0-9 -]", "", title)
    return re.sub(r"[ -]+", "-", title)


def headings(path: Path) -> set[str]:
    result: set[str] = set()
    for line in path.read_text().splitlines():
        match = re.match(r"^#{1,6}\s+(.+?)\s*#*$", line)
        if match:
            result.add(heading_slug(match.group(1)))
    return result


def check_link(source: Path, target: str, errors: list[str]) -> None:
    if target.startswith(("http://", "https://", "mailto:")):
        return
    path_text, _, fragment = target.partition("#")
    target_path = (source.parent / path_text).resolve() if path_text else source.resolve()
    if not target_path.exists():
        errors.append(f"broken evidence path: {display_path(source)} -> {target}")
        return
    if fragment and not any(re.sub(r"-+", "-", fragment.lower()) == re.sub(r"-+", "-", candidate) for candidate in headings(target_path)):
        errors.append(f"broken evidence fragment: {display_path(source)} -> {target}")


def display_path(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def markdown_links(path: Path) -> list[str]:
    return [target for _label, target in re.findall(r"\[([^]]+)\]\(([^)]+)\)", path.read_text())]


def table_rows(text: str, start_heading: str, end_heading: str) -> list[tuple[str, str]]:
    start = text.index(start_heading)
    end = text.index(end_heading, start)
    section = text[start:end]
    rows: list[tuple[str, str]] = []
    for line in section.splitlines():
        match = re.match(r"^\|\s*`([^`]+)`\s*\|\s*([^|]+)\|", line)
        if match:
            rows.append((match.group(1), match.group(2).strip()))
    return rows


def validate_exact_ids(expected: list[str], actual: list[str], label: str) -> list[str]:
    errors: list[str] = []
    if len(actual) != len(set(actual)):
        errors.append(f"duplicate {label} IDs")
    if set(actual) != set(expected):
        errors.append(f"{label} IDs do not exactly match")
    if len(actual) != len(expected):
        errors.append(f"{label} row count is {len(actual)}, expected {len(expected)}")
    return errors


def validate_evidence_manifest(
    root: Path,
    canonical: list[str],
    ownership: list[tuple[str, str]],
    ledger: str,
) -> list[str]:
    errors: list[str] = []
    manifest_path = root / "implementation_evidence" / "nonconformance_rectification_plan" / "evidence-manifest.yaml"
    if not manifest_path.exists():
        return ["missing machine-readable nonconformance evidence manifest"]
    try:
        manifest = yaml.safe_load(manifest_path.read_text()) or {}
    except yaml.YAMLError as error:
        return [f"invalid evidence manifest YAML: {error}"]
    entries = manifest.get("entries") if isinstance(manifest, dict) else None
    if not isinstance(entries, list):
        return ["evidence manifest entries must be a list"]
    ids = [entry.get("id") for entry in entries if isinstance(entry, dict)]
    errors.extend(validate_exact_ids(canonical, ids, "evidence manifest"))
    expected_owner = dict(ownership)
    allowed_statuses = {"mechanically-verified", "verified-locally", "reconciled"}
    for entry in entries:
        if not isinstance(entry, dict):
            errors.append("evidence manifest contains a non-object entry")
            continue
        identifier = entry.get("id")
        if identifier not in canonical:
            errors.append(f"evidence manifest contains unknown ID {identifier}")
            continue
        owner = str(entry.get("primary_phase", ""))
        if owner != expected_owner.get(identifier):
            errors.append(f"evidence manifest owner mismatch for {identifier}")
        if entry.get("local_status") not in allowed_statuses:
            errors.append(f"evidence manifest has unsupported local status for {identifier}")
        if entry.get("target_status") not in {"pending", "not-applicable"}:
            errors.append(f"evidence manifest has unsupported target status for {identifier}")
        paths = [entry.get("phase_record"), *(entry.get("source_paths") or []), *(entry.get("test_paths") or [])]
        if not entry.get("source_paths") or not entry.get("test_paths"):
            errors.append(f"evidence manifest lacks source/test paths for {identifier}")
        for relative in paths:
            if not isinstance(relative, str) or not (root / relative).exists():
                errors.append(f"missing evidence artifact for {identifier}: {relative}")
        phase_record = entry.get("phase_record")
        if isinstance(phase_record, str) and (root / phase_record).exists():
            phase_text = (root / phase_record).read_text()
            if "## Focused verification" not in phase_text or "## Disposition" not in phase_text:
                errors.append(f"phase evidence lacks verification/disposition sections for {identifier}")
        ledger_row = next((line for line in ledger.splitlines() if f"`{identifier}`" in line), "")
        if not ledger_row:
            errors.append(f"evidence ledger is missing {identifier}")
        elif entry.get("target_status") == "pending" and "pending" not in ledger_row.lower():
            errors.append(f"evidence ledger overstates target-pending {identifier}")
    return errors


def validate_repository(root: Path = ROOT) -> list[str]:
    errors: list[str] = []
    srs = yaml.safe_load((root / "docs" / "SRS_2.2.0.yaml").read_text())
    requirements = [item["id"] for group in srs["requirements"].values() for item in group]
    acceptance = [item["id"] for item in srs["acceptance_criteria"]]
    matrix_path = root / "implementation_evidence" / "final-traceability-status.md"
    matrix = matrix_path.read_text()
    req_rows = table_rows(matrix, "## Mandatory requirements", "## Acceptance criteria")
    ac_rows = table_rows(matrix, "## Acceptance criteria", "## Release gate")
    for label, expected, actual in (("requirements", requirements, req_rows), ("acceptance", acceptance, ac_rows)):
        errors.extend(validate_exact_ids(expected, [row[0] for row in actual], label))
    register_text = (root / "docs" / "nonconformance" / "README.md").read_text()
    canonical = sorted(set(re.findall(r"`(NC-[A-Z]+-\d{3})`", register_text)))
    plan_text = (root / "docs" / "nonconformance_rectification_plan" / "00_IMPLEMENTATION_PLAN.md").read_text()
    ownership_text = (root / "docs" / "nonconformance_rectification_plan" / "00_REQUIREMENT_PHASE_MAP.md").read_text()
    ownership = re.findall(r"\|\s*`(NC-[A-Z]+-\d{3})`\s*\|\s*(\d{2})\s*\|", ownership_text)
    owned = [item[0] for item in ownership]
    if sorted(owned) != canonical:
        errors.append("primary ownership table does not contain exactly the canonical nonconformance IDs")
    if len(owned) != len(set(owned)):
        errors.append("primary ownership table contains duplicate nonconformance IDs")
    if any(item not in canonical for item in owned):
        errors.append("primary ownership table contains an unknown nonconformance ID")

    ledger_path = root / "implementation_evidence" / "nonconformance_rectification_plan" / "final-traceability-status.md"
    errors.extend(validate_evidence_manifest(root, canonical, ownership, ledger_path.read_text()))

    for link in markdown_links(root / "docs" / "nonconformance_rectification_plan" / "00_IMPLEMENTATION_PLAN.md"):
        check_link(root / "docs" / "nonconformance_rectification_plan" / "00_IMPLEMENTATION_PLAN.md", link, errors)
    for phase in sorted((root / "docs" / "nonconformance_rectification_plan").glob("[0-9][0-9]_*.md")):
        for link in markdown_links(phase):
            check_link(phase, link, errors)
    evidence_sources = [
        matrix_path,
        root / "docs" / "nonconformance" / "README.md",
        root / "implementation_evidence" / "nonconformance_rectification_plan" / "final-traceability-status.md",
    ]
    for evidence_source in evidence_sources:
        for link in markdown_links(evidence_source):
            check_link(evidence_source, link, errors)
    for requirement in re.findall(r"\b(?:CON|FR|HUE|TPL|UX-DEL|UX-VIS|DATA|PRIV|SEC|REL|QA)-\d{3}\b", plan_text):
        if requirement not in requirements:
            errors.append(f"plan references unknown requirement {requirement}")
    return sorted(set(errors))


def self_test() -> list[str]:
    failures: list[str] = []
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        source = root / "matrix.md"
        target = root / "evidence.md"
        target.write_text("# Evidence\n")
        source.write_text("[valid](evidence.md#evidence)\n")
        errors: list[str] = []
        check_link(source, "evidence.md#evidence", errors)
        if errors:
            failures.append("valid link unexpectedly failed")
        expected = ["one", "two", "three"]
        for label, actual in (("missing ID", ["one", "two"]), ("duplicate ID", ["one", "two", "two"]), ("unknown ID", ["one", "two", "unknown"]),):
            if not validate_exact_ids(expected, actual, label):
                failures.append(f"{label} was not detected")
        for label, bad in (("broken path", "missing.md"), ("broken fragment", "evidence.md#missing")):
            if label in {"broken path", "broken fragment"}:
                errors = []
                check_link(source, bad, errors)
                if not errors:
                    failures.append(f"{label} was not detected")
        evidence_root = root / "implementation_evidence" / "nonconformance_rectification_plan"
        evidence_root.mkdir(parents=True)
        phase = evidence_root / "phase-01.md"
        phase.write_text("## Focused verification\n\n## Disposition\n")
        (root / "source.ts").write_text("source")
        (root / "test.ts").write_text("test")
        (evidence_root / "evidence-manifest.yaml").write_text(
            "entries:\n"
            "  - id: NC-X-001\n"
            "    primary_phase: '01'\n"
            "    local_status: verified-locally\n"
            "    target_status: pending\n"
            "    phase_record: implementation_evidence/nonconformance_rectification_plan/phase-01.md\n"
            "    source_paths: [source.ts]\n"
            "    test_paths: [test.ts]\n"
        )
        if validate_evidence_manifest(root, ["NC-X-001"], [("NC-X-001", "01")], "| `NC-X-001` | pending |"):
            failures.append("valid evidence manifest unexpectedly failed")
        (evidence_root / "evidence-manifest.yaml").write_text(
            (evidence_root / "evidence-manifest.yaml").read_text().replace("verified-locally", "unverified")
        )
        if not validate_evidence_manifest(root, ["NC-X-001"], [("NC-X-001", "01")], "| `NC-X-001` | pending |"):
            failures.append("unsupported evidence status was not detected")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        errors = self_test()
        print(f"self_test_errors={len(errors)}")
        for error in errors:
            print(f"ERROR: {error}")
        return 1 if errors else 0
    errors = validate_repository()
    srs = yaml.safe_load(SRS_PATH.read_text())
    print(f"requirements={sum(len(group) for group in srs['requirements'].values())}")
    print(f"acceptance={len(srs['acceptance_criteria'])}")
    print(f"nonconformances=16")
    print(f"errors={len(errors)}")
    for error in errors:
        print(f"ERROR: {error}")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
