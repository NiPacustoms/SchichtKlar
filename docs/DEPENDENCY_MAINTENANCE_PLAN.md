# Dependency Maintenance Plan - JobFlow

**Erstellt:** $(date)  
**Zweck:** Plan zur Wartung und Aktualisierung von Dependencies

---

## 📋 Übersicht

Dieser Plan beschreibt die empfohlenen Schritte zur Wartung der Projekt-Dependencies.

---

## ✅ Aktueller Status

**Alle Dependencies sind installiert und funktionsfähig.**

- ✅ Root-Projekt: Alle 35 Dependencies installiert
- ✅ Functions-Projekt: Alle 8 Dependencies installiert
- ✅ Keine fehlenden Pakete
- ✅ Keine kritischen Sicherheitslücken (empfohlen: regelmäßige Prüfung)

---

## 🔧 Wartungsaufgaben

### 1. Regelmäßige Sicherheitsprüfung (Empfohlen: Monatlich)

**Zweck:** Identifikation und Behebung von Sicherheitslücken

**Schritte:**

```bash
# 1. Root-Projekt prüfen
cd <pfad-zum-repo>/JobFlow
npm audit

# 2. Automatische Fixes (wenn möglich)
npm audit fix

# 3. Manuelle Fixes (bei kritischen Lücken)
npm audit fix --force  # ⚠️ Vorsicht: Kann Breaking Changes verursachen

# 4. Functions-Projekt prüfen
cd functions
npm audit
npm audit fix
```

**Wann ausführen:**

- ✅ Vor jedem Release
- ✅ Monatlich als Wartungsaufgabe
- ✅ Bei Bekanntwerden von Sicherheitslücken

---

### 2. Dependency-Updates (Empfohlen: Quartalweise)

**Zweck:** Aktualisierung auf neuere Versionen (mit Vorsicht)

**Schritte:**

#### 2.1 Veraltete Pakete identifizieren

```bash
# Root-Projekt
cd <pfad-zum-repo>/JobFlow
npm outdated

# Functions-Projekt
cd functions
npm outdated
```

#### 2.2 Update-Strategie

**⚠️ WICHTIG:** Major Updates (z.B. React 18 → 19) erfordern umfangreiche Tests!

**Empfohlener Workflow:**

1. **Branch erstellen:**

   ```bash
   git checkout -b dependency-updates-$(date +%Y%m%d)
   ```

2. **Patch & Minor Updates (sicherer):**

   ```bash
   # Automatische Updates für Patch/Minor
   npm update
   ```

3. **Major Updates (vorsichtig):**

   ```bash
   # Einzelne Pakete manuell updaten
   npm install package-name@latest

   # Oder spezifische Version
   npm install package-name@x.y.z
   ```

4. **Tests ausführen:**

   ```bash
   npm run test
   npm run typecheck
   npm run lint
   npm run build
   ```

5. **Manuelle Tests:**
   - ✅ Development-Server starten
   - ✅ Kritische Features testen
   - ✅ UI-Komponenten prüfen

6. **Commit & Merge:**
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: update dependencies"
   git push origin dependency-updates-$(date +%Y%m%d)
   # Pull Request erstellen und reviewen
   ```

---

### 3. Bereinigung (Nur bei Problemen)

**Wann nötig:**

- ❌ Dependency-Konflikte
- ❌ Fehlerhafte Installationen
- ❌ Inkonsistente node_modules

**Schritte:**

```bash
# 1. Backup erstellen (optional)
cp package.json package.json.backup
cp package-lock.json package-lock.json.backup

# 2. Root-Projekt bereinigen
cd <pfad-zum-repo>/JobFlow
rm -rf node_modules package-lock.json
npm install

# 3. Functions-Projekt bereinigen
cd functions
rm -rf node_modules package-lock.json
npm install

# 4. Verifizieren
npm list --depth=0
npm run typecheck
npm run build
```

---

### 4. Dependency-Audit (Empfohlen: Vor jedem Release)

**Zweck:** Vollständige Analyse der Dependency-Struktur

**Schritte:**

```bash
# 1. Dependency-Tree analysieren
cd <pfad-zum-repo>/JobFlow
npm list --depth=0 > dependency-tree.txt

# 2. Unbenutzte Dependencies identifizieren
# (Manuell prüfen, welche Pakete tatsächlich verwendet werden)

# 3. Extraneous Packages prüfen
npm list --depth=0 | grep extraneous

# 4. Bundle-Größe analysieren (Next.js)
npm run build
# Prüfe .next/analyze/ für Bundle-Analyse
```

---

## 🚨 Wichtige Hinweise

### Major Updates - Breaking Changes

Die folgenden Pakete haben Major Updates verfügbar, die Breaking Changes enthalten können:

1. **React 18 → 19**
   - ⚠️ Breaking Changes in React 19
   - ⚠️ TypeScript-Typen müssen angepasst werden
   - ⚠️ Umfangreiche Tests erforderlich

2. **Next.js 15 → 16**
   - ⚠️ Neue Features und mögliche Breaking Changes
   - ⚠️ React 19 Kompatibilität prüfen

3. **@sentry/nextjs 8 → 10**
   - ⚠️ API-Änderungen möglich
   - ⚠️ Konfiguration prüfen

**Empfehlung:**

- ✅ Zuerst in separatem Branch testen
- ✅ Changelogs gründlich lesen
- ✅ Schrittweise vorgehen (nicht alle auf einmal)

---

## 📅 Wartungszeitplan

### Monatlich

- [ ] `npm audit` ausführen
- [ ] Sicherheitslücken beheben
- [ ] Dependency-Status dokumentieren

### Quartalweise

- [ ] `npm outdated` prüfen
- [ ] Patch/Minor Updates durchführen
- [ ] Major Updates evaluieren

### Vor jedem Release

- [ ] Vollständige Dependency-Prüfung
- [ ] Sicherheitsaudit
- [ ] Build-Tests
- [ ] Dokumentation aktualisieren

---

## 🔍 Monitoring

### Tools & Commands

```bash
# Dependency-Status
npm list --depth=0

# Veraltete Pakete
npm outdated

# Sicherheitsprüfung
npm audit

# Bundle-Analyse (Next.js)
ANALYZE=true npm run build

# Type-Checking
npm run typecheck

# Linting
npm run lint
```

---

## ✅ Checkliste: Dependency-Wartung

**Vor Updates:**

- [ ] Backup von package.json und package-lock.json
- [ ] Git-Branch erstellen
- [ ] Aktuelle Tests laufen lassen (Baseline)
- [ ] Changelogs der zu updatenden Pakete lesen

**Während Updates:**

- [ ] Schrittweise vorgehen (nicht alle auf einmal)
- [ ] Nach jedem Update Tests ausführen
- [ ] Build erfolgreich
- [ ] Type-Check erfolgreich

**Nach Updates:**

- [ ] Alle Tests bestehen
- [ ] Manuelle Tests durchführen
- [ ] Dokumentation aktualisieren
- [ ] Commit & Pull Request erstellen
- [ ] Code Review durchführen

---

## 📚 Ressourcen

- [npm Documentation](https://docs.npmjs.com/)
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Semantic Versioning](https://semver.org/)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19)
- [Next.js Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading)

---

**Plan erstellt:** $(date)  
**Nächste Prüfung empfohlen:** $(date -v+1m +%Y-%m-%d)
