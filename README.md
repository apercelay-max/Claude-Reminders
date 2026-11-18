# Idées Claude

Petite PWA pour noter ses idées de projets Claude en déplacement.
Aucune dépendance, aucun build : HTML + CSS + JS.

- Capture rapide (projet + texte), dictée vocale si le navigateur la gère
- Filtre par projet, recherche, marquer « fait », modifier, supprimer
- Fonctionne hors ligne, installable sur l'écran d'accueil
- Données stockées sur l'appareil (localStorage) ; export/import JSON et copie Markdown
- **Mode voiture** : un gros bouton, un appui pour parler, l'idée est transcrite et déposée (annulation possible 8 s)
- Synchro optionnelle vers une feuille Google puis tri par Claude dans vos dépôts : voir `sync/README.md` et `TRIAGE.md`

## Essayer en local

    python3 -m http.server 8000   # puis ouvrir http://localhost:8000

## Mettre en ligne (GitHub Pages)

Réglages du dépôt → Pages → Source : branche `main`, dossier `/ (root)`.
Ouvrir l'URL sur le téléphone, puis « Ajouter à l'écran d'accueil ».

Notes : les données sont propres à chaque appareil/navigateur (pas de synchronisation) ;
si vous changez les fichiers, incrémentez `CACHE` dans `sw.js`.

## Mode voiture

Bouton « 🚗 Mode voiture » en haut de l'appli, ou raccourci par appui long sur l'icône (Android), ou l'adresse `?mode=voiture`.

1. Un appui, puis dites : **« projet », le nom du projet, « idée », votre idée**.
   Exemple : « projet Claude reminders, idée, ajouter une notification le dimanche ».
2. Le nom est rapproché de vos projets existants (accents, casse, petites fautes ou nom partiel tolérés).
   S'il ne correspond à aucun, un **nouveau projet** est créé et annoncé (« nouveau projet »).
3. Si vous faites une pause (après le nom, ou après « idée »), l'écoute repart toute seule.
4. Sans le mot « projet » en début de phrase, toute la phrase est enregistrée dans le projet choisi en haut de l'écran
   (le dernier utilisé par défaut).
5. L'idée est enregistrée, « Enregistré dans <projet> » est prononcé (désactivable) et un bouton **Annuler** reste actif
   8 secondes. L'envoi vers la feuille Google n'a lieu qu'après ce délai.

Limites : la dictée utilise le service de reconnaissance du navigateur, donc **elle demande une connexion internet**.
Sur iPhone, elle peut ne pas fonctionner dans l'appli installée sur l'écran d'accueil ; ouvrez alors l'adresse dans Safari.
À utiliser à l'arrêt ou avec un système mains libres, jamais en manipulant le téléphone en conduisant.
