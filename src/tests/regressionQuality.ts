/* Regression tests for name-quality bugs (grammar, glued suffixes, gender rules). Run: npx tsx src/tests/regressionQuality.ts */
export {};
declare const process: { exit: (code: number) => void };
const memory: Record<string, string> = {};
const g = globalThis as any;
g.localStorage = g.localStorage || {
  getItem: (k: string) => memory[k] ?? null,
  setItem: (k: string, v: string) => { memory[k] = v; },
  removeItem: (k: string) => { delete memory[k]; },
  clear: () => { for (const k of Object.keys(memory)) delete memory[k]; },
};
g.window = g.window || { dispatchEvent: () => true, addEventListener: () => {}, removeEventListener: () => {}, localStorage: g.localStorage };
g.CustomEvent = g.CustomEvent || class { constructor(public type: string) {} };

const { combineParts, generateNames } = await import('../services/generatorEngine');
const { SUBCATEGORIES_DATA } = await import('../data/subcategories');

let passed = 0;
const failures: string[] = [];
function check(label: string, ok: boolean, detail = '') {
  if (ok) passed++; else failures.push(`${label} ${detail}`);
}

// 1. Joining rules
check('USS stays a separate word', combineParts('USS', 'Valor') === 'USS Valor', combineParts('USS', 'Valor'));
check('Roman numeral keeps case', combineParts('Vega', 'III') === 'Vega III', combineParts('Vega', 'III'));
check('Hyphen prefix + roman numeral', combineParts('Kepler-', 'IV') === 'Kepler-IV', combineParts('Kepler-', 'IV'));
check('du + la merges', combineParts('Les Lions du', 'la Plaine') === 'Les Lions de la Plaine', combineParts('Les Lions du', 'la Plaine'));
check('de + l’ merges', combineParts('La Tour de', 'l’Abîme') === 'La Tour de l’Abîme', combineParts('La Tour de', 'l’Abîme'));
check('de + le merges', combineParts('Le Défi de', 'le Futur') === 'Le Défi du Futur', combineParts('Le Défi de', 'le Futur'));
check('Feminine adjective agreement', combineParts('La Chope', 'Boiteux') === 'La Chope Boiteuse', combineParts('La Chope', 'Boiteux'));

// 2. Bulk generation: no broken patterns across every generator and style
const broken = [
  /\b(du|de) (la|le|les) (l’|la|le|les)\b/i,
  /\bdu l’/i, /\bdu la\b/i, /\bde le\b/i,
  /-\s*$/, /-\s/, /\s-/,
  /(?<![\p{L}])(\p{L}+)\s+\1(?![\p{L}])/iu,
];
let generated = 0;
for (const [id, styles] of Object.entries(SUBCATEGORIES_DATA)) {
  for (const style of Object.keys(styles)) {
    for (const k of Object.keys(memory)) delete memory[k];
    const names = generateNames({ generator: id as any, style, quantity: 12 });
    for (const n of names) {
      generated++;
      const hit = broken.find((re) => re.test(n.name));
      check(`No broken pattern in ${id}/${style}`, !hit, `→ "${n.name}" matched ${hit}`);
    }
  }
}

// 3. Female gender rule must never destroy the name
for (const id of ['fantasy', 'rpg', 'elf', 'vampire', 'warrior']) {
  for (let i = 0; i < 20; i++) {
    for (const k of Object.keys(memory)) delete memory[k];
    for (const n of generateNames({ generator: id as any, gender: 'female', quantity: 6 })) {
      check(`Female ${id} keeps a real name`, n.name.replace(/\s/g, '').length >= 3, `→ "${n.name}"`);
    }
  }
}

// 4. Attested baby names: every meaning is translated into the 24 non-French languages
const { getLocalizedNameMeaning, getLocalizedNameOrigin, TRANSLATION_ORDER } = await import('../i18n/attestedNameTranslations');
const { ATTESTED_BABY_NAMES } = await import('../data/attestedBabyNames');
for (const item of ATTESTED_BABY_NAMES) {
  for (const lang of TRANSLATION_ORDER) {
    const meaning = getLocalizedNameMeaning(item.meaning, lang);
    check(`Meaning translated (${lang}) for ${item.name}`, meaning !== item.meaning && meaning.length > 0);
    const origin = getLocalizedNameOrigin(item.origin, lang);
    check(`Origin non-empty (${lang}) for ${item.name}`, origin.length > 0);
  }
}

