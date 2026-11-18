# Tri des idées par Claude

Procédure à donner à Claude (dans une session avec le connecteur Google Sheets), par ex. :
« Trie mes nouvelles idées selon TRIAGE.md dans le dépôt Claude-Reminders. »

1. Lire la feuille **Idées** et ne garder que les lignes de statut `nouveau` ou `modifié`.
2. Lire la feuille **Projets** pour trouver le dépôt de chaque projet (comparaison sans casse ni accents).
3. Pour chaque dépôt concerné : ajouter les idées dans `IDEAS.md` à la racine, sous un titre par date,
   sur une branche `claude/idees-AAAA-MM-JJ`, puis ouvrir une pull request. Ne jamais pousser sur `main` sans accord.
   Le format d'une ligne : `- [ ] idée (reçue le JJ/MM)`.
4. Projet inconnu ou vide : statut `à classer`, et demander à l'utilisateur dans quel dépôt les mettre.
5. Une fois la PR ouverte, passer le statut à `traité` et renseigner la colonne **dépôt** avec le lien de la PR.
6. Résumer : combien d'idées par projet, lesquelles sont à classer.

Règles : un dépôt sans accès en écriture est signalé, pas contourné ; ne jamais copier de secret dans une idée.
