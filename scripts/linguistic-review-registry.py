#!/usr/bin/env python3
"""Maintain a human linguistic-review ledger from the source phrase banks.

This tool checks provenance and workflow metadata. It cannot judge naturalness,
prove a reviewer's identity, or certify legal/trademark availability.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src" / "data" / "phraseBanks.ts"
REGISTRY = ROOT / "docs" / "linguistic-review" / "phrase-review.csv"
FIELDS = [
    "phrase_id", "locale", "category", "phrase", "status",
    "reviewer_name_or_id", "reviewer_level", "variety_or_region",
    "reviewed_on", "decision_notes", "reviewer_attestation",
]
STATUSES = {"unverified", "in_review", "needs_revision", "validated", "rejected"}


def phrase_id(category: str, locale: str, phrase: str) -> str:
    normalized = phrase.casefold()
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:12]
    return f"{category}:{locale}:{digest}"


def extract_phrases(source: str) -> list[dict[str, str]]:
    match = re.search(r"const RAW_BANKS[^=]*=\s*\{(.*?)\n\};", source, re.S)
    if not match:
        raise ValueError("Could not locate RAW_BANKS in phraseBanks.ts")
    bank_pattern = re.compile(
        r"^\s{2}([a-z][a-z0-9_]*):\s*\x60(.*?)\x60,?\s*$", re.M | re.S
    )
    records: list[dict[str, str]] = []
    seen: set[str] = set()
    for bank_match in bank_pattern.finditer(match.group(1)):
        category, raw = bank_match.groups()
        for line_number, line in enumerate(raw.splitlines(), 1):
            if not line.strip():
                continue
            if ": " not in line:
                raise ValueError(f"{category}: malformed locale line {line_number}")
            locale, phrase_text = line.split(": ", 1)
            for phrase in (part.strip() for part in phrase_text.split(" | ")):
                if not phrase:
                    continue
                identifier = phrase_id(category, locale, phrase)
                if identifier in seen:
                    raise ValueError(f"Duplicate phrase identity: {identifier}")
                seen.add(identifier)
                records.append({
                    "phrase_id": identifier, "locale": locale,
                    "category": category, "phrase": phrase,
                })
    if not records:
        raise ValueError("No phrase records extracted")
    return records


def read_existing() -> dict[str, dict[str, str]]:
    if not REGISTRY.exists():
        return {}
    with REGISTRY.open(encoding="utf-8-sig", newline="") as handle:
        return {row["phrase_id"]: row for row in csv.DictReader(handle)}


def build_rows(source_records: list[dict[str, str]]) -> list[dict[str, str]]:
    existing = read_existing()
    rows = []
    for record in source_records:
        previous = existing.get(record["phrase_id"], {})
        row = {field: "" for field in FIELDS}
        row.update(record)
        row["status"] = previous.get("status") or "unverified"
        for field in FIELDS[5:]:
            row[field] = previous.get(field, "")
        # A changed source phrase receives a new ID and starts unverified.
        rows.append(row)
    return rows


def validate(rows: list[dict[str, str]], source_records: list[dict[str, str]]) -> list[str]:
    errors: list[str] = []
    expected = {row["phrase_id"]: row for row in source_records}
    actual = {row["phrase_id"]: row for row in rows}
    missing = set(expected) - set(actual)
    orphaned = set(actual) - set(expected)
    if missing:
        errors.append(f"{len(missing)} source phrases are missing from the registry")
    if orphaned:
        errors.append(f"{len(orphaned)} registry rows no longer exist in source")
    for row in rows:
        status = row.get("status", "")
        if status not in STATUSES:
            errors.append(f"{row.get('phrase_id')}: invalid status {status!r}")
        if row.get("status") == "validated":
            required = (
                "reviewer_name_or_id", "reviewer_level", "variety_or_region",
                "reviewed_on", "reviewer_attestation",
            )
            for field in required:
                if not row.get(field, "").strip():
                    errors.append(f"{row['phrase_id']}: validated row missing {field}")
            if row.get("reviewer_level") != "native":
                errors.append(f"{row['phrase_id']}: validated row requires reviewer_level=native")
            if row.get("reviewer_attestation") != "yes":
                errors.append(f"{row['phrase_id']}: validated row requires reviewer_attestation=yes")
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", row.get("reviewed_on", "")):
                errors.append(f"{row['phrase_id']}: reviewed_on must use YYYY-MM-DD")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--write", action="store_true", help="sync new/removed source phrases")
    mode.add_argument("--check", action="store_true", help="validate registry and source alignment")
    args = parser.parse_args()
    records = extract_phrases(SOURCE.read_text(encoding="utf-8"))
    rows = build_rows(records)
    errors = validate(rows, records)
    if args.write:
        REGISTRY.parent.mkdir(parents=True, exist_ok=True)
        with REGISTRY.open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=FIELDS, lineterminator="\n")
            writer.writeheader()
            writer.writerows(rows)
        print(f"Registry synchronized: {len(rows)} phrases; existing review metadata preserved.")
        return 0
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    counts: dict[str, int] = {}
    for row in rows:
        key = f"{row['locale']}/{row['category']}/{row['status']}"
        counts[key] = counts.get(key, 0) + 1
    print(f"Registry aligned: {len(rows)} phrases across {len({r['locale'] for r in rows})} locales and {len({r['category'] for r in rows})} categories.")
    print(f"Human-validated phrases: {sum(1 for row in rows if row['status'] == 'validated')}")
    print("Reminder: this audit checks metadata only; it does not verify linguistic quality or reviewer identity.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