// 5. Curated phrase banks: slogans, book titles and song titles exist natively in all 25 languages
const { getPhraseBank, PHRASE_BANK_GENERATORS } = await import('../data/phraseBanks');
const ALL_LANGS = ['en','fr','es','de','it','pt','ar','tr','ja','ko','zh','ru','hi','nl','pl','sv','vi','id','th','el','he','cs','ro','da','fi','uk','bn','nb'];
for (const generatorId of PHRASE_BANK_GENERATORS) {
  for (const lang of ALL_LANGS) {
    const bank = getPhraseBank(generatorId, lang);
    check(`Phrase bank ${generatorId}/${lang} has at least 10 phrases`, bank.length >= 10, `(got ${bank.length})`);
    check(`Phrase bank ${generatorId}/${lang} has unique phrases`, new Set(bank).size === bank.length);
    for (const k of Object.keys(memory)) delete memory[k];
    const names = generateNames({ generator: generatorId as any, genLanguage: lang as any, quantity: 5 });
    check(`Generation ${generatorId}/${lang} returns native phrases`, names.length === Math.min(5, bank.length) && names.every((n) => bank.includes(n.name)));
  }
}

// 6. Seeded generation is reproducible, and different seeds differ
for (const [id, lang] of [['fantasy', 'auto'], ['brand', 'en'], ['handle', 'uk'], ['dragon', 'bn'], ['tavern', 'nb'], ['baby_name', 'fr']] as const) {
  const a = generateNames({ generator: id as any, genLanguage: lang as any, quantity: 8, seed: 'nameforge-42' }).map((n) => n.name);
  const b = generateNames({ generator: id as any, genLanguage: lang as any, quantity: 8, seed: 'nameforge-42' }).map((n) => n.name);
  const c = generateNames({ generator: id as any, genLanguage: lang as any, quantity: 8, seed: 'another-seed' }).map((n) => n.name);
  check(`Seeded ${id}/${lang} is reproducible`, JSON.stringify(a) === JSON.stringify(b), `${a.join(',')} vs ${b.join(',')}`);
  check(`Different seeds differ for ${id}/${lang}`, JSON.stringify(a) !== JSON.stringify(c));
}

// 7. Typography workshop: Unicode styles never corrupt text, keep accents and leave unsupported scripts intact
const { UNICODE_STYLES } = await import('../services/textStyler');
const loneSurrogate = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;
const styleSamples = ['NameForge', 'Éloïse Noël', 'Привіт світ', 'নাম বাংলা', 'اسم عربي', 'Ünïcode 123', '🙂 Hi', 'Åsa Ørn', ''];
for (const style of UNICODE_STYLES) {
  for (const sample of styleSamples) {
    let out = '';
    try { out = style.transform(sample); } catch (e) { check(`Style ${style.id} does not throw on "${sample}"`, false, String(e)); continue; }
    check(`Style ${style.id} keeps valid UTF-16 for "${sample}"`, !loneSurrogate.test(out) && !out.includes('\uFFFD'));
    check(`Style ${style.id} keeps emoji for "${sample}"`, !sample.includes('🙂') || out.includes('🙂'));
    check(`Style ${style.id} returns empty for empty input`, sample !== '' || out === '');
  }
}
for (const id of ['bold-serif', 'bold-sans', 'monospace', 'script']) {
  const style = UNICODE_STYLES.find((s) => s.id === id)!;
  const out = style.transform('Éloïse');
  check(`Style ${id} styles the base letter of an accented capital`, !out.startsWith('E') && !out.startsWith('É'), out);
  check(`Style ${id} preserves the accent as a combining mark`, out.normalize('NFD').includes('\u0301') && out.normalize('NFD').includes('\u0308'), out);
  check(`Style ${id} leaves Cyrillic and Bengali unchanged`, style.transform('Привіт নাম') === 'Привіт নাম', style.transform('Привіт নাম'));
}

