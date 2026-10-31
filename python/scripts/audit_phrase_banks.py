"""Build-time structural audit for the curated phrase-bank source."""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "src" / "data" / "phraseBanks.ts"
LANGUAGES = {
    "en", "fr", "es", "de", "it", "pt", "ar", "tr", "ja", "ko",
    "zh", "ru", "hi", "nl", "pl", "sv", "vi", "id", "th", "el",
    "he", "cs", "ro", "da", "fi", "uk", "bn", "nb",
}


def key(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value).casefold().split())


def inspect_source(source: str) -> dict:
    match = re.search(r"const RAW_BANKS[^=]*=\s*\{(.*?)\n\};", source, re.S)
    if not match:
        raise ValueError("Could not locate RAW_BANKS in phraseBanks.ts")

    bank_pattern = re.compile(r"^\s{2}([a-z][a-z0-9_]*):\s*`(.*?)`,?\s*$", re.M | re.S)
    banks = {}
    errors = []
    missing_locales = {}
    duplicate_phrases = []

    for bank_match in bank_pattern.finditer(match.group(1)):
        bank_id, raw = bank_match.groups()
        locale_map = {}
        for line_number, line in enumerate(raw.splitlines(), 1):
            if not line.strip():
                continue
            if ": " not in line:
                errors.append(f"{bank_id}: malformed locale line {line_number}")
                continue
            locale, phrase_text = line.split(": ", 1)
            if locale not in LANGUAGES:
                errors.append(f"{bank_id}: unsupported locale code {locale}")
                continue
            phrases = [part.strip() for part in phrase_text.split(" | ") if part.strip()]
            if not phrases:
                errors.append(f"{bank_id}/{locale}: empty phrase list")
            normalized = [key(phrase) for phrase in phrases]
            if len(normalized) != len(set(normalized)):
                duplicate_phrases.append(f"{bank_id}/{locale}")
            locale_map[locale] = len(phrases)
        if not locale_map:
            errors.append(f"{bank_id}: no language entries")
        banks[bank_id] = locale_map
        absent = sorted(LANGUAGES - set(locale_map))
        if absent:
            missing_locales[bank_id] = absent

    if not banks:
        errors.append("No phrase banks were parsed from source.")

    return {
        "bank_count": len(banks),
        "supported_language_count": len(LANGUAGES),
        "banks": banks,
        "missing_locale_count": sum(len(items) for items in missing_locales.values()),
        "missing_locales": missing_locales,
        "duplicate_phrase_banks": duplicate_phrases,
        "errors": errors,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    report = inspect_source(SOURCE.read_text(encoding="utf-8"))
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(f"Phrase banks inspected: {report['bank_count']}")
        print(f"Supported interface languages: {report['supported_language_count']}")
        print(f"Missing bank-language pairs: {report['missing_locale_count']}")
        print(f"Banks containing duplicate phrases: {len(report['duplicate_phrase_banks'])}")
        for error in report["errors"]:
            print(f"ERROR: {error}")
        for bank, locales in report["missing_locales"].items():
            print(f"Coverage gap — {bank}: {', '.join(locales)}")
    if args.check and report["errors"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
