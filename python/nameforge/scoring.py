"""Deterministic, dependency-light quality ranking for generated names.

This service does not invent names or claim native-language validation. It scores
candidates already produced by the existing TypeScript engine.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass

SUPPORTED_LANGUAGES = {
    "en", "fr", "es", "de", "it", "pt", "ar", "tr", "ja", "ko",
    "zh", "ru", "hi", "nl", "pl", "sv", "vi", "id", "th", "el",
    "he", "cs", "ro", "da", "fi", "uk", "bn", "nb",
}
LANGUAGE_SCRIPTS = {
    "ar": ("ARABIC",), "he": ("HEBREW",), "ja": ("HIRAGANA", "KATAKANA", "CJK"),
    "ko": ("HANGUL",), "zh": ("CJK",), "ru": ("CYRILLIC",),
    "uk": ("CYRILLIC",), "hi": ("DEVANAGARI",), "bn": ("BENGALI",),
    "th": ("THAI",), "el": ("GREEK",),
}


@dataclass(frozen=True)
class RankedCandidate:
    name: str
    score: float
    reasons: tuple[str, ...]
    duplicate: bool


def comparison_key(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold()
    return re.sub(r"[^\w]+", " ", value, flags=re.UNICODE).strip()


def _script_matches(name: str, language: str) -> bool | None:
    expected = LANGUAGE_SCRIPTS.get(language)
    if not expected:
        return None
    letters = [char for char in name if char.isalpha()]
    if not letters:
        return False
    matches = 0
    for char in letters:
        label = unicodedata.name(char, "")
        if any(script in label for script in expected):
            matches += 1
    return matches / len(letters) >= 0.65


def score_candidate(
    name: str,
    language: str = "en",
    preferred_length: int | None = None,
    keyword: str = "",
    seen: set[str] | None = None,
) -> RankedCandidate:
    clean = " ".join(name.split())
    key = comparison_key(clean)
    reasons: list[str] = []
    score = 0.72
    duplicate = bool(key and seen is not None and key in seen)

    if not clean:
        return RankedCandidate(name, 0.0, ("empty",), duplicate)

    letters = [char for char in clean if char.isalpha()]
    if not letters:
        score -= 0.30
        reasons.append("few_letters")
    else:
        if len(letters) >= 3:
            score += 0.04
        if len(letters) > 24:
            score -= min(0.18, (len(letters) - 24) * 0.008)
            reasons.append("very_long")
        if len(set(letters)) == 1 and len(letters) > 2:
            score -= 0.20
            reasons.append("repetitive")
        if re.search(r"(.)\1{2,}", clean, flags=re.IGNORECASE):
            score -= 0.12
            reasons.append("repeated_sequence")

        if preferred_length:
            distance = abs(len(letters) - preferred_length)
            score += max(-0.16, 0.08 - distance * 0.012)
            if distance <= 2:
                reasons.append("length_match")

        script_match = _script_matches(clean, language)
        if script_match is True:
            score += 0.10
            reasons.append("script_match")
        elif script_match is False:
            score -= 0.18
            reasons.append("script_mismatch")

        if keyword and comparison_key(keyword) in key:
            score += 0.04
            reasons.append("keyword_match")

    if duplicate:
        score -= 0.55
        reasons.append("duplicate")

    score = max(0.0, min(1.0, score))
    return RankedCandidate(clean, round(score, 4), tuple(reasons), duplicate)


def rank_candidates(
    candidates: list[str],
    language: str = "en",
    preferred_length: int | None = None,
    keyword: str = "",
) -> list[RankedCandidate]:
    if language not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported language: {language}")
    seen: set[str] = set()
    ranked: list[RankedCandidate] = []
    for candidate in candidates:
        result = score_candidate(candidate, language, preferred_length, keyword, seen)
        ranked.append(result)
        key = comparison_key(result.name)
        if key:
            seen.add(key)
    return sorted(ranked, key=lambda item: (item.duplicate, -item.score, item.name.casefold()))
