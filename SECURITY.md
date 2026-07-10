# Sicherheit – Schichtklar

## Git & Secrets (Best Practice)

### Was wir umsetzen

- **Keine Secrets im Repository**  
  API Keys, Passwörter, Tokens und Service-Account-Dateien gehören **nicht** in Git. Sie stehen in `.env`, `.env.local`, `.env.e2e` o. Ä. – diese Dateien sind in `.gitignore`.

- **Nur Platzhalter committen**  
  Erlaubt sind z. B. `.env.example` und `.env.e2e.example` mit Werten wie `your_api_key_here` oder `your_password`. Echte Werte nur lokal/CI setzen.

- **Pre-Commit Secret-Scan (Gitleaks)**  
  Vor jedem Commit prüft ein Hook, ob gestagte Dateien bekannte Secret-Muster enthalten. Wenn **Gitleaks** installiert ist (`brew install gitleaks`), blockiert der Hook den Commit bei Fund. Ohne Gitleaks wird nur ein Hinweis ausgegeben.

- **Manueller Scan**  
  `npm run secret-scan` (bzw. `bash scripts/secret-scan.sh`) – sinnvoll vor Push oder in CI.

### Wenn ein Secret versehentlich committet wurde

1. **Sofort rotieren**  
   Betroffenen Key/Token/Passwort in der jeweiligen Plattform (Firebase, Google Cloud, etc.) widerrufen oder neu erzeugen.

2. **Aus der Historie entfernen**  
   Mit `git filter-repo` oder `git filter-branch` den Wert aus der Historie löschen (Vorsicht: Rewrite, Abstimmung im Team nötig). Alternativ: neues Repo ohne Historie und Keys überall rotieren.

3. **Nie nur den Key aus der letzten Version löschen**  
   Alte Commits bleiben in der Historie und in Forks/Clones sichtbar.

### Empfohlene Tools

- **Gitleaks** – Secret-Scanning: [github.com/gitleaks/gitleaks](https://github.com/gitleaks/gitleaks)  
  Install: `brew install gitleaks`
- **Git** – Signed commits (optional): `git config commit.gpgsign true` + GPG-Key

### Branch-Protection (GitHub/GitLab)

- `main` schützen: Mindestens 1 Review, Status-Checks (z. B. CI inkl. Secret-Scan), keine Force-Pushes.
- Optional: „Require signed commits“ aktivieren.

### Historie-Bereinigung (durchgeführt)

Die Git-Historie wurde mit `git filter-repo` bereinigt:

- **`.env.e2e`** wurde aus der gesamten Historie entfernt (Datei existiert in keinem Commit mehr).
- **Firebase-Konfiguration** in alten Commits (`src/config/firebase.ts`): API Key, Projekt-ID, App-ID etc. wurden durch Platzhalter `__REDACTED__` ersetzt.

**Wichtig nach der Bereinigung:** Die Historie wurde umgeschrieben (neue Commit-Hashes). Damit die bereinigte Historie für alle gilt, muss **einmalig** ein Force-Push erfolgen:

```bash
git push origin main --force
```

Alle, die das Repo bereits geklont haben, sollten danach neu klonen oder `git fetch origin && git reset --hard origin/main` ausführen. Andere Branches (z. B. `fix/hosting-build`) müssen ggf. neu aufgesetzt oder mit der neuen `main` rebased werden.

---

*Bei Sicherheitsvorfällen: Verantwortliche Person bzw. Team intern kontaktieren.*