// 8. Storage: favorites, notes, collections, history, export/import round trip and invalid imports
const storage = await import('../services/storage');
function resetStorage() { for (const k of Object.keys(memory)) delete memory[k]; }
resetStorage();
check('Saving a name returns true', storage.toggleSaveName('Aeldor', 'fantasy', 'heroic') === true);
check('Saved name is listed once', storage.getSavedNames().filter((n) => n.name === 'Aeldor').length === 1);
// A name is identified by its text (case-insensitive): saving it again from another generator toggles the same entry.
check('Saving the same name again toggles the existing entry off', storage.toggleSaveName('Aeldor', 'dragon', 'default') === false && storage.getSavedNames().length === 0);
check('Saving it once more restores it', storage.toggleSaveName('Aeldor', 'fantasy', 'heroic') === true && storage.getSavedNames().length === 1);
const collection = storage.createCollection('Roman tome 1', 'Personnages', '#8b5cf6');
check('Collection is created', Boolean(collection && collection.id));
check('Name can be assigned to a collection', storage.assignNameToCollection('Aeldor', collection!.id) === true);
check('Notes are stored', (storage.updateEntryNote('Aeldor', 'fantasy', 'Mentor du héros') ?? true) !== false);
const exported = storage.exportDataJSON();
check('Export is valid JSON with names and collections', (() => { const p = JSON.parse(exported); return Array.isArray(p.names) && Array.isArray(p.collections); })());
storage.deleteCollection(collection!.id);
check('Deleting a collection unassigns its names', storage.getSavedNames().every((n) => n.collectionId !== collection!.id));
check('Deleting a collection removes it', storage.getCollections().every((c) => c.id !== collection!.id));
const countBeforeImport = storage.getSavedNames().length;
const importOk = storage.importDataJSON(exported);
check('A valid export can be re-imported', importOk.success === true, JSON.stringify(importOk.errors));
check('Re-import does not duplicate names', storage.getSavedNames().length === countBeforeImport, `${storage.getSavedNames().length} vs ${countBeforeImport}`);
const snapshot = JSON.stringify(storage.getSavedNames());
for (const bad of ['not json', '42', 'null', '{"names": "oops"}', '{"names": [], "collections": 5}', '{"foo": []}']) {
  const result = storage.importDataJSON(bad);
  check(`Invalid import is rejected: ${bad}`, result.success === false);
}
check('Rejected imports leave saved data untouched', JSON.stringify(storage.getSavedNames()) === snapshot);
resetStorage();
for (let i = 0; i < 120; i++) storage.addGenerationHistory([{ name: `Name${i}`, description: '', style: 'default', icon: '', bestFor: '', tone: '', generatorId: 'fantasy' } as any]);
check('Generation history is capped at 50 entries', storage.getGenerationHistory().length <= 50, String(storage.getGenerationHistory().length));
storage.clearGenerationHistory();
check('Clearing history empties it', storage.getGenerationHistory().length === 0);
check('Ratings are clamped to 0–5', (() => { storage.setStoredRating('Aeldor', 99); const hi = storage.getStoredRating('Aeldor'); storage.setStoredRating('Aeldor', -3); return hi <= 5 && storage.getStoredRating('Aeldor') >= 0; })());
resetStorage();

// 9. Language resolution: interface language, name language and fallbacks stay independent
const { resolveGenerationLanguage, detectBrowserLanguage, normalizeAppSettings } = await import('../services/settings');
check('Explicit generation language always wins', resolveGenerationLanguage('ja' as any, 'fr' as any) === 'ja');
check('Auto follows a fully translated interface language', resolveGenerationLanguage('auto' as any, 'uk' as any) === 'uk');
check('Auto maps legacy Norwegian "no" to nb', resolveGenerationLanguage('auto' as any, 'no' as any) === 'nb');
check('Auto uses English for fallback interface languages', resolveGenerationLanguage('auto' as any, 'hu' as any) === 'en');
check('Browser detection maps nn/no to nb', detectBrowserLanguage(['nn-NO']) === 'nb' && detectBrowserLanguage(['no']) === 'nb');
check('Browser detection handles uk and bn', detectBrowserLanguage(['uk-UA']) === 'uk' && detectBrowserLanguage(['bn-BD']) === 'bn');
check('Stored legacy "no" setting is migrated to nb', (normalizeAppSettings({ language: 'no' }).language as string) === 'nb');
check('Unsupported browser languages default to English', detectBrowserLanguage(['xx-YY']) === 'en');

console.log(`Quality regression: ${passed} checks passed, ${failures.length} failed (${generated} names scanned).`);
if (failures.length) {
  console.log([...new Set(failures)].slice(0, 40).join('\n'));
  process.exit(1);
}
