# Recrutement et organisation des relecteurs natifs

## Objectif et limites

Ce dossier organise une première campagne de relecture humaine pour l'arabe (`ar`), le français (`fr`) et l'anglais (`en`). Aucun relecteur n'est actuellement déclaré ni affecté dans les fichiers de suivi. **Aucune phrase n'est validée par la création de ces lots.**

La relecture est phrase par phrase. Une langue ne reçoit pas un label global de qualité à partir d'un échantillon.

## Pourquoi ces trois langues en premier ?

- **Arabe (`ar`)** : langue principale de l'expérience destinée au public algérien et à une partie du public arabophone. La variété doit être clarifiée : arabe standard moderne pour les formulations génériques, ou arabe algérien/darija si le produit souhaite réellement une tonalité locale. Ne pas mélanger les deux sans étiquetage.
- **Français (`fr`)** : important pour le public algérien francophone et les usages internationaux. Le relecteur doit indiquer la variété qu'il maîtrise (par exemple usage algérien, français de France, autre variété francophone) et signaler les différences pertinentes.
- **Anglais (`en`)** : utile pour le public international. Le relecteur doit préciser la variété (par exemple US, UK, autre) et signaler les formulations artificielles ou trop littérales.

Ces choix sont une priorité de démarrage, pas une affirmation que les autres langues sont de moindre valeur.

## Lots pilotes

Les fichiers `pilot-ar.csv`, `pilot-fr.csv` et `pilot-en.csv` contiennent jusqu'à 10 phrases par catégorie, soit un premier lot de contrôle par langue. Le registre principal contient le corpus complet. Après validation du processus et de la charge de travail, les lots complets pourront être répartis par catégorie.

## Fichiers de suivi

- `reviewer-candidates.csv` : fiche vide pour recueillir les candidatures. Ne contient aucune personne inventée.
- `assignments.csv` : 57 unités langue/catégorie pour les trois langues prioritaires. Tous les statuts commencent à `unassigned`.
- `pilot-ar.csv`, `pilot-fr.csv`, `pilot-en.csv` : lots pilotes phrase par phrase.
- `../phrase-review.csv` : registre maître ; ne pas remplacer ses statuts avant décision finale et contrôle.

## Sélection d'un relecteur

Avant toute affectation :
1. Confirmer que la personne est locutrice native de la langue et de la variété ciblées.
2. Lui demander d'indiquer précisément sa variété/région et son expérience pertinente.
3. Vérifier, lorsque possible, des exemples de travail ou références pertinentes.
4. Déclarer tout conflit d'intérêts.
5. Obtenir son accord sur les consignes, la confidentialité éventuelle et le traitement des propositions.
6. Pour les catégories à forte visibilité (slogans, noms commerciaux, marques, titres), privilégier une deuxième lecture indépendante avant publication.

Le champ d'attestation est une déclaration du relecteur, pas une vérification automatique de son identité ou de ses compétences. Le responsable éditorial conserve la responsabilité de la sélection.

## Décision phrase par phrase

Pour chaque ligne du lot, le relecteur choisit :
- `approve` : formulation naturelle et adaptée à la variété/catégorie.
- `revise` : sens compréhensible mais formulation à corriger ; proposer une version.
- `reject` : formulation incorrecte, inadaptée, ambiguë ou culturellement problématique.
- `needs_context` : impossible de juger sans contexte supplémentaire.

Le relecteur vérifie grammaire, orthographe, naturel idiomatique, sens, registre, adéquation à la catégorie, connotations culturelles, inclusivité et variété linguistique. Il ne doit pas approuver une phrase simplement parce qu'elle est grammaticalement possible.

Les réponses des lots pilotes sont des recommandations. Le responsable doit rapprocher les résultats des `phrase_id` dans le registre maître. Une approbation ne devient `validated` qu'après contrôle éditorial, attestation native renseignée, variété précisée, date et décision enregistrées. Les corrections proposées doivent être intégrées au code source séparément, puis resynchronisées.

## Contrôle qualité et double lecture

- Faire relire indépendamment par deux personnes les formulations commerciales, slogans, noms de marque et phrases ambiguës.
- En cas de désaccord, garder la phrase en attente et demander un arbitrage éditorial à un troisième spécialiste natif.
- Ne jamais compter `pending`, `needs_context` ou `revise` comme validés.
- Conserver les formulations rejetées ou retirées dans l'historique ; ne pas effacer silencieusement les décisions.
- Publier les résultats avec des nombres exacts par langue et catégorie : validées / total, et non un score général non justifié.

## Protection des données

Ne mettez pas de coordonnées personnelles dans les CSV publics du dépôt. Gardez les coordonnées de contact dans un espace privé et partagez dans le dépôt uniquement un identifiant de relecteur et les informations nécessaires à la traçabilité. Ne publiez pas les noms complets sans consentement explicite.

## État initial

Au moment de la création de cette campagne, les 57 affectations sont non attribuées et les lots pilotes sont en attente. Aucun locuteur natif n'a été recruté ou vérifié par ce dépôt.
