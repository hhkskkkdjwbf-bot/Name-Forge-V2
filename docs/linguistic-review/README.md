# Registre de relecture linguistique — Name Forge V2

## Objectif

Ce registre suit la relecture humaine des formulations présentes dans `src/data/phraseBanks.ts`, individuellement, par langue et par catégorie. Il ne certifie ni la qualité linguistique globale d'une langue, ni la disponibilité juridique d'un nom.

**État initial : toutes les lignes sont `unverified` (non vérifiées).** La présence d'une traduction, un score Python, un audit de script ou une génération réussie ne constitue jamais une validation linguistique.

## Fichiers

- `phrase-review.csv` : une ligne par formulation, importable dans Excel, LibreOffice ou Google Sheets.
- `README.md` : méthode et critères de relecture.
- `../scripts/linguistic-review-registry.py` : génération/contrôle du registre depuis les banques de phrases.

## Statuts autorisés

| Statut | Signification |
|---|---|
| `unverified` | Non examinée par un relecteur |
| `in_review` | Relecture en cours |
| `needs_revision` | Correction nécessaire avant nouvelle vérification |
| `validated` | Validée après examen humain par un locuteur natif et attestation renseignée |
| `rejected` | À retirer du corpus actif |

Ne passez une ligne à `validated` qu'après vérification effective par un locuteur natif de la langue et de la variété indiquée. Le nom/identifiant du relecteur, son niveau, la variété ou région, la date et l'attestation doivent être remplis. Ces champs constituent une trace déclarative ; ils ne remplacent pas la vérification éditoriale de l'identité et de la compétence du relecteur.

## Critères à examiner pour chaque formulation

1. Grammaire, orthographe, ponctuation et accents.
2. Naturel : la phrase est-elle réellement employée par des locuteurs, sans traduction littérale maladroite ?
3. Sens et intention : le message correspond-il à la catégorie et au contexte d'utilisation ?
4. Registre : ton, politesse, formalité, genre et niveau de langue adaptés.
5. Culture et pragmatique : connotations, références, ambiguïtés ou associations indésirables.
6. Variété : variante régionale/dialectale adaptée et cohérente avec la cible.
7. Inclusivité et sécurité : éviter les formulations involontairement offensantes ou excluantes.

Un relecteur peut proposer une correction dans `decision_notes`. Ne remplacez pas silencieusement le texte source : faites d'abord approuver la correction, puis synchronisez la banque de phrases et régénérez le registre en conservant les métadonnées existantes.

## Colonnes du CSV

- `phrase_id` : identifiant stable calculé à partir de la catégorie, de la langue et du texte.
- `locale` : code de langue.
- `category` : catégorie du générateur.
- `phrase` : formulation exacte extraite du code source.
- `status` : statut parmi les cinq valeurs ci-dessus.
- `reviewer_name_or_id` : nom ou identifiant interne du relecteur.
- `reviewer_level` : doit être `native` pour le statut `validated`.
- `variety_or_region` : variété/région réellement examinée (ex. français de France, arabe standard moderne, etc.).
- `reviewed_on` : date ISO `YYYY-MM-DD`.
- `decision_notes` : justification, problèmes, proposition de correction.
- `reviewer_attestation` : saisir `yes` après confirmation explicite du relecteur qu'il est locuteur natif de cette langue/variété.

## Commandes

Depuis la racine du dépôt :

```bash
python scripts/linguistic-review-registry.py --check
python scripts/linguistic-review-registry.py --write
```

`--write` ajoute les formulations nouvelles en statut `unverified`, conserve les métadonnées des identifiants inchangés et retire les lignes qui ne sont plus dans les banques. Examinez le diff avant de committer. `--check` vérifie la synchronisation, les statuts et les champs obligatoires des lignes validées.

## Règle de communication

Ne publiez jamais un pourcentage de « langues validées » à partir de la seule couverture technique des banques. Les statistiques de suivi doivent compter les formulations réellement validées et afficher le dénominateur (phrases totales) par langue et catégorie. Une langue n'est pas « validée » en bloc parce que quelques phrases ont été relues.
