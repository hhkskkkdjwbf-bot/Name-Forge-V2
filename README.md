# ⚡ NameForge — React Application

### Free Name Generators for Characters, Games, Stories & Fantasy Worlds

**NameForge** (28 interface languages, 234 generators) has been rewritten as a modern, high-performance **React + TypeScript + Vite + Tailwind CSS** application, preserving all original features, linguistic datasets, 21+ archetypes, and local storage bookmarks.

Whether you need the name of a legendary hero, a mysterious wizard, a powerful dragon, a fictional kingdom, or a gaming handle, NameForge provides instant creative inspiration.

---

## ✨ Features Ported & Preserved

### 🎭 234 specialized generators (the 11 flagship ones are listed first)
1. **Fantasy Name Generator** (`fantasy`) — Mythic heroes, ancient spellcasters, and worldbuilding legends.
2. **Anime Name Generator** (`anime`) — Shonen heroes, shinobi, demon lords, and magical warriors.
3. **RPG Name Generator** (`rpg`) — Frontline warriors, mages, stealth rogues, and holy paladins.
4. **Gaming Name Generator** (`gaming`) — Competitive FPS handles, streamer branding, and esports aliases.
5. **Dragon Name Generator** (`dragon`) — Fire wyrms, frost dragons, storm beasts, and ancient world-shapers.
6. **Elf Name Generator** (`elf`) — High elves, wood rangers, and dark drow houses.
7. **Kingdom Name Generator** (`kingdom`) — Imperial realms, northern holds, and enchanted dominions.
8. **Sci-Fi Name Generator** (`sci-fi`) — Star pilots, synthetic androids, alien species, and space commanders.
9. **Vampire Name Generator** (`vampire`) — Gothic nobles, night predators, and primordial ancients.
10. **Warrior Name Generator** (`warrior`) — Knights, barbarian berserkers, samurai, and viking raiders.
11. **Wizard Name Generator** (`wizard`) — Archmages, elemental mages, necromancers, and arcane scholars.

### 🧬 Linguistic DNA & 21 Archetypes
- **21 Distinct Styles**: Assassin de l'ombre, Guerrier héroïque, Haut-Né Elfe, Défenseur nain, Dragonkin, Berserker orc, Elfe noir, Seigneur Démon, Séraphin, Noble Vampire, Royaume fantastique, Taverne, Arme légendaire, Mage arcanique, Nécromancien, Samouraï, Rôdeur, Céleste, Pirate, Noble royal, Voleur des ombres.
- **Controls**: Length (Short, Medium, Long), Format (Single/Title, First & Last name, Clan/Realm/Guild), Gender (Any, Female, Male), and Quantity (6, 9, 12, 18).

### 🔖 My Names (Saved & Liked Dashboard)
- **Bookmark (Save)** & **Favorite (Like)** toggles on every name card.
- **5-Star Interactive Rating** for each candidate name.
- **Private Notes Modal** to record lore, character backstories, or campaign details.
- **Search & Filtering** by category, saved status, liked status, and text query.
- **Export to TXT** and one-click copy to clipboard.
- **Storage Statistics**: Total tracked, saved, liked, with notes, and active generators.
- Compatible with existing `nameforge_saved_names` localStorage format.

---

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Storage**: Browser LocalStorage (`nameforge_saved_names`)

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install

# Start Vite development server on port 3000
npm run dev

# Build for production
npm run build
```

---

## 📄 License

MIT License. Free for personal, commercial, and creative projects.

## Localization & quality architecture (added)

- `src/data/phraseBanks.ts` — curated, native phrase banks (19 generators × 25 languages) for sentence-like or venue-style generators (slogans, titles, restaurants, taverns, band names…). Used when a generation language is selected.
- `src/i18n/attestedNameTranslations.ts` — meanings and origins of the attested baby names in 24 languages.
- `src/data/syllableEnrichment.ts` — extra syllable families for the fantasy-style generators (merged into the base datasets at load time).
- `scripts/generate-seo-pages.ts` — generates static landing pages for every generator in all 25 languages (`/seo/<lang>/generators/<id>/`, English keeps `/seo/generators/<id>/`), with hreflang alternates, canonical URLs and a sitemap with `lastmod`.
- `src/tests/regressionQuality.ts` — scans every generator/style for grammar and assembly defects and checks translation coverage. Run with `npm test`.

Engine rules worth knowing: vocabularies made of whole words are never chopped into syllables; roman numerals and all-caps tags (`USS`, `III`) are preserved; French article/preposition contractions (`de la l’…`) are merged automatically.

## Documentation

| Topic | File |
|-------|------|
| Architecture overview | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Generators and the naming engine | [docs/GENERATORS.md](docs/GENERATORS.md) |
| Internationalization (28 languages) | [docs/I18N.md](docs/I18N.md) |
| Accessibility and contrast | [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) |
| SEO and static pages | [docs/SEO.md](docs/SEO.md) |
| Tests and QA | [docs/TESTING.md](docs/TESTING.md) |
| Deployment | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Audit report and known limits | [docs/AUDIT.md](docs/AUDIT.md) |
| Changelog | [docs/CHANGELOG.md](docs/CHANGELOG.md) |

## License

No `LICENSE` file is present in this archive, so no license is declared here. Add one before accepting contributions or
redistributing the project.
