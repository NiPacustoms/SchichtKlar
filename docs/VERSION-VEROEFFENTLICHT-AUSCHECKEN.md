# Genau die veröffentlichte Web-App-Version im Git auschecken

So bekommst du **exakt den Git-Stand**, der als Web-App auf Firebase Hosting läuft.

---

## Methode 1: Script (lokal mit GitHub-Zugriff)

Im Projektroot im Terminal:

```bash
# Nur Commit-SHA anzeigen
npm run git:deployed-commit

# SHA anzeigen und sofort auf diesen Commit wechseln
GITHUB_TOKEN=dein_token npm run git:checkout-deployed
```

**Hinweis:** Bei privatem Repo oder Rate-Limit `GITHUB_TOKEN` setzen (GitHub → Settings → Developer settings → Personal access tokens, Mindest-Scope: `repo` oder `public_repo`).

Nach `git:checkout-deployed` bist du auf dem Commit, der zuletzt erfolgreich auf **main** deployed wurde (= die aktuelle Web-App-Version).

---

## Methode 2: Manuell über GitHub Actions

1. **GitHub öffnen:** https://github.com/NiPacustoms/JobFlow/actions  
2. Links den Workflow **„Deploy to Firebase Hosting“** wählen.  
3. Den **letzten grünen (erfolgreichen) Run** finden, der von **main** getriggert wurde.  
4. Run anklicken – **oben** steht der Commit (z. B. `227f109` oder volle SHA).  
5. **Lokal ausführen:**

   ```bash
   git fetch origin
   git checkout <SHA>
   ```

   Beispiel: `git checkout 227f109`

Damit hast du exakt den Stand, der als Web-App veröffentlicht ist.

---

## Danach

- Du bist im **detached HEAD** auf diesem Commit.  
- Um darauf weiterzuarbeiten: `git checkout -b fix/mein-branch`  
- Um wieder auf den neuesten **main** zu gehen: `git checkout main`
