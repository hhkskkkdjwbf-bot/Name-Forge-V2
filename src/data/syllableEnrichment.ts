import { SubcategoryData } from '../types';

/**
 * Extra phonetic building blocks for the character-name generators.
 *
 * The original datasets contained only 8–10 prefixes and suffixes per style, so the same few
 * roots (Kael-, Thar-, Val-, -dor, -mir) dominated every result. Each pool below adds roots from
 * distinct sound families so that generated names stay coherent with the style but vary widely.
 * Entries are merged (union, no duplicates) into the existing style data at load time.
 */
interface SyllablePool {
  prefixes: string[];
  suffixes: string[];
  middle?: string[];
}

const split = (value: string): string[] => value.split(/\s+/).filter(Boolean);

const POOLS: Record<string, SyllablePool | Record<string, SyllablePool>> = {
  fantasy: {
    prefixes: split('Aldren Bryn Cor Dar Eoth Fen Gwyn Hal Iol Jor Kor Lor Mar Nor Osric Per Quen Rhod Sig Tor Ulric Wyl Yor Bran Cade Dain Eryn Finn Hadr Leif Myr Thal Zel Aeth Orin Vyr'),
    suffixes: split('ald ard bryn dan eth fyr gan han ias ius kan las mund nar os rath sen tor ulf van win yn zar ell ric von dric wald ora ana dris ea ilen'),
    middle: split('a e o ar en el or il'),
  },
  elf: {
    prefixes: split('Aelin Calen Dae Eil Faen Gala Hael Ilia Jaen Leth Mael Nym Olo Pae Quel Rael Sael Tael Una Vaen Wyn Xael Amar Elen Silv Lor Thran Ithil Aran Cael'),
    suffixes: split('anor ariel dil eath iel ithil lorien ndil ond ral riel sael thir wen wyn las lian nor ael ean ia ira ethel ion'),
    middle: split('a e i ae ia el il al'),
  },
  dragon: {
    prefixes: split('Azur Balth Cinder Drax Embr Fyr Gorm Hyd Ign Jorm Kaur Lung Mord Nid Ob Pyr Rax Skar Tyr Ur Vyr Wyrm Xyl Zhar Ash Cryo Thun Magm Sulf Ouro'),
    suffixes: split('ax drax gorath gor hild ix kor maw nax oth rax scale thar thrax vyrn wing yss zar zor bane fang claw ion ath'),
    middle: split('a o u ar or ur'),
  },
  wizard: {
    prefixes: split('Alar Brom Cael Dorn Eld Fenn Gand Hadr Ioth Jask Kel Lorn Merl Nim Oswy Pell Quill Rad Sar Tarq Ulm Vor Xen Yvan Zab Alder Thal Mirr Ozym'),
    suffixes: split('agar alf bald dalf elin gast ibald imus ithus lin mir nal orin rius sul thos ulf vain wick zan zar and elas ius ond ys'),
    middle: split('a e o al el or is'),
  },
  vampire: {
    prefixes: split('Alar Bel Cass Drac Elis Fenr Gres Hel Iser Lest Mor Nos Oct Pers Raz Sang Tep Ur Vlad Zel Corv Dimitr Ilie Lil Sebast Vic Ambr Cris Morw Tib'),
    suffixes: split('ard ath ian ius mir nox oth ric san tan ula vane vel ysse etta elle ora ana ine ikos escu ov ev enne'),
    middle: split('a e i o an el or'),
  },
  rpg: {
    prefixes: split('Alden Brant Cass Doran Edric Fara Garr Holt Ilya Jory Kera Lysa Mavis Nolan Orla Pyra Quinn Rolf Sera Tamsin Ulla Vera Wren Yara Zane Roderic Elora Gideon Isolde Hadley'),
    suffixes: split('ard bert ric wyn den ell fred gar hart ley mond ner orn sa ton ven wald win ette ana ora iel ius ak'),
    middle: split('a e i o el en ar'),
  },
  'sci-fi': {
    prefixes: split('Aeon Bex Cyr Dax Eon Fyn Gal Hyp Ion Jex Kyr Lux Myx Nyx Orb Pax Qor Rex Syn Tau Uxo Vek Wex Xan Zor Zeph Orion Helio Astr'),
    suffixes: split('ar ax eon ex ion ix on or os um us yx ara ia ine ova tron vex zar nex xis ron dyne'),
    middle: split('a e o ar ax ex ion'),
  },
  anime: {
    prefixes: split('Aki Daichi Eiji Fumi Gin Haru Isamu Jun Kazu Ren Mako Naru Oka Rin Sora Tsuki Umi Yui Zen Hikaru Kuro Shiro Akane Mizu Raiden Taiga'),
    suffixes: split('ji ro ta ka ya mi ri ko ma na sa to shi zen maru hiko kichi nosuke rou ki no ra'),
    middle: split('a i o ka na ta'),
  },
  warrior: {
    knight: {
      prefixes: split('Aldr Bert Ced Dun Edm Godr Hub Lanc Osw Rand Rod Stef Thib Wal Gaw Gal Bors Ywain'),
      suffixes: split('ard ic mund ot ric win ald bert ley vain wick cival'),
    },
    barbarian: {
      prefixes: split('Grok Thrag Ukk Bruk Dorg Kragg Murg Rok Zug Gar Hrag Vokk Ulg Throk'),
      suffixes: split('ak ash gar gor nak rok tusk uk zug mar thog grim'),
    },
    samurai: {
      prefixes: split('Aki Dai Gen Hide Ichi Jin Kage Masa Nobu Rai Sada Taka Toshi Yori Yuki Haru Kiyo Mune'),
      suffixes: split('haru hiro kage masa mori nobu taka tomo yuki zane ro shi to mune nori'),
    },
    viking: {
      prefixes: split('Arn Bjorn Egil Finn Gunn Harald Ivar Knut Leif Magn Orm Ragn Sven Thor Ulf Yngv Sigurd Eir'),
      suffixes: split('bjorn gard grim helm ketil leif mund ulf rik sson valdr vik dis run hild'),
    },
  },
};

function mergeUnique(target: string[] | undefined, extra: string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of [...(target || []), ...(extra || [])]) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function isPool(value: SyllablePool | Record<string, SyllablePool>): value is SyllablePool {
  return Array.isArray((value as SyllablePool).prefixes);
}

export function enrichSubcategories(
  data: Record<string, Record<string, SubcategoryData>>
): Record<string, Record<string, SubcategoryData>> {
  for (const [generatorId, poolOrStyles] of Object.entries(POOLS)) {
    const styles = data[generatorId];
    if (!styles) continue;
    for (const [styleKey, style] of Object.entries(styles)) {
      const pool = isPool(poolOrStyles) ? poolOrStyles : poolOrStyles[styleKey];
      // Unknown styles of a per-style pool (e.g. warrior/default) get every pool of that generator.
      // A per-style pool set falls back to its two most "universal" cultures for unlisted styles
      // (e.g. warrior/default) instead of blending every culture into one name.
      const pools = pool
        ? [pool]
        : isPool(poolOrStyles)
        ? [poolOrStyles]
        : ['knight', 'viking'].map((k) => poolOrStyles[k]).filter(Boolean);
      for (const p of pools) {
        style.prefixes = mergeUnique(style.prefixes, p.prefixes);
        style.suffixes = mergeUnique(style.suffixes, p.suffixes);
        if (p.middle) style.middle = mergeUnique(style.middle, p.middle);
      }
    }
  }
  return data;
}
