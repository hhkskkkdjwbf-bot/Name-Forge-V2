# Recrutement et organisation des relecteurs natifs

## Objectif et état réel

Cette campagne démarre avec quatre parcours distincts : arabe standard moderne (`ar-MSA`), darija algérienne (`ar-DZ`), français (`fr`) et anglais (`en`). Les parcours arabes ne sont jamais fusionnés : une validation MSA ne vaut pas validation en darija, et inversement.

Aucun relecteur n'est actuellement déclaré ni affecté. La création des lots ne constitue pas une validation linguistique.

## Parcours arabes séparés

- **Arabe standard moderne (`ar-MSA`)** : le lot pilote existant, composé des phrases arabes actuelles du registre (`locale=ar`), est destiné à une relecture en arabe standard moderne. Les identifiants de phrases restent ceux du registre source. Le fichier de travail est `pilot-ar-MSA.csv`.
- **Darija algérienne (`ar-DZ`)** : le corpus source ne contient actuellement aucune phrase explicitement rédigée et identifiée comme darija. Le fichier `pilot-ar-DZ.csv` est donc un modèle vide, et les 19 affectations sont bloquées jusqu'à la création d'un corpus darija distinct. **Ne pas recopier les phrases MSA dans ce lot, ni transformer une validation MSA en validation darija.**

Le code de langue source `ar` ne distingue pas actuellement ces deux variétés. Les identifiants `ar-MSA` et `ar-DZ` sont des identifiants de campagne, pas encore une affirmation que le moteur du site prend en charge deux catalogues distincts.

## Priorités française et anglaise

- **Français (`fr`)** : le relecteur précise la variété/région (usage algérien, français de France ou autre variété francophone).
- **Anglais (`en`)** : le relecteur précise la variété (US, UK ou autre).

## Lots pilotes

Les lots français et anglais contiennent jusqu'à 10 phrases par catégorie. Le lot MSA contient les phrases arabes existantes sélectionnées pour le pilote. Le lot darija reste vide tant que des phrases originales de darija algérienne n'ont pas été produites et ajoutées au corpus avec une traçabilité propre.

## Fichiers de suivi

- `reviewer-candidates.csv` : modèle vide de candidature, sans personne inventée.
- `assignments.csv` : 76 unités langue/catégorie (19 par parcours). Les lignes `ar-DZ` sont `blocked_corpus_missing`.
- `pilot-ar-MSA.csv`, `pilot-ar-DZ.csv`, `pilot-fr.csv`, `pilot-en.csv` : lots phrase par phrase ou modèle de lot vide.
- `../phrase-review.csv` : registre maître. Ne pas modifier les statuts sans décision humaine et contrôle éditorial.

## Recrutement et sélection

Avant toute affectation :
1. Confirmer que la personne est locutrice native de la langue et de la variété ciblées.
2. Pour le parcours MSA, vérifier une excellente maîtrise de l'arabe standard moderne écrit.
3. Pour le parcours darija, rechercher une personne ayant grandi avec la darija algérienne ou l'utilisant comme variété native, et préciser sa région/variété (les usages peuvent varier entre régions).
4. Demander l'expérience pertinente, des exemples de travail ou références lorsque possible.
5. Déclarer tout conflit d'intérêts et obtenir l'accord sur les consignes.
6. Pour les slogans, noms commerciaux, titres et formulations ambiguës, privilégier deux lectures indépendantes.

Le formulaire d'attestation est une déclaration, pas une vérification automatique de l'identité ou des compétences. Le responsable éditorial reste chargé de la sélection.

## Décision phrase par phrase

Pour chaque phrase, choisir `approve`, `revise`, `reject` ou `needs_context`. Évaluer le sens, la grammaire, l'orthographe, le naturel idiomatique, le registre, l'adéquation à la catégorie et les connotations culturelles. Une phrase grammaticalement possible n'est pas nécessairement naturelle.

Une approbation pilote reste une recommandation. Elle ne devient `validated` dans le registre maître qu'après contrôle éditorial et renseignement des preuves requises (identifiant du relecteur, niveau natif, variété, date et attestation). Les corrections sont intégrées au corpus source séparément puis resynchronisées.

## Confidentialité et publication

Ne jamais placer d'adresses e-mail, numéros de téléphone ou autres coordonnées personnelles dans les CSV publics. Utiliser un identifiant de relecteur dans le dépôt et conserver les coordonnées dans un espace privé avec consentement. Ne publier aucun nom complet sans autorisation explicite.

## État initial

- 0 relecteur recruté ou vérifié.
- 0 phrase validée par une personne.
- 19 affectations MSA non attribuées.
- 19 affectations darija bloquées faute de corpus spécifique.
- 19 affectations françaises et 19 anglaises non attribuées.
