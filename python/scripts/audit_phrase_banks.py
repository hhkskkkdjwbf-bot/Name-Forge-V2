"""Audit curated phrase banks for structural and orthographic anomalies."""
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
EXPECTED_SCRIPTS = {
    **{code: ("LATIN",) for code in (
        "en", "fr", "es", "de", "it", "pt", "tr", "nl", "pl", "sv",
        "vi", "id", "cs", "ro", "da", "fi", "nb"
    )},
    "ar": ("ARABIC",), "he": ("HEBREW",),
    "ja": ("HIRAGANA", "KATAKANA", "CJK", "IDEOGRAPH"),
    "ko": ("HANGUL", "CJK", "IDEOGRAPH"), "zh": ("CJK", "IDEOGRAPH"),
    "ru": ("CYRILLIC",), "uk": ("CYRILLIC",), "hi": ("DEVANAGARI",),
    "bn": ("BENGALI",), "th": ("THAI",), "el": ("GREEK",),
}


def normalized(value: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", value).casefold().split())


def inspect_source(source: str) -> dict:
    match = re.search(r"const RAW_BANKS[^=]*=\s*\{(.*?)\n\};", source, re.S)
    if not match:
        raise ValueError("Could not locate RAW_BANKS in phraseBanks.ts")

    bank_pattern = re.compile(r"^\s{2}([a-z][a-z0-9_]*):\s*\x60(.*?)\x60,?\s*$", re.M | re.S)
    banks: dict[str, dict] = {}
    errors: list[str] = []
    warnings: list[str] = []
    missing_locales: dict[str, list[str]] = {}
    duplicate_phrases: list[str] = []
    script_mismatches: list[dict[str, str]] = []

    for bank_match in bank_pattern.finditer(match.group(1)):
        bank_id, raw = bank_match.groups()
        locale_map: dict[str, int] = {}
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
                continue
            locale_map[locale] = len(phrases)
            keys = [normalized(phrase) for phrase in phrases]
            if len(keys) != len(set(keys)):
                duplicate_phrases.append(f"{bank_id}/{locale}")

            expected = EXPECTED_SCRIPTS.get(locale)
            if expected:
                for phrase in phrases:
                    letters = [char for char in phrase if char.isalpha()]
                    if not letters:
                        continue
                    matching = sum(
                        any(script in unicodedata.name(char, "") for script in expected)
                        for char in letters
                    )
                    if matching / len(letters) < 0.75:
                        script_mismatches.append({
                            "bank": bank_id,
                            "locale": locale,
                            "phrase": phrase,
                        })
                        break

        if not locale_map:
            errors.append(f"{bank_id}: no language entries")
        banks[bank_id] = locale_map
        absent = sorted(LANGUAGES - set(locale_map))
        if absent:
            missing_locales[bank_id] = absent

    if not banks:
        errors.append("No phrase banks were parsed from source.")

    if duplicate_phrases:
        warnings.append(f"{len(duplicate_phrases)} bank/language pairs contain repeated phrases.")
    if script_mismatches:
        warnings.append(f"{len(script_mismatches)} bank/language pairs contain phrases with unexpected writing systems.")

    return {
        "bank_count": len(banks),
        "supported_language_count": len(LANGUAGES),
        "complete_bank_count": sum(1 for locales in banks.values() if LANGUAGES.issubset(locales)),
        "banks": banks,
        "missing_locale_count": sum(len(items) for items in missing_locales.values()),
        "missing_locales": missing_locales,
        "duplicate_phrase_banks": duplicate_phrases,
        "script_mismatches": script_mismatches,
        "warnings": warnings,
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
        print(f"Complete across all {report['supported_language_count']} languages: {report['complete_bank_count']}")
        print(f"Missing bank-language pairs: {report['missing_locale_count']}")
        print(f"Duplicate phrase groups: {len(report['duplicate_phrase_banks'])}")
        print(f"Unexpected writing-system groups: {len(report['script_mismatches'])}")
        for error in report["errors"]:
            print(f"ERROR: {error}")
        for warning in report["warnings"]:
            print(f"WARNING: {warning}")
        for item in report["script_mismatches"][:30]:
            print(f"REVIEW [{item['locale']}] {item['bank']}: {item['phrase']}")
    if args.check and report["errors"]:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
