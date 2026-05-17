# Scripts de session — Steedy Dev

Automation PowerShell pour synchroniser le projet `piecestrottinettes.fr` entre deux postes Windows (fixe + portable) sans jamais casser le flux Lovable.

Le code source vit sur GitHub (`origin/main`). Lovable y pousse en continu via son éditeur visuel. Ces scripts garantissent que chaque session démarre par un `git pull` et finit par un `git push`, **sans jamais `--force`**.

---

## Installation (une seule fois par poste)

```powershell
cd C:\Users\nolan\Documents\piecestrottinettes.fr\scripts\session
.\install-shortcuts.ps1
```

Ce script :
- Ajoute 4 fonctions globales à ton profil PowerShell (`$PROFILE`)
- Crée une icône **Steedy Dev** sur le bureau qui lance `start-trott` directement
- Est idempotent : tu peux le relancer sans rien casser

Après installation, redémarre PowerShell **ou** tape `. $PROFILE` pour activer les commandes immédiatement.

---

## Les 4 commandes

| Commande | Quand l'utiliser |
|----------|------------------|
| `start-trott` | **Début de session.** Pull les derniers commits (toi sur l'autre ordi ou Lovable) puis lance Claude Code. |
| `start-trott-full` | Pareil + ouvre Vite (`npm run dev`) dans une seconde fenêtre. À utiliser quand tu vas tester en navigateur. |
| `end-trott "message"` | **Fin de session.** Commit + push vers `origin/main`. Demande confirmation. |
| `sync-trott` | Synchro rapide en cours de session si tu sais que Lovable vient de pousser. Ne lance rien d'autre. |

---

## Workflow type

### Matin sur le portable

```powershell
start-trott
```

Le script vérifie le repo, compare avec `origin/main`, te montre les derniers commits Lovable ou ceux du fixe, fait un `git pull --rebase`, puis lance Claude Code.

### Pendant la session

Tu codes normalement. Si tu as un message Lovable qui te dit qu'il vient de pousser :

```powershell
sync-trott
```

### Soir, avant de partir

```powershell
end-trott "ajout filtre prix sur catalogue"
```

Le script te montre le `git diff --stat`, demande confirmation, puis commit + push. Tu peux aussi taper juste `end-trott` sans argument : il te demandera le message en interactif.

### Lendemain sur le fixe

```powershell
start-trott
```

Tout ton boulot du portable est récupéré automatiquement.

---

## Résolution de conflits git

Si `start-trott` ou `sync-trott` t'affiche `[ERREUR] git pull --rebase a echoue (conflit ?)`, c'est qu'il y a un conflit entre tes modifs locales et celles d'`origin/main` (toi sur l'autre ordi, ou Lovable).

### Étapes

1. Ouvre les fichiers en conflit. Cherche les marqueurs :
   ```
   <<<<<<< HEAD
   ta version
   =======
   version d'origin/main
   >>>>>>> origin/main
   ```
2. Choisis la bonne version (ou fais un mix), supprime les marqueurs `<<<<<<<`, `=======`, `>>>>>>>`.
3. Stage les fichiers résolus :
   ```powershell
   git add <fichier>
   git rebase --continue
   ```
4. Si tu veux **abandonner** le rebase et revenir à l'état d'avant :
   ```powershell
   git rebase --abort
   ```
5. Relance `start-trott`.

### En cas de doute

**N'écrase jamais le travail distant.** Demande à Claude Code de t'aider :

```
J'ai un conflit git sur ce fichier : [colle le contenu]
Aide-moi à résoudre.
```

---

## Pourquoi jamais `git push --force`

Lovable pousse en continu sur `origin/main` via son éditeur visuel. Si tu fais `git push --force` :

- Tu **écrases** les commits que Lovable a poussés entre-temps
- Lovable perd la synchro avec son éditeur visuel — son interface se désynchronise
- Tu peux **perdre du code** créé via Lovable (potentiellement plusieurs heures de boulot)

Les scripts ici n'utilisent **que** `git push` (sans flag). Si le push est rejeté, c'est qu'un commit existe sur `origin/main` qui n'est pas chez toi. Le bon réflexe :

```powershell
sync-trott       # récupère ce qui manque
end-trott "msg"  # retente (sans nouveau commit puisqu'il a déjà été créé)
```

Si `end-trott` te dit que tout est déjà commité, tape juste :

```powershell
git push
```

---

## Désinstallation

1. Ouvre ton profil PowerShell : `notepad $PROFILE`
2. Supprime le bloc entre les marqueurs :
   ```
   # === Steedy Dev - piecestrottinettes.fr ===
   ...
   # === Fin Steedy Dev ===
   ```
3. Supprime l'icône **Steedy Dev** sur le bureau.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| `start-trott : terme non reconnu` | Tape `. $PROFILE` ou redémarre PowerShell. |
| `claude : terme non reconnu` | Claude Code n'est pas dans le PATH. Installe-le ou relance après installation. |
| `npm : terme non reconnu` (sur `start-trott-full`) | Node.js n'est pas dans le PATH. |
| Le script ne s'exécute pas (`execution policy`) | Lance une fois : `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| Caractères bizarres dans la sortie | Vérifie que la console est en UTF-8 : `chcp 65001` |
