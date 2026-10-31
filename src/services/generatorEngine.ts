import {
  FormatOption,
  GenderOption,
  GeneratedName,
  GeneratorId,
  GenLanguageCode,
  LengthOption,
  SubcategoryData,
} from '../types';
import { SUBCATEGORIES_DATA } from '../data/subcategories';
import { resolveStyleData } from '../data/styles';
import { addGenerationHistory } from './storage';
import { GENERATORS_METADATA } from '../data/generators';
import { ATTESTED_BABY_NAMES } from '../data/attestedBabyNames';
import { getPhraseBank } from '../data/phraseBanks';

const RECENT_NAMES_KEY = 'nameforge_recent_names';
const RECENT_LIMIT = 120;

function randomItem<T>(arr?: T[]): T | '' {
  if (!arr || !arr.length) return '';
  return arr[Math.floor(activeRandom() * arr.length)];
}

function cap(v: string): string {
  const str = String(v || '').trim();
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function normalize(s: string): string {
  return cap(
    String(s || '')
      .replace(/[^\p{L}\p{M}\p{N}'’& -]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/* =====================================================================
   1. SIMILARITY & LEVENSHTEIN DISTANCE FILTER
===================================================================== */

function comparisonKey(value: string): string {
  // NFC makes canonically equivalent spellings compare equally (e.g. é and e + ◌́).
  // Normalize punctuation and whitespace without deleting word boundaries.
  return String(value ?? '')
    .normalize('NFC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{S}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function calculateLevenshteinDistance(a: string, b: string): number {
  // Compare normalized Unicode code points, not UTF-16 code units.
  const left = Array.from(comparisonKey(a));
  const right = Array.from(comparisonKey(b));
  const al = left.length;
  const bl = right.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  // Two rows are sufficient; this reduces memory from O(n*m) to O(min(n,m)).
  const row = Array.from({ length: bl + 1 }, (_, index) => index);
  for (let i = 1; i <= al; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= bl; j++) {
      const above = row[j];
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + cost);
      diagonal = above;
    }
  }
  return row[bl];
}

export function isTooSimilar(candidate: string, existingList: string[], keyword?: string): boolean {
  const candLower = comparisonKey(candidate);
  const kwLower = comparisonKey(keyword || '');

  for (const existing of existingList) {
    const exLower = comparisonKey(existing);
    if (candLower === exLower) return true;

    // Remove the requested keyword from both candidates before comparing their distinct parts.
    let cComp = candLower;
    let eComp = exLower;
    if (kwLower && Array.from(kwLower).length >= 2 && cComp.includes(kwLower) && eComp.includes(kwLower)) {
      cComp = cComp.replace(kwLower, '').trim();
      eComp = eComp.replace(kwLower, '').trim();
      if (!cComp || !eComp) return true;
      if (cComp === eComp) return true;
    }

    const cLength = Array.from(cComp).length;
    const eLength = Array.from(eComp).length;
    if (cLength >= 4 && eLength >= 4 && (cComp.includes(eComp) || eComp.includes(cComp))) {
      return true;
    }

    // Short names (especially CJK names) have little room for safe fuzzy matching.
    // Keep exact matching for 1–2 character candidates; don't discard valid alternatives.
    if (Math.min(cLength, eLength) <= 2) continue;

    const dist = calculateLevenshteinDistance(cComp, eComp);
    if (Math.max(cLength, eLength) <= 5 && dist <= 1) return true;
    if (Math.max(cLength, eLength) > 5 && dist <= 2) return true;
  }
  return false;
}

/* =====================================================================
   2. LINGUISTIC PHONETICS & ROOTS
===================================================================== */

const LANGUAGE_PHONETICS: Record<
  GenLanguageCode,
  { prefixes: string[]; suffixes: string[]; titleWords: string[]; vowels: string[]; consonants: string[] }
> = {
  auto: {
    prefixes: [],
    suffixes: [],
    titleWords: [],
    vowels: ['a', 'e', 'i', 'o', 'u', 'y'],
    consonants: ['b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'z'],
  },
  fr: {
    prefixes: ['Val', 'Mont', 'Clair', 'Beau', 'Soleil', 'Aurore', 'Bel', 'Chant', 'Font', 'Roc', 'Mir', 'Lys', 'Doux'],
    suffixes: ['val', 'mont', 'elle', 'eur', 'ance', 'ier', 'on', 'ard', 'ière', 'ac', 'ain', 'euil', 'or'],
    titleWords: ['le Brave', 'l’Audacieux', 'le Grand', 'le Sage', 'le Vaillant', 'le Juste'],
    vowels: ['a', 'e', 'i', 'o', 'u', 'é', 'è', 'eau'],
    consonants: ['v', 'l', 'm', 'r', 's', 'c', 'b', 'f', 't', 'p', 'd'],
  },
  en: {
    prefixes: ['Star', 'Swift', 'Bright', 'Iron', 'Stone', 'Oak', 'Gold', 'Silver', 'Storm', 'Shadow', 'Frost', 'Hawk'],
    suffixes: ['ford', 'wood', 'field', 'craft', 'well', 'ton', 'dale', 'stone', 'worth', 'brook', 'gate', 'crest'],
    titleWords: ['the Bold', 'the Swift', 'the Valiant', 'the Fearless', 'the Keeper', 'the Vanguard'],
    vowels: ['a', 'e', 'i', 'o', 'u', 'ea', 'ee', 'ai'],
    consonants: ['b', 'c', 'd', 'f', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'w'],
  },
  ja: {
    prefixes: ['カイ', 'シン', 'リュウ', 'ソラ', 'レン', 'ハル', 'アキ', 'タカ', 'ユキ', 'カゼ', 'キラ', 'ハナ', 'ミオ'],
    suffixes: ['マル', 'ト', 'ヤ', 'シ', 'ゼン', 'ジン', 'ナリ', 'ロ', 'ソラ', 'カ', 'キ', 'コ', 'スケ'],
    titleWords: ['Mamoru', 'Kage no Senshi', 'Tsuki no Kishi', 'Yoru no Kage', 'Hoshi no Tabibito'],
    vowels: ['a', 'i', 'u', 'e', 'o'],
    consonants: ['k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w'],
  },
  ar: {
    prefixes: ['نور', 'طارق', 'زيد', 'مالك', 'ريان', 'قمر', 'بدر', 'فريد', 'كريم', 'سامي', 'أمير', 'ليث'],
    suffixes: ['الدين', 'النور', 'الحق', 'ان', 'ير', 'يم', 'ون', 'اد', 'ين', 'ار', 'يا', 'ور'],
    titleWords: ['النَبيل', 'الفارس', 'حارس النور', 'سيف الظل', 'المسافر'],
    vowels: ['a', 'i', 'u', 'ou', 'ai'],
    consonants: ['b', 't', 'j', 'd', 'r', 'z', 's', 'q', 'k', 'l', 'm', 'n', 'h'],
  },
  latin: {
    prefixes: ['Aurel', 'Cael', 'Sylv', 'Maxi', 'Valer', 'Cass', 'Luc', 'Mar', 'Sever', 'Jul', 'Titus', 'Octav'],
    suffixes: ['ius', 'or', 'is', 'aris', 'ia', 'on', 'ora', 'us', 'ian', 'um', 'ix', 'ex'],
    titleWords: ['Magnus', 'Victor', 'Invictus', 'Augustus', 'Felix', 'Priscus'],
    vowels: ['a', 'e', 'i', 'o', 'u', 'ae'],
    consonants: ['c', 'd', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'x'],
  },
  nordic: {
    prefixes: ['Thor', 'Ragnar', 'Bjorn', 'Sig', 'Erik', 'Gunn', 'Sven', 'Olaf', 'Ivar', 'Val', 'Har', 'As'],
    suffixes: ['gard', 'stein', 'son', 'grim', 'heim', 'vald', 'rik', 'ulf', 'mund', 'var', 'karl', 'brand'],
    titleWords: ['Briseciel', 'au Cœur de Pierre', 'le Grand Viking', 'Hache-Rouge', 'l’Invaincu'],
    vowels: ['a', 'e', 'i', 'o', 'u', 'y'],
    consonants: ['b', 'd', 'g', 'k', 'l', 'm', 'n', 'r', 's', 't', 'v'],
  },
  tech: {
    prefixes: ['Neo', 'Syn', 'Omni', 'Velo', 'Kinet', 'Hyper', 'Nex', 'Zeta', 'Volt', 'Aero', 'Quantum', 'Pulse', 'Cyber'],
    suffixes: ['ix', 'ex', 'iq', 'os', 'ify', 'ly', 'io', 'on', 'um', 'ora', 'core', 'net', 'flow'],
    titleWords: ['Core', 'Prime', 'Ultra', 'Next', 'System', 'Engine', 'Stack'],
    vowels: ['a', 'e', 'i', 'o', 'u', 'y'],
    consonants: ['b', 'c', 'd', 'f', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'x', 'z'],
  },
  es: { prefixes: ['Sol', 'Luz', 'Monte', 'Bella', 'Cielo', 'Brisa', 'Fuego', 'Luna', 'Val', 'Flor'], suffixes: ['ero', 'era', 'ado', 'ada', 'illa', 'oso', 'osa', 'ez', 'iel', 'ano'], titleWords: ['el Valiente', 'la Estrella', 'el Guardián', 'la Sombra'], vowels: ['a','e','i','o','u'], consonants: ['b','c','d','f','g','j','l','m','n','ñ','p','r','s','t','v','z'] },
  de: { prefixes: ['Stern', 'Wald', 'Eisen', 'Gold', 'Nebel', 'Dunkel', 'Falk', 'Mond', 'Stein', 'Winter'], suffixes: ['berg', 'wald', 'stein', 'heim', 'mann', 'hardt', 'fried', 'burg', 'tal', 'reich'], titleWords: ['der Kühne', 'der Wächter', 'die Schattenklinge', 'der Wanderer'], vowels: ['a','e','i','o','u','ä','ö','ü'], consonants: ['b','d','f','g','h','k','l','m','n','r','s','t','w','z'] },
  it: { prefixes: ['Luna', 'Bella', 'Monte', 'Sole', 'Fiore', 'Stella', 'Oro', 'Vento', 'Rosa', 'Alba'], suffixes: ['ello', 'ella', 'ini', 'ino', 'etto', 'etta', 'aro', 'ora', 'ano', 'ina'], titleWords: ['il Coraggioso', 'la Stella', 'il Custode', 'l’Ombra'], vowels: ['a','e','i','o','u'], consonants: ['b','c','d','f','g','l','m','n','p','r','s','t','v','z'] },
  pt: { prefixes: ['Sol', 'Luz', 'Monte', 'Brisa', 'Estrela', 'Flor', 'Lua', 'Vale', 'Ouro', 'Mar'], suffixes: ['eiro', 'eira', 'inho', 'inha', 'ado', 'ada', 'oso', 'osa', 'ano', 'ela'], titleWords: ['o Valente', 'a Estrela', 'o Guardião', 'a Sombra'], vowels: ['a','e','i','o','u','ã','õ'], consonants: ['b','c','d','f','g','j','l','m','n','p','r','s','t','v','z'] },
  tr: { prefixes: ['Ay', 'Gök', 'Yıldız', 'Demir', 'Ateş', 'Kara', 'Ak', 'Deniz', 'Alp', 'Güneş'], suffixes: ['han', 'can', 'ay', 'taş', 'soy', 'demir', 'er', 'nur', 'kaya', 'alp'], titleWords: ['Cesur', 'Koruyucu', 'Gölge Kılıcı', 'Yolcu'], vowels: ['a','e','ı','i','o','ö','u','ü'], consonants: ['b','ç','d','g','ğ','k','l','m','n','r','s','ş','t','y','z'] },
  ko: { prefixes: ['하늘', '별', '달', '빛', '바람', '은', '진', '서', '민', '유'], suffixes: ['준', '아', '윤', '호', '린', '우', '현', '솔', '빈', '라'], titleWords: ['용감한 자', '수호자', '그림자 검', '방랑자'], vowels: ['ㅏ','ㅓ','ㅗ','ㅜ','ㅡ','ㅣ'], consonants: ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ','ㅇ','ㅈ','ㅎ'] },
  zh: { prefixes: ['星', '云', '风', '月', '明', '龙', '天', '雪', '灵', '青'], suffixes: ['辰', '岚', '影', '霖', '宇', '瑶', '轩', '宁', '羽', '阳'], titleWords: ['勇者', '守护者', '影之刃', '流浪者'], vowels: ['a','e','i','o','u'], consonants: ['b','d','f','g','h','j','k','l','m','n','q','r','s','t','x','y','z'] },
  ru: { prefixes: ['Звезд', 'Волк', 'Мороз', 'Свет', 'Злат', 'Север', 'Яро', 'Миро', 'Влад', 'Луна'], suffixes: ['мир', 'слав', 'вич', 'ова', 'ев', 'ин', 'ая', 'ский', 'рад', 'гор'], titleWords: ['Храбрый', 'Хранитель', 'Теневой клинок', 'Странник'], vowels: ['a','e','i','o','u','y'], consonants: ['b','d','g','k','l','m','n','r','s','t','v','z'] },
  hi: { prefixes: ['आरव', 'देव', 'सूर्य', 'चंद्र', 'नील', 'राज', 'किरण', 'आनंद', 'वीर', 'ईशा'], suffixes: ['अंश', 'दीप', 'राज', 'ईश', 'इका', 'इंद्र', 'वीर', 'इता', 'अंशु', 'ओम'], titleWords: ['वीर', 'रक्षक', 'छाया तलवार', 'यात्री'], vowels: ['a','ā','i','ī','u','ū','e','o'], consonants: ['b','d','g','h','k','l','m','n','p','r','s','t','v','y'] },
  nl: { prefixes: ['Ster', 'Woud', 'Goud', 'Storm', 'Maan', 'Vuur', 'Zilver', 'Noord', 'Wolf', 'Droom'], suffixes: ['berg', 'veld', 'man', 'dam', 'burg', 'hout', 'wijk', 'meer', 'rijk', 'land'], titleWords: ['de Dappere', 'de Wachter', 'het Schaduwzwaard', 'de Reiziger'], vowels: ['a','e','i','o','u','ij'], consonants: ['b','d','f','g','h','k','l','m','n','r','s','t','v','w','z'] },
  pl: { prefixes: ['Gwiazd', 'Wilk', 'Złot', 'Cień', 'Mroź', 'Jas', 'Wich', 'Kamień', 'Las', 'Srebr'], suffixes: ['owski', 'wicz', 'mir', 'sław', 'bor', 'ek', 'ak', 'ina', 'ora', 'yn'], titleWords: ['Odważny', 'Strażnik', 'Miecz Cienia', 'Wędrowiec'], vowels: ['a','e','i','o','u','y'], consonants: ['b','c','d','k','l','m','n','p','r','s','t','w','z','ł'] },
  sv: { prefixes: ['Stjärn', 'Skog', 'Järn', 'Guld', 'Norr', 'Frost', 'Björn', 'Mån', 'Storm', 'Silver'], suffixes: ['berg', 'ström', 'lund', 'gren', 'holm', 'son', 'borg', 'mark', 'kvist', 'dal'], titleWords: ['den Modige', 'Väktaren', 'Skuggsvärdet', 'Vandraren'], vowels: ['a','e','i','o','u','y','å','ä','ö'], consonants: ['b','d','f','g','h','k','l','m','n','r','s','t','v'] },
  vi: { prefixes: ['Minh', 'An', 'Bảo', 'Thiên', 'Ngọc', 'Quang', 'Hải', 'Lan', 'Linh', 'Tâm'], suffixes: ['anh', 'bình', 'chi', 'dương', 'huy', 'khanh', 'linh', 'nam', 'phúc', 'vy'], titleWords: ['Dũng Sĩ', 'Người Bảo Hộ', 'Kiếm Bóng Tối', 'Lữ Khách'], vowels: ['a','ă','â','e','ê','i','o','ô','ơ','u','ư','y'], consonants: ['b','c','d','đ','g','h','k','l','m','n','p','q','r','s','t','v','x'] },
  id: { prefixes: ['Bintang', 'Cahaya', 'Banyu', 'Surya', 'Mega', 'Bayu', 'Candra', 'Indra', 'Jaya', 'Wira'], suffixes: ['putra', 'dewi', 'sari', 'wan', 'wati', 'jaya', 'kusuma', 'adi', 'tara', 'ning'], titleWords: ['Sang Pemberani', 'Penjaga', 'Pedang Bayangan', 'Pengembara'], vowels: ['a','e','i','o','u'], consonants: ['b','c','d','g','h','j','k','l','m','n','p','r','s','t','w','y'] },
  th: { prefixes: ['ดาว', 'ฟ้า', 'แสง', 'จันทร์', 'นที', 'ธารา', 'นภา', 'กานต์', 'ศิลา', 'พิม'], suffixes: ['พร', 'ชัย', 'ภัทร', 'วัฒน์', 'ริน', 'กานต์', 'พล', 'นภา', 'มณี', 'ธร'], titleWords: ['ผู้กล้า', 'ผู้พิทักษ์', 'ดาบเงา', 'นักเดินทาง'], vowels: ['ะ','า','ิ','ี','ุ','ู','เ','แ','โ'], consonants: ['ก','ข','ค','ง','จ','ช','ด','ต','ท','น','พ','ม','ร','ล','ว','ส'] },
  el: { prefixes: ['Αστέρ', 'Ήλιο', 'Νικο', 'Δωρο', 'Καλλ', 'Θεο', 'Ξενο', 'Δημητ', 'Ελένη', 'Κυρ'], suffixes: ['ανδρος', 'ια', 'ος', 'ης', 'ευς', 'ινα', 'οδωρ', 'ικος', 'αιων', 'αρα'], titleWords: ['ο Γενναίος', 'ο Φύλακας', 'η Σκιά', 'ο Περιπλανώμενος'], vowels: ['a','e','i','o','u'], consonants: ['b','d','g','k','l','m','n','p','r','s','t','v','x'] },
  he: { prefixes: ['אור', 'נועם', 'ארי', 'אלי', 'שי', 'טל', 'זיו', 'לב', 'גל', 'ניר'], suffixes: ['אל', 'יה', 'אור', 'עמי', 'אלי', 'יה', 'אבי', 'רון', 'דן', 'לי'], titleWords: ['האמיץ', 'השומר', 'חרב הצללים', 'הנודד'], vowels: ['a','e','i','o','u'], consonants: ['b','d','g','k','l','m','n','r','s','t','v','z'] },
  cs: { prefixes: ['Hvězd', 'Les', 'Zlat', 'Stín', 'Mraz', 'Větr', 'Kamen', 'Běl', 'Vlč', 'Slun'], suffixes: ['ek', 'ák', 'ík', 'ova', 'oslav', 'mir', 'an', 'ena', 'ice', 'rad'], titleWords: ['Odvážný', 'Strážce', 'Stínový meč', 'Poutník'], vowels: ['a','e','i','o','u','y','á','é','í'], consonants: ['b','d','k','l','m','n','p','r','s','t','v','z','ř','č'] },
  ro: { prefixes: ['Stea', 'Lup', 'Aur', 'Codr', 'Vânt', 'Lun', 'Argint', 'Flac', 'Dor', 'Mir'], suffixes: ['escu', 'eanu', 'aru', 'ina', 'el', 'an', 'ora', 'ica', 'uș', 'ian'], titleWords: ['Cel Viteaz', 'Păzitorul', 'Sabia Umbrei', 'Călătorul'], vowels: ['a','ă','â','e','i','î','o','u'], consonants: ['b','c','d','f','g','h','l','m','n','p','r','s','t','v','z','ș','ț'] },
  da: { prefixes: ['Stjerne', 'Skov', 'Jern', 'Guld', 'Nord', 'Frost', 'Måne', 'Storm', 'Sølv', 'Ulv'], suffixes: ['berg', 'lund', 'holm', 'sen', 'gaard', 'mark', 'dal', 'borg', 'strøm', 'vig'], titleWords: ['den Modige', 'Vogteren', 'Skyggesværdet', 'Vandreren'], vowels: ['a','e','i','o','u','y','æ','ø','å'], consonants: ['b','d','f','g','h','k','l','m','n','r','s','t','v'] },
  fi: { prefixes: ['Tähti', 'Metsä', 'Kulta', 'Varjo', 'Jää', 'Pohja', 'Susi', 'Kuura', 'Valo', 'Rauta'], suffixes: ['nen', 'la', 'lä', 'maa', 'järvi', 'koski', 'virta', 'saari', 'mäki', 'kari'], titleWords: ['Rohkea', 'Vartija', 'Varjomiekka', 'Vaeltaja'], vowels: ['a','e','i','o','u','y','ä','ö'], consonants: ['h','j','k','l','m','n','p','r','s','t','v'] },
  uk: { prefixes: ['Зоря', 'Вовк', 'Мороз', 'Світ', 'Злат', 'Північ', 'Яро', 'Мир', 'Влад', 'Ніч'], suffixes: ['мир', 'слав', 'вич', 'ова', 'ко', 'ук', 'енко', 'гор', 'рад', 'ян'], titleWords: ['Хоробрий', 'Вартовий', 'Тіньовий клинок', 'Мандрівник'], vowels: ['a','e','i','o','u','y'], consonants: ['b','d','g','k','l','m','n','r','s','t','v','z'] },
  bn: { prefixes: ['আকাশ', 'নদী', 'চাঁদ', 'সূর্য', 'তারা', 'বন', 'মেঘ', 'অগ্নি', 'পদ্ম', 'সাগর'], suffixes: ['নাথ', 'দেব', 'কুমার', 'চন্দ্র', 'দীপ', 'রঞ্জন', 'শঙ্কর', 'মিত্র', 'বর্মণ', 'লতা'], titleWords: ['সাহসী', 'রক্ষক', 'ছায়া-তরবারি', 'পথিক'], vowels: ['a','ā','i','ī','u','ū','e','o'], consonants: ['b','d','g','h','k','l','m','n','p','r','s','t'] },
  nb: { prefixes: ['Fjell', 'Skog', 'Jern', 'Gull', 'Nord', 'Frost', 'Måne', 'Storm', 'Sølv', 'Ulv'], suffixes: ['berg', 'lund', 'vik', 'sen', 'stad', 'mark', 'dal', 'borg', 'fjord', 'heim'], titleWords: ['den Modige', 'Vokteren', 'Skyggesverdet', 'Vandreren'], vowels: ['a','e','i','o','u','y','æ','ø','å'], consonants: ['b','d','f','g','h','k','l','m','n','r','s','t','v'] },
};

/* =====================================================================
   3. MULTI-STRATEGY GENERATION ENGINE
===================================================================== */

export type GenerationStrategy =
  | 'phonetic_harmony'
  | 'neologism'
  | 'portmanteau_blend'
  | 'symbolic_evocative'
  | 'punchy_minimal'
  | 'epic_compound';

/**
 * Strategy 1: Classical Syllable & Phonetic Harmony
/**
 * Intelligently combines prefix and suffix parts based on whether they are
 * independent words/phrases (space-separated) or phoneme syllables (joined).
 * Handles French elision, apostrophes, contractions (du, des, au, aux) and avoids truncated fragments.
 */
const FEMININE_ADJECTIVES: Record<string, string> = {
  boiteux: 'boiteuse', joyeux: 'joyeuse', fringant: 'fringante', rieur: 'rieuse', borgne: 'borgne',
  'ébréché': 'ébréchée', 'rouillé': 'rouillée', 'noyé': 'noyée', 'échoué': 'échouée', sanguin: 'sanguine',
  'fumé': 'fumée', 'oublié': 'oubliée', funeste: 'funeste', 'éternel': 'éternelle', souterrain: 'souterraine',
  'perdu': 'perdue', 'sauvage': 'sauvage', gris: 'grise', moderne: 'moderne', 'élégant': 'élégante',
  urbain: 'urbaine', 'maudit': 'maudite', 'ancien': 'ancienne', 'sacré': 'sacrée', 'doré': 'dorée',
  'secret': 'secrète', 'silencieux': 'silencieuse', 'mystérieux': 'mystérieuse', 'dernier': 'dernière',
  'premier': 'première', 'vieux': 'vieille', 'noir': 'noire', 'blanc': 'blanche', 'brave': 'brave',
};
const FEMININE_HEAD_NOUNS = new Set([
  'épée', 'ancre', 'chope', 'lanterne', 'fosse', 'crypte', 'gorge', 'caverne', 'citadelle', 'crevasse',
  'nécropole', 'échoppe', 'galerie', 'bulle', 'maison', 'tour', 'auberge', 'taverne', 'forge', 'étoile',
  'ombre', 'brume', 'flamme', 'lame', 'couronne', 'table', 'ruche', 'oasis', 'clef', 'clé', 'harpe',
]);
function isFeminineHead(prefix: string): boolean {
  const words = prefix.trim().split(/\s+/);
  if (/^(la|une)$/i.test(words[0]) && words.length === 2) return true;
  const head = words.length === 1 ? words[0] : '';
  const stripped = (words.length === 1 ? words[0] : '').replace(/^l['’]/i, '').toLowerCase();
  return (head && FEMININE_HEAD_NOUNS.has(stripped || head.toLowerCase())) || (words.length === 1 && /^l['’]/i.test(head) && FEMININE_HEAD_NOUNS.has(stripped));
}

export function combineParts(p: string, s: string): string {
  let cleanP = String(p || '').trim();
  let cleanS = String(s || '').trim();
  if (!cleanP) return cleanS;
  if (!cleanS) return cleanP;

  // Merge a trailing preposition with the article that starts the second part:
  // "du" + "la Plaine" -> "de la Plaine", "de" + "l’Infini" -> "de l’Infini", "du" + "les Rois" -> "des Rois".
  const prepMatch = cleanP.match(/^(.*?)\s*\b(du|des|de la|de l['’]|de|d['’])$/i);
  const articleMatch = cleanS.match(/^(l['’]|la\s+|le\s+|les\s+)(.+)$/i);
  if (prepMatch && articleMatch) {
    const head = prepMatch[1] ? `${prepMatch[1]} ` : '';
    const art = articleMatch[1].trim().toLowerCase().replace('’', "'");
    const rest = articleMatch[2];
    if (art === "l'") return cleanWord(`${head}de l’${rest}`);
    if (art === 'la') return cleanWord(`${head}de la ${rest}`);
    if (art === 'le') return cleanWord(`${head}du ${rest}`);
    return cleanWord(`${head}des ${rest}`);
  }

  // Hyphenated toponyms ("Pic-" + "Gris" -> "Pic-gris")
  if (/-$/.test(cleanP) && !/^[A-Z0-9][A-Z0-9-]*$/.test(cleanS) && !cleanS.includes(' ')) {
    return cleanWord(cleanP + cleanS.toLowerCase());
  }

  // Adjective agreement: "La Chope" + "Boiteux" -> "La Chope Boiteuse"
  if (!cleanS.includes(' ') && isFeminineHead(cleanP)) {
    const fem = FEMININE_ADJECTIVES[cleanS.toLowerCase()];
    if (fem) cleanS = cap(fem);
  }

  // French preposition agreements and elisions
  const vowelsRegex = /^[aàâeéèêiîoôuûhy]/i;
  const firstWordS = cleanS.trim().split(' ')[0] || '';
  const isPluralS = /[sx]$/i.test(firstWordS);

  if (isPluralS) {
    if (/\bdu$/i.test(cleanP)) {
      cleanP = cleanP.replace(/\bdu$/i, 'des');
    } else if (/\bd['’]un$/i.test(cleanP)) {
      cleanP = cleanP.replace(/\bd['’]un$/i, 'des');
    } else if (/\bde$/i.test(cleanP)) {
      cleanP = cleanP.replace(/\bde$/i, 'des');
    } else if (/\bde\s+la$/i.test(cleanP)) {
      cleanP = cleanP.replace(/\bde\s+la$/i, 'des');
    } else if (/\bde\s+l['’]$/i.test(cleanP)) {
      cleanP = cleanP.replace(/\bde\s+l['’]$/i, 'des');
    } else if (/\ble$/i.test(cleanP)) {
      cleanP = cleanP.replace(/\ble$/i, 'les');
    } else if (/\bla$/i.test(cleanP)) {
      cleanP = cleanP.replace(/\bla$/i, 'les');
    }
  } else {
    // Singular agreement
    if (/\bde$/i.test(cleanP)) {
      if (vowelsRegex.test(cleanS)) {
        cleanP = cleanP.replace(/\bde$/i, "d’");
        return cleanWord(`${cleanP}${cleanS}`);
      } else {
        const isFeminineWord = /(e|ée|ière|ance|ence|ie|onne|esse|ion|té|ude|ure|ade)$/i.test(firstWordS);
        cleanP = cleanP.replace(/\bde$/i, isFeminineWord ? 'de la' : 'du');
      }
    } else if (/\bles$/i.test(cleanP)) {
      if (/\bnaissent\s+les$/i.test(cleanP)) {
        // "naissent" is plural. If the following subject is singular, conjugate to "naît"!
        const isFeminineWord = /(e|ée|ière|ance|ence|ie|onne|esse|ion|té|ude|ure|ade)$/i.test(firstWordS);
        if (vowelsRegex.test(cleanS)) {
          cleanP = cleanP.replace(/\bnaissent\s+les$/i, "naît l’");
          return cleanWord(`${cleanP}${cleanS}`);
        } else {
          cleanP = cleanP.replace(/\bnaissent\s+les$/i, isFeminineWord ? 'naît la' : 'naît le');
        }
      } else {
        const isFeminineWord = /(e|ée|ière|ance|ence|ie|onne|esse|ion|té|ude|ure|ade)$/i.test(firstWordS);
        if (vowelsRegex.test(cleanS)) {
          cleanP = cleanP.replace(/\bles$/i, "l’");
          return cleanWord(`${cleanP}${cleanS}`);
        } else {
          cleanP = cleanP.replace(/\bles$/i, isFeminineWord ? 'la' : 'le');
        }
      }
    } else if (/\ble$/i.test(cleanP)) {
      if (vowelsRegex.test(cleanS)) {
        cleanP = cleanP.replace(/\ble$/i, "l’");
        return cleanWord(`${cleanP}${cleanS}`);
      } else {
        const isFeminineWord = /(e|ée|ière|ance|ence|ie|onne|esse|ion|té|ude|ure|ade)$/i.test(firstWordS);
        if (isFeminineWord) {
          cleanP = cleanP.replace(/\ble$/i, 'la');
        }
      }
    }
  }

  if (/\bde\s+le$/i.test(cleanP)) {
    cleanP = cleanP.replace(/\bde\s+le$/i, 'du');
  } else if (/\bde\s+les$/i.test(cleanP)) {
    cleanP = cleanP.replace(/\bde\s+les$/i, 'des');
  } else if (/\bà\s+le$/i.test(cleanP)) {
    cleanP = cleanP.replace(/\bà\s+le$/i, 'au');
  } else if (/\bà\s+les$/i.test(cleanP)) {
    cleanP = cleanP.replace(/\bà\s+les$/i, 'aux');
  }

  // Apostrophe attachment (e.g. "L'Atelier", "d'Émeraude", "Maison d'")
  if (cleanP.endsWith("'") || cleanP.endsWith("’")) {
    return cleanWord(cleanP + cleanS);
  }

  // If cleanS starts with l' or d' (e.g. "l’Ancien", "l’Ombre", "d’Or") or articles (le, la, les, du, des)
  if (/^[ld]['’]/i.test(cleanS) || /^(?:le|la|les|du|des|au|aux)\s+/i.test(cleanS)) {
    return cleanWord(`${cleanP} ${cleanS}`);
  }

  // Check if either part contains spaces or punctuation
  const pHasSpace = cleanP.includes(' ');
  const sHasSpace = cleanS.includes(' ');

  // Roman numerals, single capital letters and all-caps tags (III, B, MK-IV, X) keep their case.
  // Hyphen-ended prefixes (Kepler-, Terra-) are glued without a space; otherwise a space is used.
  if (/^[A-Z0-9][A-Z0-9-]*$/.test(cleanS) && !/^(ix|ex|iq)$/i.test(cleanS)) {
    return /-$/.test(cleanP) ? cleanWord(cleanP + cleanS) : cleanWord(`${cleanP} ${cleanS}`);
  }
  // All-caps abbreviations used as prefixes (USS, HMS, SS) are always separate words.
  if (/^[A-Z]{2,4}$/.test(cleanP)) {
    return cleanWord(`${cleanP} ${cleanS}`);
  }

  // Bound inflectional/derivative suffixes that should be glued (e.g. -ix, -ex, -ify, -ora, -ly, -ien, -ette)
  const isBoundSuffix = /^(ix|ex|iq|ify|ly|ia|um|is|us|os|or|on|en|el|ar|er|ine|elle|ette|ance|ence|ium|oid|to|ki|ya|shi|jin|ka|ro)$/i.test(
    cleanS
  );

  if (pHasSpace || sHasSpace) {
    return cleanWord(`${cleanP} ${cleanS}`);
  }

  // If both parts look like capitalized standalone words and not bound suffixes
  const isWordP = cleanP.length >= 4 || /^[A-ZÀ-ÿ][a-zà-ÿ]{2,}$/.test(cleanP);
  const isWordS = cleanS.length >= 3 && /^[A-ZÀ-ÿ]/.test(cleanS);

  if (isWordP && isWordS && !isBoundSuffix) {
    return cleanWord(`${cleanP} ${cleanS}`);
  }

  return cleanWord(cleanP + cleanS.toLowerCase());
}

/**
 * Strategy 1: Classical Syllable & Phonetic Harmony
 */
function generatePhoneticHarmony(
  d: SubcategoryData,
  length: LengthOption,
  genLang: GenLanguageCode
): string {
  const langRules = LANGUAGE_PHONETICS[genLang] || LANGUAGE_PHONETICS.auto;
  // An explicit language must control the linguistic roots, not just influence them randomly.
  // "auto" keeps the generator's category-specific vocabulary.
  const prefixes =
    genLang !== 'auto' && langRules.prefixes.length > 0
      ? langRules.prefixes
      : d.prefixes;
  const suffixes =
    genLang !== 'auto' && langRules.suffixes.length > 0
      ? langRules.suffixes
      : d.suffixes;

  const p = (randomItem(prefixes) as string) || (d.prefixes[0] || 'Nova');
  const s = (randomItem(suffixes) as string) || (d.suffixes[0] || 'is');
  const m = (randomItem(d.middle || []) as string) || '';

  if (length === 'short') {
    const shortSuffixes = suffixes.filter((x) => x.length <= 3 && !x.includes(' ') && !x.includes("'"));
    const chosenS = shortSuffixes.length > 0 ? (randomItem(shortSuffixes) as string) : s;
    const shortPrefixes = prefixes.filter((x) => x.length <= 4 && !x.includes(' ') && !x.includes("'"));
    const chosenP = shortPrefixes.length > 0 ? (randomItem(shortPrefixes) as string) : p;
    return combineParts(chosenP, chosenS);
  }
  if (length === 'long') {
    if (m) {
      return combineParts(combineParts(p, m), s);
    }
    const longPrefixes = prefixes.filter((x) => x.length >= 5 || x.includes(' '));
    const chosenP = longPrefixes.length > 0 ? (randomItem(longPrefixes) as string) : p;
    return combineParts(chosenP, s);
  }
  return combineParts(p, s);
}

/**
 * Strategy 2: Neologism (Constructed pronounceable words from category's own vocabulary)
 */
function generateNeologism(
  d: SubcategoryData,
  length: LengthOption,
  genLang: GenLanguageCode
): string {
  // Only use single standalone words without spaces or apostrophes
  const langRules = LANGUAGE_PHONETICS[genLang] || LANGUAGE_PHONETICS.auto;
  const sourcePrefixes = genLang !== 'auto' && langRules.prefixes.length ? langRules.prefixes : d.prefixes;
  const sourceSuffixes = genLang !== 'auto' && langRules.suffixes.length ? langRules.suffixes : d.suffixes;
  const singleWords = [...sourcePrefixes, ...sourceSuffixes].filter(
    (w) => !w.includes(' ') && !w.includes("'") && !w.includes('’') && w.length >= 2
  );
  if (singleWords.length >= 2) {
    const w1 = randomItem(singleWords) || 'Nova';
    const w2 = randomItem(singleWords) || 'Velo';
    if (w1.toLowerCase() === w2.toLowerCase()) {
      return generatePhoneticHarmony(d, length, genLang);
    }
    const cut1 = Math.max(2, Math.min(w1.length - 1, Math.floor(w1.length * 0.6)));
    const cut2 = Math.max(1, Math.min(w2.length - 2, Math.floor(w2.length * 0.4)));
    const p1 = w1.slice(0, cut1);
    const p2 = w2.slice(cut2);
    const combined = cleanWord(cap(p1 + p2.toLowerCase()));
    if (combined.length >= 3 && combined.length <= 14) {
      return combined;
    }
  }
  return generatePhoneticHarmony(d, length, genLang);
}

/**
 * Strategy 3: Portmanteau Blend (Blending two distinct evocative roots)
 */
function generatePortmanteauBlend(
  d: SubcategoryData,
  genLang: GenLanguageCode
): string {
  const langRules = LANGUAGE_PHONETICS[genLang] || LANGUAGE_PHONETICS.auto;
  const rootsA = genLang !== 'auto' && langRules.prefixes.length
    ? langRules.prefixes
    : (d.prefixes.length > 0 ? d.prefixes : ['Nova', 'Kaly', 'Velo', 'Aero', 'Zeta', 'Sol']);
  const rootsB = genLang !== 'auto' && langRules.suffixes.length
    ? langRules.suffixes
    : (d.suffixes.length > 0 ? d.suffixes : ['tech', 'flow', 'is', 'ora', 'craft', 'wave']);

  const first = (randomItem(rootsA) as string) || 'Nova';
  const second = (randomItem(rootsB) as string) || 'craft';

  // If either contains spaces or apostrophes, combine cleanly as distinct words
  if (first.includes(' ') || second.includes(' ') || first.includes("'") || second.includes("'") || first.length > 10) {
    return combineParts(first, second);
  }

  // Smooth blending transition: drop trailing vowel of first if second starts with vowel
  let front = first;
  let back = second.toLowerCase();
  if (/[aeiouy]$/i.test(front) && /^[aeiouy]/i.test(back)) {
    front = front.slice(0, -1);
  }
  return cleanWord(front + back);
}

/**
 * Strategy 4: Symbolic & Evocative Root Composition
 */
function generateSymbolicEvocative(
  generatorId: GeneratorId,
  d: SubcategoryData,
  genLang: GenLanguageCode
): string {
  const symbolicMap: Record<string, string[]> = {
    brand: ['Aura', 'Lumi', 'Pure', 'Vesta', 'Sol', 'Verve', 'Cael', 'Nobil'],
    fantasy: ['Ael', 'Myth', 'Sylv', 'Astra', 'Rune', 'Eldar', 'Ignis', 'Chrono'],
    startup: ['Veloce', 'Pulse', 'Hyper', 'Nexus', 'Vertex', 'Synt', 'Kinet', 'Apex'],
    dragon: ['Pyros', 'Drak', 'Ignar', 'Volcan', 'Brim', 'Scal', 'Vapour', 'Terror'],
    gamertag: ['Vex', 'Rift', 'Apex', 'Strike', 'Ghost', 'Zen', 'Kyo', 'Raze'],
    boss: ['Mael', 'Nox', 'Malok', 'Gor', 'Zul', 'Khar', 'Dread', 'Void'],
    weapon: ['Chante', 'Fend', 'Tranche', 'Aube', 'Givre', 'Foudre', 'Rune'],
    starship: ['Vanguard', 'Aurora', 'Titan', 'Horizon', 'Endeavour', 'Aegis'],
    cyberpunk: ['Chrome', 'Neon', 'Glitch', 'Spike', 'Wire', 'Cyber', 'Data'],
  };

  const langRules = LANGUAGE_PHONETICS[genLang] || LANGUAGE_PHONETICS.auto;
  const pool = genLang !== 'auto' && langRules.prefixes.length
    ? langRules.prefixes
    : (symbolicMap[generatorId] || d.prefixes);
  const root = randomItem(pool) || 'Nova';
  const suffixPool = genLang !== 'auto' && langRules.suffixes.length
    ? langRules.suffixes
    : (d.suffixes.length > 0 ? d.suffixes : ['is', 'or', 'ex', 'ix', 'um', 'ia']);
  const suffix = randomItem(suffixPool) || 'is';

  return combineParts(root, suffix);
}

/**
 * Strategy 5: Punchy Minimal (Compact, 1-2 sharp syllables)
 */
function generatePunchyMinimal(d: SubcategoryData, genLang: GenLanguageCode = 'auto'): string {
  const langRules = LANGUAGE_PHONETICS[genLang] || LANGUAGE_PHONETICS.auto;
  const prefixes = genLang !== 'auto' && langRules.prefixes.length ? langRules.prefixes : d.prefixes;
  const suffixes = genLang !== 'auto' && langRules.suffixes.length ? langRules.suffixes : d.suffixes;
  const p = (randomItem(prefixes) as string) || 'Vex';
  const s = (randomItem(suffixes) as string) || 'o';

  // If p is a full multi-word phrase, combine cleanly without chopping
  if (p.includes(' ') || s.includes(' ') || p.includes("'") || s.includes("'") || p.length > 8) {
    return combineParts(p, s);
  }

  // Clean compact syllables
  if (p.length <= 4 && s.length <= 3) {
    return cleanWord(p + s.toLowerCase());
  }

  const shortP = d.prefixes.find((x) => x.length <= 4 && !x.includes(' ') && !x.includes("'")) || p.slice(0, 3);
  const shortS = d.suffixes.find((x) => x.length <= 3 && !x.includes(' ') && !x.includes("'")) || s.slice(0, 2);
  return cleanWord(cap(shortP + shortS.toLowerCase()));
}

/**
 * Clean up awkward triple letters, invalid clusters, and hanging prepositions
 */
function cleanWord(str: string): string {
  // Collapse accidental triple letters, but leave roman numerals (III, XXX) untouched.
  const collapsed = String(str)
    .split(/(\s+)/)
    .map((token) =>
      /^[IVXLCDM]+$/.test(token)
        ? token
        : token
            .replace(/([aeiouAEIOUà-ÿ])\1{2,}/gi, '$1')
            .replace(/([b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z])\1{2,}/gi, '$1$1')
    )
    .join('');
  let res = normalize(collapsed.replace(/\s+/g, ' ').trim());
  // Remove trailing dangling apostrophes or single-letter fragments
  res = res.replace(/['’\-–]\s*$/, '').trim();
  // Remove dangling articles like "de l'", "d'", "le", "la" at the end of string
  res = res.replace(/\b(?:de\s+l['’]?|d['’]|du|des|le|la|les|un|une|the|of|in|at|on|for|with|and|by)['’]?$/i, '').trim();
  return res;
}

/* =====================================================================
   4. INTERNAL HEURISTIC SCORER
===================================================================== */

interface ScoredCandidate {
  name: string;
  score: number;
  strategy: GenerationStrategy;
}

export function scoreCandidate(
  name: string,
  lengthOpt: LengthOption,
  genderOpt: GenderOption
): number {
  if (!name || name.length < 2) return 0;

  // Strict rejection of incomplete fragments, dangling articles/prepositions
  if (/(?:^|[\s'’])(?:de\s+l|d|l|de|du|des|le|la|les|un|une|the|of|in|at|on|for|with|and|by)['’]?$/i.test(name)) {
    return 0;
  }
  if (/['’]$/.test(name)) return 0;
  if (/\s+[a-zA-Z]$/.test(name)) return 0;
  if (/(?<![\p{L}\p{M}])([\p{L}\p{M}]+)\s+\1(?![\p{L}\p{M}])/iu.test(name)) return 0; // duplicate consecutive words (e.g. "Zone Zone")

  let score = 70; // baseline acceptable quality

  // Count Unicode letters instead of Latin-only characters so names in Arabic,
  // CJK, Cyrillic and other scripts receive fair length scoring.
  const len = Array.from(name.normalize('NFC').matchAll(/[\p{L}\p{M}]/gu)).length;

  // Length compliance bonus/penalty
  if (lengthOpt === 'short') {
    if (len >= 3 && len <= 6) score += 20;
    else if (len > 8) score -= 30;
  } else if (lengthOpt === 'long') {
    if (len >= 8) score += 20;
    else if (len < 6) score -= 30;
  } else {
    if (len >= 5 && len <= 9) score += 15;
    else if (len > 14) score -= 15;
  }

  // Apply Latin phonetic heuristics only when the name contains Latin letters.
  // Vowel ratios are not meaningful for Arabic, Chinese, Japanese, etc.
  const hasLatinLetters = /\p{Script=Latin}/u.test(name);
  if (hasLatinLetters) {
    const vowels = (name.match(/[aeiouyAEIOUYà-ÿ]/gi) || []).length;
    const consonants = (name.match(/[b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z]/gi) || []).length;
    const ratio = vowels / Math.max(1, consonants);

    if (ratio >= 0.4 && ratio <= 1.4) {
      score += 15;
    } else if (ratio < 0.25 || ratio > 2.5) {
      score -= 25;
    }

    if (/[b-df-hj-np-tv-z]{4,}/i.test(name)) {
      score -= 30;
    }
  }

  // Gender nuance scoring
  if (genderOpt === 'female') {
    if (/[aei]$/i.test(name) || /^(Ael|Mira|Sera|Lira|Yuna|Ela|Rose|Iris|Flora)/i.test(name)) {
      score += 15;
    }
  } else if (genderOpt === 'male') {
    if (/(?:or|un|an|us|ar|ok|el|en)$/i.test(name) || /^(Kael|Thar|Ryn|Aren|Marc|Léo|Liam|Louis)/i.test(name)) {
      score += 15;
    }
  }

  return Math.min(100, Math.max(0, score));
}

/* =====================================================================
   5. HISTORY AND RECENT NAMES WINDOW
===================================================================== */

function getRecentNames(): string[] {
  if (deterministicMode) return []; // seeded batches must not depend on previous history
  try {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const raw = localStorage.getItem(RECENT_NAMES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    // Guard against corrupted storage (object, null, numbers…) so later .some()/.filter() calls cannot throw.
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function recordRecentNames(names: string[]): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const current = getRecentNames();
    const updated = Array.from(new Set([...names, ...current])).slice(0, RECENT_LIMIT);
    localStorage.setItem(RECENT_NAMES_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/* =====================================================================
   6. METADATA & PRONUNCIATION
===================================================================== */

const LANGUAGE_SCRIPT_PATTERNS: Record<string, RegExp> = {
  en: /\\p{Script=Latin}/u, fr: /\\p{Script=Latin}/u, es: /\\p{Script=Latin}/u,
  de: /\\p{Script=Latin}/u, it: /\\p{Script=Latin}/u, pt: /\\p{Script=Latin}/u,
  tr: /\\p{Script=Latin}/u, nl: /\\p{Script=Latin}/u, pl: /\\p{Script=Latin}/u,
  sv: /\\p{Script=Latin}/u, vi: /\\p{Script=Latin}/u, id: /\\p{Script=Latin}/u,
  cs: /\\p{Script=Latin}/u, ro: /\\p{Script=Latin}/u, da: /\\p{Script=Latin}/u,
  fi: /\\p{Script=Latin}/u, nb: /\\p{Script=Latin}/u, latin: /\\p{Script=Latin}/u,
  nordic: /\\p{Script=Latin}/u, tech: /\\p{Script=Latin}/u,
  ar: /\\p{Script=Arabic}/u, he: /\\p{Script=Hebrew}/u,
  ja: /[\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}]/u,
  ko: /[\\p{Script=Hangul}\\p{Script=Han}]/u, zh: /\\p{Script=Han}/u,
  ru: /\\p{Script=Cyrillic}/u, uk: /\\p{Script=Cyrillic}/u,
  hi: /\\p{Script=Devanagari}/u, bn: /\\p{Script=Bengali}/u,
  th: /\\p{Script=Thai}/u, el: /\\p{Script=Greek}/u,
};

function isScriptCompatibleText(value: string, language: GenLanguageCode): boolean {
  const expected = LANGUAGE_SCRIPT_PATTERNS[language];
  if (!expected) return true;
  const letters = Array.from(value).filter((char) => /\\p{L}/u.test(char));
  if (!letters.length) return false;
  const matching = letters.filter((char) => expected.test(char)).length;
  return matching / letters.length >= 0.75;
}

/** A rough reading aid for Latin-script names only; no fake transliteration is shown. */
function generatePronunciation(name: string, language: GenLanguageCode = 'auto'): string | undefined {
  if (language !== 'auto' && !isScriptCompatibleText(name, language)) return undefined;
  const clean = name.replace(/[^\\p{Script=Latin} ]/gu, '').trim();
  if (!clean) return undefined;
  const parts = clean.split(' ');
  const phoneticParts = parts.map((part) => {
    if (part.length <= 3) return part.toUpperCase();
    const half = Math.ceil(part.length / 2);
    return `${part.slice(0, half).toLowerCase()}-${part.slice(half).toUpperCase()}`;
  });
  return `[${phoneticParts.join(' ')}]`;
}

function buildProfessionalMetadata(
  name: string,
  generatorId: GeneratorId,
  styleLabel: string,
  length: LengthOption
): {
  strengths: string[];
  watchouts: string[];
  disclaimer?: string;
  origin: string;
} {
  const meta = GENERATORS_METADATA[generatorId];
  const isBusiness =
    meta?.category === 'business' ||
    [
      'brand',
      'business',
      'product',
      'startup',
      'shop',
      'domain',
      'app',
      'feature',
      'service',
      'slogan',
      'crypto_token',
      'software_tool',
      'ecommerce_store',
      'marketing_agency',
    ].includes(generatorId);

  const strengths: string[] = [];
  const watchouts: string[] = [];

  if (length === 'short') {
    strengths.push('Excellente mémorisation immédiate', 'Idéal sur petits écrans, avatars et callouts');
    watchouts.push('Les noms courts sont très demandés sur les extensions .com');
  } else if (length === 'long') {
    strengths.push('Grande richesse narrative', 'Forte distinction face à la concurrence');
    watchouts.push('Testez la lisibilité rapide sur supports imprimés et en affichage réduit');
  } else {
    strengths.push('Équilibre optimal entre originalité et fluidité', 'Prononciation universelle aisée');
    watchouts.push('Vérifiez l’absence d’homonymes proches dans votre univers');
  }

  if (isBusiness) {
    strengths.push('Potentiel d’impact commercial et marque ombrelle');
    watchouts.push('Effectuez une recherche de disponibilité officielle (INPI, EUIPO, USPTO)');
  } else {
    strengths.push(`Fidèle à l’archétype ${styleLabel}`, 'Immersion thématique immédiate');
  }

  const disclaimer = isBusiness
    ? 'Avertissement juridique : Les propositions sont fournies à titre d’inspiration créative. La disponibilité de marque ou de domaine doit faire l’objet d’une vérification officielle.'
    : undefined;

  const origin = `Forge NameForge • Archétype ${styleLabel}`;

  return { strengths, watchouts, disclaimer, origin };
}

/* =====================================================================
   7. MAIN EXPORTED FUNCTION
===================================================================== */

/* Localized group words for the "group" format (used when a generation language is selected). */
const GROUP_WORDS: Record<string, { business: string[]; innovation: string[]; fantasy: string[]; other: string[] }> = {
  fr: { business: ['Atelier', 'Studio', 'Maison', 'Collectif', 'Agence'], innovation: ['Lab', 'Réseau', 'Système', 'Noyau', 'Projet'], fantasy: ['Ordre', 'Clan', 'Guilde', 'Cercle', 'Légion'], other: ['Collectif', 'Club', 'Troupe', 'Cercle', 'Équipe'] },
  en: { business: ['Studio', 'House of', 'Collective', 'Group', 'Agency'], innovation: ['Lab', 'Engine', 'System', 'Network', 'Core'], fantasy: ['Order of', 'Clan', 'Guild of', 'Circle of', 'Legion of'], other: ['Collective', 'Club', 'Troupe', 'Circle', 'Crew'] },
  es: { business: ['Taller', 'Estudio', 'Casa', 'Colectivo', 'Agencia'], innovation: ['Laboratorio', 'Red', 'Sistema', 'Núcleo', 'Proyecto'], fantasy: ['Orden', 'Clan', 'Gremio', 'Círculo', 'Legión'], other: ['Colectivo', 'Club', 'Compañía', 'Círculo', 'Equipo'] },
  de: { business: ['Atelier', 'Studio', 'Haus', 'Kollektiv', 'Agentur'], innovation: ['Labor', 'Netzwerk', 'System', 'Kern', 'Projekt'], fantasy: ['Orden', 'Clan', 'Gilde', 'Zirkel', 'Legion'], other: ['Kollektiv', 'Club', 'Truppe', 'Kreis', 'Team'] },
  it: { business: ['Bottega', 'Studio', 'Casa', 'Collettivo', 'Agenzia'], innovation: ['Laboratorio', 'Rete', 'Sistema', 'Nucleo', 'Progetto'], fantasy: ['Ordine', 'Clan', 'Gilda', 'Cerchio', 'Legione'], other: ['Collettivo', 'Club', 'Compagnia', 'Cerchio', 'Squadra'] },
  pt: { business: ['Ateliê', 'Estúdio', 'Casa', 'Coletivo', 'Agência'], innovation: ['Laboratório', 'Rede', 'Sistema', 'Núcleo', 'Projeto'], fantasy: ['Ordem', 'Clã', 'Guilda', 'Círculo', 'Legião'], other: ['Coletivo', 'Clube', 'Trupe', 'Círculo', 'Equipa'] },
  ar: { business: ['مشغل', 'استوديو', 'دار', 'تجمّع', 'وكالة'], innovation: ['مختبر', 'شبكة', 'نظام', 'نواة', 'مشروع'], fantasy: ['رتبة', 'عشيرة', 'نقابة', 'حلقة', 'فيلق'], other: ['تجمّع', 'نادي', 'فرقة', 'حلقة', 'فريق'] },
  tr: { business: ['Atölye', 'Stüdyo', 'Konak', 'Kolektif', 'Ajans'], innovation: ['Laboratuvar', 'Ağ', 'Sistem', 'Çekirdek', 'Proje'], fantasy: ['Tarikat', 'Klan', 'Lonca', 'Çember', 'Lejyon'], other: ['Kolektif', 'Kulüp', 'Topluluk', 'Çember', 'Ekip'] },
  ja: { business: ['工房', 'スタジオ', '館', '集団', 'エージェンシー'], innovation: ['ラボ', 'ネットワーク', 'システム', 'コア', 'プロジェクト'], fantasy: ['騎士団', '一族', 'ギルド', '結社', '軍団'], other: ['集団', 'クラブ', '一座', 'サークル', 'チーム'] },
  ko: { business: ['공방', '스튜디오', '하우스', '컬렉티브', '에이전시'], innovation: ['연구소', '네트워크', '시스템', '코어', '프로젝트'], fantasy: ['기사단', '일족', '길드', '결사', '군단'], other: ['집단', '클럽', '극단', '서클', '팀'] },
  zh: { business: ['工坊', '工作室', '之家', '联盟', '机构'], innovation: ['实验室', '网络', '系统', '核心', '计划'], fantasy: ['骑士团', '氏族', '公会', '议会', '军团'], other: ['团体', '俱乐部', '剧团', '圈子', '小队'] },
  ru: { business: ['Мастерская', 'Студия', 'Дом', 'Коллектив', 'Агентство'], innovation: ['Лаборатория', 'Сеть', 'Система', 'Ядро', 'Проект'], fantasy: ['Орден', 'Клан', 'Гильдия', 'Круг', 'Легион'], other: ['Коллектив', 'Клуб', 'Труппа', 'Круг', 'Команда'] },
  hi: { business: ['कार्यशाला', 'स्टूडियो', 'भवन', 'समूह', 'एजेंसी'], innovation: ['प्रयोगशाला', 'नेटवर्क', 'प्रणाली', 'केंद्र', 'परियोजना'], fantasy: ['संघ', 'कुल', 'गिल्ड', 'मंडल', 'सेना'], other: ['समूह', 'क्लब', 'मंडली', 'मंडल', 'दल'] },
  nl: { business: ['Atelier', 'Studio', 'Huis', 'Collectief', 'Bureau'], innovation: ['Lab', 'Netwerk', 'Systeem', 'Kern', 'Project'], fantasy: ['Orde', 'Clan', 'Gilde', 'Kring', 'Legioen'], other: ['Collectief', 'Club', 'Gezelschap', 'Kring', 'Team'] },
  pl: { business: ['Pracownia', 'Studio', 'Dom', 'Kolektyw', 'Agencja'], innovation: ['Laboratorium', 'Sieć', 'System', 'Rdzeń', 'Projekt'], fantasy: ['Zakon', 'Klan', 'Gildia', 'Krąg', 'Legion'], other: ['Kolektyw', 'Klub', 'Trupa', 'Krąg', 'Zespół'] },
  sv: { business: ['Ateljé', 'Studio', 'Hus', 'Kollektiv', 'Byrå'], innovation: ['Labb', 'Nätverk', 'System', 'Kärna', 'Projekt'], fantasy: ['Orden', 'Klan', 'Gille', 'Krets', 'Legion'], other: ['Kollektiv', 'Klubb', 'Trupp', 'Krets', 'Lag'] },
  vi: { business: ['Xưởng', 'Studio', 'Gia', 'Tập thể', 'Hãng'], innovation: ['Phòng thí nghiệm', 'Mạng lưới', 'Hệ thống', 'Lõi', 'Dự án'], fantasy: ['Hội', 'Gia tộc', 'Bang hội', 'Vòng', 'Quân đoàn'], other: ['Tập thể', 'Câu lạc bộ', 'Đoàn', 'Vòng', 'Đội'] },
  id: { business: ['Bengkel', 'Studio', 'Rumah', 'Kolektif', 'Agensi'], innovation: ['Lab', 'Jaringan', 'Sistem', 'Inti', 'Proyek'], fantasy: ['Ordo', 'Klan', 'Guild', 'Lingkaran', 'Legiun'], other: ['Kolektif', 'Klub', 'Rombongan', 'Lingkaran', 'Tim'] },
  th: { business: ['โรงงาน', 'สตูดิโอ', 'บ้าน', 'กลุ่ม', 'เอเจนซี'], innovation: ['แล็บ', 'เครือข่าย', 'ระบบ', 'แกนกลาง', 'โปรเจกต์'], fantasy: ['ภาคี', 'ตระกูล', 'กิลด์', 'วงกลม', 'กองทัพ'], other: ['กลุ่ม', 'ชมรม', 'คณะ', 'วง', 'ทีม'] },
  el: { business: ['Εργαστήρι', 'Στούντιο', 'Οίκος', 'Συλλογικότητα', 'Πρακτορείο'], innovation: ['Εργαστήριο', 'Δίκτυο', 'Σύστημα', 'Πυρήνας', 'Έργο'], fantasy: ['Τάγμα', 'Φυλή', 'Συντεχνία', 'Κύκλος', 'Λεγεώνα'], other: ['Συλλογικότητα', 'Λέσχη', 'Θίασος', 'Κύκλος', 'Ομάδα'] },
  he: { business: ['סדנה', 'סטודיו', 'בית', 'קולקטיב', 'סוכנות'], innovation: ['מעבדה', 'רשת', 'מערכת', 'ליבה', 'פרויקט'], fantasy: ['מסדר', 'שבט', 'גילדה', 'מעגל', 'לגיון'], other: ['קולקטיב', 'מועדון', 'להקה', 'מעגל', 'צוות'] },
  cs: { business: ['Ateliér', 'Studio', 'Dům', 'Kolektiv', 'Agentura'], innovation: ['Laboratoř', 'Síť', 'Systém', 'Jádro', 'Projekt'], fantasy: ['Řád', 'Klan', 'Cech', 'Kruh', 'Legie'], other: ['Kolektiv', 'Klub', 'Soubor', 'Kruh', 'Tým'] },
  ro: { business: ['Atelier', 'Studio', 'Casa', 'Colectiv', 'Agenția'], innovation: ['Laborator', 'Rețea', 'Sistem', 'Nucleu', 'Proiect'], fantasy: ['Ordinul', 'Clanul', 'Breasla', 'Cercul', 'Legiunea'], other: ['Colectiv', 'Club', 'Trupă', 'Cerc', 'Echipa'] },
  da: { business: ['Atelier', 'Studio', 'Hus', 'Kollektiv', 'Bureau'], innovation: ['Lab', 'Netværk', 'System', 'Kerne', 'Projekt'], fantasy: ['Orden', 'Klan', 'Lav', 'Kreds', 'Legion'], other: ['Kollektiv', 'Klub', 'Trup', 'Kreds', 'Hold'] },
  fi: { business: ['Paja', 'Studio', 'Talo', 'Kollektiivi', 'Toimisto'], innovation: ['Laboratorio', 'Verkosto', 'Järjestelmä', 'Ydin', 'Hanke'], fantasy: ['Veljeskunta', 'Klaani', 'Kilta', 'Piiri', 'Legioona'], other: ['Kollektiivi', 'Kerho', 'Seurue', 'Piiri', 'Tiimi'] },
  uk: { business: ['Майстерня', 'Студія', 'Дім', 'Колектив', 'Агенція'], innovation: ['Лабораторія', 'Мережа', 'Система', 'Ядро', 'Проєкт'], fantasy: ['Орден', 'Клан', 'Гільдія', 'Коло', 'Легіон'], other: ['Колектив', 'Клуб', 'Трупа', 'Коло', 'Команда'] },
  bn: { business: ['কারখানা', 'স্টুডিও', 'ভবন', 'সমষ্টি', 'এজেন্সি'], innovation: ['পরীক্ষাগার', 'নেটওয়ার্ক', 'ব্যবস্থা', 'কেন্দ্র', 'প্রকল্প'], fantasy: ['সংঘ', 'গোত্র', 'গিল্ড', 'বৃত্ত', 'বাহিনী'], other: ['সমষ্টি', 'ক্লাব', 'দল', 'বৃত্ত', 'টিম'] },
  nb: { business: ['Atelier', 'Studio', 'Hus', 'Kollektiv', 'Byrå'], innovation: ['Lab', 'Nettverk', 'System', 'Kjerne', 'Prosjekt'], fantasy: ['Orden', 'Klan', 'Gilde', 'Krets', 'Legion'], other: ['Kollektiv', 'Klubb', 'Trupp', 'Krets', 'Lag'] },
};

/**
 * Random source used by the whole engine. It is Math.random by default and is swapped for a seeded
 * generator (mulberry32) while generateNames runs with an explicit `seed`, which makes a batch reproducible.
 */
let activeRandom: () => number = Math.random;
let deterministicMode = false;

function hashSeed(seed: string | number): number {
  const text = String(seed);
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface GenerateOptions {
  generator?: GeneratorId;
  generatorId?: GeneratorId;
  style?: string;
  length?: LengthOption;
  format?: FormatOption;
  gender?: GenderOption;
  genLanguage?: GenLanguageCode;
  quantity?: number;
  count?: number;
  keyword?: string;
  /** Optional seed: the same seed and options always produce the same batch (recent-name history is ignored). */
  seed?: string | number;
}

/** Public entry point: runs the engine, deterministically when a seed is provided. */
export function generateNames(options: GenerateOptions): GeneratedName[] {
  if (options.seed === undefined || options.seed === null || options.seed === '') {
    return generateNamesInternal(options);
  }
  const previousRandom = activeRandom;
  const previousMode = deterministicMode;
  activeRandom = mulberry32(hashSeed(options.seed));
  deterministicMode = true;
  try {
    return generateNamesInternal(options);
  } finally {
    activeRandom = previousRandom;
    deterministicMode = previousMode;
  }
}

function generateNamesInternal(options: GenerateOptions): GeneratedName[] {
  const targetGenerator = options.generator || options.generatorId || 'fantasy';
  const targetStyle = options.style || 'default';
  const quantity = Math.max(1, options.quantity ?? options.count ?? 9);
  const {
    length = 'medium',
    format = 'title',
    gender = 'any',
    genLanguage = 'auto',
    keyword = '',
  } = options;

  const resolved = resolveStyleData(targetGenerator, targetStyle, SUBCATEGORIES_DATA);
  const meta = GENERATORS_METADATA[targetGenerator];
  const categoryFamily = meta?.category || 'creative';
  const isFantasyOrLore = categoryFamily === 'fantasy';

  const out: GeneratedName[] = [];
  const seenInBatch: string[] = [];
  const recentNames = getRecentNames();
  const cleanKw = keyword.trim().replace(/[^\p{L}\p{M}\p{N}-]/gu, '');

  // =========================================================================
  // SPECIALIZED PIPELINE: REAL ATTESTED BABY NAMES (Priorité Absolue Qualité)
  // =========================================================================
  if (targetGenerator === 'baby_name') {
    const attestedSource =
      resolved.attestedItems && resolved.attestedItems.length > 0
        ? resolved.attestedItems
        : ATTESTED_BABY_NAMES;

    // Apply semantic filters first. Never silently ignore gender or a user keyword:
    // an empty result is more honest than returning unrelated names.
    const semanticPool = attestedSource.filter((item) => {
      if (gender === 'female' && item.gender === 'male') return false;
      if (gender === 'male' && item.gender === 'female') return false;
      if (gender === 'neutral' && item.gender !== 'neutral') return false;

      if (cleanKw) {
        const kwLower = cleanKw.normalize('NFC').toLocaleLowerCase();
        const matchesName = item.name.normalize('NFC').toLocaleLowerCase().includes(kwLower);
        const matchesOrigin = item.origin.normalize('NFC').toLocaleLowerCase().includes(kwLower);
        const matchesMeaning = item.meaning.normalize('NFC').toLocaleLowerCase().includes(kwLower);
        if (!matchesName && !matchesOrigin && !matchesMeaning) return false;
      }
      return true;
    });

    // Keep the length preference when possible, but relax it alone if it would
    // leave no choices. Gender and keyword constraints are never relaxed.
    let pool = semanticPool.filter((item) => {
      if (length === 'short' && item.name.length > 5) return false;
      if (length === 'long' && item.name.length < 7) return false;
      return true;
    });
    if (pool.length === 0) pool = semanticPool;
    if (pool.length === 0) return [];

    // Unbiased Fisher–Yates shuffle; Array.sort(Math.random) is not a valid shuffle.
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(activeRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (const item of shuffled) {
      if (out.length >= quantity) break;
      if (seenInBatch.includes(item.name.toLowerCase())) continue;
      if (recentNames.some((r) => r.toLowerCase() === item.name.toLowerCase())) continue;

      seenInBatch.push(item.name.toLowerCase());
      out.push({
        name: item.name,
        description: `🌸 Prénom certifié d’origine ${item.origin} signifiant « ${item.meaning} ».${item.variants && item.variants.length > 0 ? ` Variantes connues : ${item.variants.join(', ')}.` : ''}`,
        style: resolved.label || targetStyle,
        icon: '👶',
        bestFor: resolved.bestFor || 'futurs enfants, fratries et faire-part',
        tone: resolved.tone || 'Harmonieux • intemporel • doux',
        generatorId: 'baby_name',
        pronunciation: generatePronunciation(item.name, genLanguage),
        strengths: [
          'Prénom authentique attesté à l’état civil',
          `Origine étymologique certifiée : ${item.origin}`,
          'Élocution quotidienne fluide et douce',
        ],
        watchouts: ['Prononcez-le avec votre nom de famille pour vérifier l’accord phonétique'],
        origin: `Origine certifiée : ${item.origin}`,
        meaning: item.meaning,
        isAttested: true,
        variants: item.variants,
        gender: item.gender,
      });
    }

    // Second pass if quantity not yet reached without duplicates
    if (out.length < quantity) {
      for (const item of shuffled) {
        if (out.length >= quantity) break;
        if (seenInBatch.includes(item.name.toLowerCase())) continue;
        seenInBatch.push(item.name.toLowerCase());
        out.push({
          name: item.name,
          description: `🌸 Prénom certifié d’origine ${item.origin} signifiant « ${item.meaning} ».`,
          style: resolved.label || targetStyle,
          icon: '👶',
          bestFor: resolved.bestFor || 'futurs enfants, fratries et faire-part',
          tone: resolved.tone || 'Harmonieux • intemporel • doux',
          generatorId: 'baby_name',
          pronunciation: generatePronunciation(item.name, genLanguage),
          strengths: ['Prénom authentique attesté', `Origine : ${item.origin}`],
          watchouts: ['Prononcez avec le nom de famille'],
          origin: `Origine certifiée : ${item.origin}`,
          meaning: item.meaning,
          isAttested: true,
          variants: item.variants,
          gender: item.gender,
        });
      }
    }

    if (out.length > 0) {
      recordRecentNames(out.map((x) => x.name));
      addGenerationHistory(out);
      return out;
    }

    // Never fall through to invented-name strategies for the baby-name category.
    // If every matching attested name is in recent history, return an honest empty
    // result rather than presenting a procedural invention as a real given name.
    return [];
  }

  // =========================================================================
  // CURATED PHRASES IN THE CHOSEN LANGUAGE (slogans, book titles, song titles)
  // =========================================================================
  const phraseBank = genLanguage !== 'auto' ? getPhraseBank(targetGenerator, genLanguage) : [];
  if (phraseBank.length > 0) {
    const kwLower = cleanKw.normalize('NFC').toLocaleLowerCase();
    const matching = cleanKw
      ? phraseBank.filter((p) => p.normalize('NFC').toLocaleLowerCase().includes(kwLower))
      : phraseBank;
    // Do not fall through to the source-language procedural vocabulary when a localized
    // phrase bank exists but the requested keyword has no matching phrase.
    if (cleanKw && matching.length === 0) return [];
    if (matching.length > 0) {
      const fresh = matching.filter((p) => !recentNames.some((r) => r.toLowerCase() === p.toLowerCase()));
      const shuffle = (list: string[]): string[] => {
        const copy = [...list];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(activeRandom() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      };
      // Phrases not seen recently come first; recent ones only top up the batch when needed.
      const pool = [
        ...shuffle(fresh),
        ...shuffle(matching.filter((p) => !fresh.includes(p))),
      ];
      for (const phrase of pool.slice(0, quantity)) {
        const phraseMeta = buildProfessionalMetadata(phrase, targetGenerator, resolved.label || targetStyle, length);
        out.push({
          name: phrase,
          description: (randomItem(resolved.descriptions) as string) || '',
          style: resolved.label || targetStyle,
          icon: resolved.icon || '✨',
          bestFor: resolved.bestFor || '',
          tone: resolved.tone || '',
          generatorId: targetGenerator,
          strengths: phraseMeta.strengths,
          watchouts: phraseMeta.watchouts,
          disclaimer: phraseMeta.disclaimer,
          origin: phraseMeta.origin,
        });
      }
      recordRecentNames(out.map((x) => x.name));
      addGenerationHistory(out);
      return out;
    }
  }

  // =========================================================================
  // STANDARD PROCEDURAL & LINGUISTIC PIPELINE
  // =========================================================================
  const strategies: GenerationStrategy[] = [
    'phonetic_harmony',
    'neologism',
    'portmanteau_blend',
    'symbolic_evocative',
    'punchy_minimal',
    'epic_compound',
  ];

  // Datasets made of real whole words (first names, surnames, star names, nouns) must never be
  // chopped into syllables: neologism / portmanteau / punchy strategies would produce gibberish.
  // When a generation language is chosen, names are built from that language's own roots, so the
  // generator's (French) phrase vocabulary must not decide how names are assembled.
  const explicitLanguageRules = genLanguage !== 'auto' ? LANGUAGE_PHONETICS[genLanguage] : undefined;
  // Sentence-like generators (slogans, titles) are meaningless when rebuilt from name roots.
  const isSentenceLikeGenerator = ['slogan', 'book', 'novel_series', 'song_title', 'album_title', 'blog_name', 'newsletter', 'podcast', 'tactical_operation', 'restaurant', 'coffee_shop', 'tavern', 'band_name', 'videogame', 'youtube', 'shop', 'guild', 'bakery', 'hotel_name'].includes(targetGenerator);
  // If a sentence-like category has no phrase bank for the selected generation mode,
  // return no suggestions rather than leaking French source phrases into another language.
  if (isSentenceLikeGenerator && genLanguage !== 'auto' && getPhraseBank(targetGenerator, genLanguage).length === 0) return [];
  const usesLanguageRoots =
    !isSentenceLikeGenerator && Boolean(explicitLanguageRules && explicitLanguageRules.prefixes.length > 0);
  const activePrefixes = explicitLanguageRules?.prefixes.length ? explicitLanguageRules.prefixes : resolved.prefixes;
  const activeSuffixes = explicitLanguageRules?.suffixes.length ? explicitLanguageRules.suffixes : resolved.suffixes;
  const activeTitleWords = genLanguage === 'auto'
    ? resolved.titles
    : (explicitLanguageRules?.titleWords || []).filter((word) => isScriptCompatibleText(word, genLanguage));
  const vocabulary = usesLanguageRoots
    ? [...explicitLanguageRules!.prefixes, ...explicitLanguageRules!.suffixes]
    : [...resolved.prefixes, ...resolved.suffixes];
  const wholeWordCount = vocabulary.filter(
    (w) => w.includes(' ') || (/^\p{Lu}/u.test(w) && Array.from(w).length >= 5)
  ).length;
  const averageVocabularyLength =
    vocabulary.reduce((sum, w) => sum + Array.from(w).length, 0) / Math.max(1, vocabulary.length);
  // Non-Latin scripts and scripts with combining marks (Bengali, Hindi, Thai, Cyrillic, Arabic, Hebrew, CJK…) cannot be
  // cut at arbitrary positions without breaking grapheme clusters, so their roots are always kept whole.
  const hasComplexScript = vocabulary.some((w) => /[\p{M}\p{Lo}]|[^\u0000-\u024F\u1E00-\u1EFF]/u.test(w));
  const isWholeWordVocabulary =
    vocabulary.length > 0 &&
    (hasComplexScript || wholeWordCount / vocabulary.length >= 0.5 || averageVocabularyLength >= 4.4);

  let candidatePool: ScoredCandidate[] = [];
  let attempts = 0;
  const maxAttempts = quantity * 150;

  while (candidatePool.length < quantity * 4 && attempts < maxAttempts) {
    attempts++;
    let strategy = strategies[attempts % strategies.length];
    if (
      isWholeWordVocabulary &&
      (strategy === 'neologism' || strategy === 'portmanteau_blend' || strategy === 'punchy_minimal')
    ) {
      strategy = 'phonetic_harmony';
    }
    let baseName = '';

    if (cleanKw) {
      const mode = activeRandom();
      const suf = randomItem(activeSuffixes) || '';
      const pref = randomItem(activePrefixes) || '';
      const titleW = randomItem(activeTitleWords) || '';
      const kwCap = cleanKw.charAt(0).toUpperCase() + cleanKw.slice(1);

      if (mode < 0.35 && suf) {
        baseName = combineParts(kwCap, suf);
      } else if (mode < 0.65 && pref) {
        baseName = combineParts(pref, kwCap);
      } else if (titleW && activeRandom() < 0.5) {
        baseName = combineParts(kwCap, titleW);
      } else {
        baseName = `${kwCap} ${suf || 'Tech'}`;
      }
    } else {
      const isPhrasal =
        !usesLanguageRoots &&
        (resolved.prefixes.some((p) => p.includes(' ') || p.length > 8) ||
        resolved.suffixes.some((s) => s.includes(' ') || s.length > 8));

      if (isPhrasal) {
        // Phrasal categories must preserve whole words without mutilating syllables
        const p = (randomItem(resolved.prefixes) as string) || 'Le';
        const s = (randomItem(resolved.suffixes) as string) || 'Monde';
        baseName = combineParts(p, s);
      } else {
        switch (strategy) {
          case 'phonetic_harmony':
            baseName = generatePhoneticHarmony(resolved, length, genLanguage);
            break;
          case 'neologism':
            baseName = generateNeologism(resolved, length, genLanguage);
            break;
          case 'portmanteau_blend':
            baseName = generatePortmanteauBlend(resolved, genLanguage);
            break;
          case 'symbolic_evocative':
            baseName = generateSymbolicEvocative(targetGenerator, resolved, genLanguage);
            break;
          case 'punchy_minimal':
            baseName = generatePunchyMinimal(resolved, genLanguage);
            break;
          case 'epic_compound': {
            const part1 = generatePhoneticHarmony(resolved, 'short', genLanguage);
            const part2 = generatePhoneticHarmony(resolved, 'short', genLanguage);
            if (part1.includes(' ') || part2.includes(' ')) {
              baseName = part1;
            } else {
              baseName = combineParts(part1, part2);
            }
            break;
          }
        }
      }
    }

    if (!baseName || baseName.length < 2) continue;

    // Apply Format
    let formattedName = baseName;
    if (format === 'full') {
      const surname = generatePhoneticHarmony(resolved, 'medium', genLanguage);
      if (surname.toLowerCase() !== baseName.toLowerCase()) {
        formattedName = combineParts(baseName, surname);
      }
    } else if (format === 'group') {
      const localizedGroups = genLanguage !== 'auto' ? GROUP_WORDS[genLanguage] : undefined;
      const defaultGroups = localizedGroups
        ? categoryFamily === 'business'
          ? localizedGroups.business
          : categoryFamily === 'innovation'
          ? localizedGroups.innovation
          : categoryFamily === 'fantasy'
          ? localizedGroups.fantasy
          : localizedGroups.other
        : categoryFamily === 'business'
          ? ['Atelier', 'Studio', 'Maison', 'Collectif', 'Groupe', 'Agence', 'Boutique']
          : categoryFamily === 'innovation'
          ? ['Lab', 'Engine', 'System', 'Network', 'Core', 'Project', 'Platform']
          : categoryFamily === 'fantasy'
          ? ['Ordre', 'Clan', 'Guilde', 'Cercle', 'Légion', 'Maison']
          : ['Collectif', 'Studio', 'Club', 'Troupe', 'Cercle', 'Équipe'];

      const groupPool = localizedGroups
        ? categoryFamily === 'business'
          ? localizedGroups.business
          : categoryFamily === 'innovation'
          ? localizedGroups.innovation
          : categoryFamily === 'fantasy'
          ? localizedGroups.fantasy
          : localizedGroups.other
        : genLanguage === 'auto' && resolved.groupTypes?.length
          ? resolved.groupTypes
          : defaultGroups;
      const g = (randomItem(groupPool) as string) || defaultGroups[0];
      formattedName = `${g} ${baseName}`;
    } else if (format === 'compound') {
      if (!baseName.includes(' ')) {
        const secondary = generatePunchyMinimal(resolved, genLanguage);
        formattedName = combineParts(baseName, secondary);
      }
    } else {
      // Explicit generation languages may only use title words verified for their writing system.
      if (activeTitleWords.length > 0 && activeRandom() < (isFantasyOrLore ? 0.22 : 0.28)) {
        const title = (randomItem(activeTitleWords) as string) || '';
        if (title) formattedName = combineParts(baseName, title);
      }
    }

    // Gender suffixes and prefixes in the style dataset are not translations.
    // Apply these legacy adaptations only in Auto mode; explicit languages need
    // language-specific morphology before gender inflection can be safely enabled.
    const canApplyLegacyGenderRules = genLanguage === 'auto';
    if (canApplyLegacyGenderRules && gender === 'female' && !formattedName.includes(' ')) {
      if (resolved.femaleStarts && resolved.femaleStarts.length > 0 && activeRandom() < 0.4) {
        const fPrefix = randomItem(resolved.femaleStarts);
        if (fPrefix) {
          formattedName = combineParts(fPrefix, formattedName.toLowerCase());
        }
      } else if (/(?:or|us|os|ik|ak)$/i.test(formattedName)) {
        const feminized = formattedName.replace(/(?:or|us|os|ik|ak)$/i, 'a');
        // Never let the gender rule reduce a name to a 2-3 letter stub.
        if (feminized.length >= 4) formattedName = feminized;
      } else if (!/[aeiouy]$/i.test(formattedName)) {
        formattedName = formattedName + 'a';
      }
    } else if (canApplyLegacyGenderRules && gender === 'male' && !formattedName.includes(' ')) {
      if (resolved.maleStarts && resolved.maleStarts.length > 0 && activeRandom() < 0.4) {
        const mPrefix = randomItem(resolved.maleStarts);
        if (mPrefix) {
          formattedName = combineParts(mPrefix, formattedName.toLowerCase());
        }
      } else if (/a$/i.test(formattedName) && formattedName.length > 4) {
        formattedName = formattedName.slice(0, -1) + 'an';
      }
    }

    const score = scoreCandidate(formattedName, length, gender);
    if (score >= 65) {
      candidatePool.push({ name: formattedName, score, strategy });
    }
  }

  // Sort candidate pool by quality score descending
  candidatePool.sort((a, b) => b.score - a.score);

  // Diverse Selection Phase (incorporating Levenshtein anti-similarity filter)
  const usedStrategies = new Set<GenerationStrategy>();

  for (const cand of candidatePool) {
    if (out.length >= quantity) break;

    // When keyword is requested, only accept candidates containing the keyword
    if (cleanKw && !cand.name.toLowerCase().includes(cleanKw.toLowerCase())) {
      continue;
    }

    // Check exact & similarity collision with current batch (keyword-aware)
    if (isTooSimilar(cand.name, seenInBatch, cleanKw)) {
      continue;
    }

    // Check recent history collision if possible
    if (recentNames.some((r) => r.toLowerCase() === cand.name.toLowerCase())) {
      continue;
    }

    seenInBatch.push(cand.name);
    usedStrategies.add(cand.strategy);

    const desc = (randomItem(resolved.descriptions) as string) ||
      '✨ Un nom exclusif façonné avec soin par la forge NameForge.';

    const meta = buildProfessionalMetadata(cand.name, targetGenerator, resolved.label || targetStyle, length);

    out.push({
      name: cand.name,
      description: desc,
      style: resolved.label || targetStyle,
      icon: resolved.icon || '✨',
      bestFor: resolved.bestFor || 'projets créatifs et professionnels',
      tone: resolved.tone || 'Distinctif • mémorable • percutant',
      generatorId: targetGenerator,
      pronunciation: generatePronunciation(cand.name, genLanguage),
      strengths: meta.strengths,
      watchouts: meta.watchouts,
      disclaimer: meta.disclaimer,
      origin: meta.origin,
      isAttested: targetGenerator === 'baby_name' ? true : undefined,
    });
  }

  // Graceful fallback to guarantee exactly the requested quantity
  if (out.length < quantity) {
    for (const cand of candidatePool) {
      if (out.length >= quantity) break;
      if (cleanKw && !cand.name.toLowerCase().includes(cleanKw.toLowerCase())) continue;
      if (seenInBatch.some((s) => s.toLowerCase() === cand.name.toLowerCase())) continue;

      seenInBatch.push(cand.name);
      const desc =
        (randomItem(resolved.descriptions) as string) ||
        '✨ Un nom exclusif façonné avec soin par la forge NameForge.';
      const meta = buildProfessionalMetadata(cand.name, targetGenerator, resolved.label || targetStyle, length);

      out.push({
        name: cand.name,
        description: desc,
        style: resolved.label || targetStyle,
        icon: resolved.icon || '✨',
        bestFor: resolved.bestFor || 'projets créatifs et professionnels',
        tone: resolved.tone || 'Distinctif • mémorable • percutant',
        generatorId: targetGenerator,
        pronunciation: generatePronunciation(cand.name, genLanguage),
        strengths: meta.strengths,
        watchouts: meta.watchouts,
        disclaimer: meta.disclaimer,
        origin: meta.origin,
      });
    }
  }

  // Final synthetic pass if candidate pool was exhausted
  let fallbackIndex = 0;
  while (out.length < quantity && fallbackIndex < 100) {
    fallbackIndex++;
    const kwCap = cleanKw ? cleanKw.charAt(0).toUpperCase() + cleanKw.slice(1) : '';
    let syntheticName: string;
    if (kwCap) {
      const suffixesPool = genLanguage === 'auto'
        ? ['Tech', 'Core', 'Labs', 'Prime', 'Craft', 'Solutions', 'Studio', 'Nova', 'Pro']
        : activeSuffixes;
      const altSuffix = randomItem(activeSuffixes) || randomItem(suffixesPool) || 'One';
      syntheticName = `${kwCap} ${altSuffix}`;
    } else {
      const p = randomItem(activePrefixes) || 'Nova';
      const s = randomItem(activeSuffixes) || 'is';
      syntheticName = combineParts(p, s);
    }

    if (!seenInBatch.some((item) => item.toLowerCase() === syntheticName.toLowerCase())) {
      seenInBatch.push(syntheticName);
      const desc =
        (randomItem(resolved.descriptions) as string) ||
        '✨ Un nom exclusif façonné avec soin par la forge NameForge.';
      const meta = buildProfessionalMetadata(syntheticName, targetGenerator, resolved.label || targetStyle, length);

      out.push({
        name: syntheticName,
        description: desc,
        style: resolved.label || targetStyle,
        icon: resolved.icon || '✨',
        bestFor: resolved.bestFor || 'projets créatifs et professionnels',
        tone: resolved.tone || 'Distinctif • mémorable • percutant',
        generatorId: targetGenerator,
        pronunciation: generatePronunciation(syntheticName, genLanguage),
        strengths: meta.strengths,
        watchouts: meta.watchouts,
        disclaimer: meta.disclaimer,
        origin: meta.origin,
      });
    }
  }

  // Update sliding window of recent names
  if (out.length > 0) {
    recordRecentNames(out.map((x) => x.name));
    addGenerationHistory(out);
  }

  return out;
}
