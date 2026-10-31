import { GeneratedName, GenLanguageCode, LengthOption } from '../types';

interface PythonRankedName {
  name: string;
  score: number;
  duplicate: boolean;
}

interface PythonRankResponse {
  results?: PythonRankedName[];
}

const API_LANGUAGES = new Set([
  'en', 'fr', 'es', 'de', 'it', 'pt', 'ar', 'tr', 'ja', 'ko',
  'zh', 'ru', 'hi', 'nl', 'pl', 'sv', 'vi', 'id', 'th', 'el',
  'he', 'cs', 'ro', 'da', 'fi', 'uk', 'bn', 'nb',
]);

function comparisonKey(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}_]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Optionally reorders an already-generated batch using the Python service.
 * If no API URL is configured or the service fails, the original batch is returned.
 */
export async function rankGeneratedNames(
  candidates: GeneratedName[],
  language: GenLanguageCode,
  length: LengthOption,
  keyword: string,
): Promise<GeneratedName[]> {
  const apiUrl = (import.meta as ImportMeta & {
    env?: { VITE_NAMEFORGE_API_URL?: string };
  }).env?.VITE_NAMEFORGE_API_URL?.trim();

  if (!apiUrl || candidates.length < 2 || !API_LANGUAGES.has(language)) return candidates;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1800);

  try {
    const preferredLength = length === 'short' ? 5 : length === 'long' ? 12 : 8;
    const response = await fetch(`${apiUrl.replace(/\/+$/, '')}/v1/rank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidates: candidates.map((candidate) => candidate.name),
        language,
        preferred_length: preferredLength,
        keyword,
      }),
      signal: controller.signal,
    });

    if (!response.ok) return candidates;
    const payload = (await response.json()) as PythonRankResponse;
    if (!Array.isArray(payload.results) || payload.results.length !== candidates.length) {
      return candidates;
    }

    const byName = new Map(candidates.map((candidate) => [comparisonKey(candidate.name), candidate]));
    const ranked = payload.results
      .filter((item) => typeof item.name === 'string' && Number.isFinite(item.score) && !item.duplicate)
      .map((item) => byName.get(comparisonKey(item.name)))
      .filter((item): item is GeneratedName => Boolean(item));

    return ranked.length === candidates.length ? ranked : candidates;
  } catch {
    // The Python backend is an optional enhancement, never a dependency for generation.
    return candidates;
  } finally {
    clearTimeout(timeout);
  }
}
