# Pull Request

## Beschreibung

<!-- Beschreibe kurz, was dieser PR ändert -->

## Design-System-Checkliste

<!-- Bitte alle zutreffenden Punkte abhaken -->

### Framework & Architektur

- [ ] Es werden ausschließlich MUI-Komponenten verwendet (`@mui/material`, `@mui/x-*`)
- [ ] Keine neuen Tailwind-Klassen (`className="..."`) hinzugefügt
- [ ] Seite nutzt `AppLayout` als äußere Hülle (falls zutreffend)
- [ ] Seite nutzt `PageHeader` für Titel/Aktionen (falls zutreffend)

### Farben & Theme-Tokens

- [ ] Keine rohen Hex-/RGBA-Farben (`#...`, `rgb(...)`, `rgba(...)`) in Komponenten
- [ ] Farben verwenden `theme.palette.*` oder `THEME_CONSTANTS`
- [ ] Statusfarben nutzen `theme.palette.success|warning|info|error`

### Typografie & Abstände

- [ ] Typografie nutzt `Typography`-Varianten (`h1-h6`, `body1/2`, `button`, `caption`)
- [ ] Abstände sind Vielfache von `theme.spacing(1)` (8px-Grid)

### Layout-Pattern

- [ ] `PageHeader` wird für Titel/Aktionen verwendet (falls zutreffend)
- [ ] Keine eigenen Topbar/BottomBar-Implementierungen

### Tabellen & Listen

- [ ] Tabellen nutzen MUI `Table`/`DataGrid`
- [ ] Filter-/Suchleisten sind vorhanden (falls zutreffend)

### Formulare & Validierung

- [ ] Formulare nutzen `react-hook-form` + `zod` (falls vorhanden)
- [ ] MUI `TextField`/`Select` etc. werden verwendet
- [ ] Layout ist responsiv (1 Spalte XS/SM, 2 Spalten ab MD)

### Feedback & Interaktion

- [ ] Dialoge nutzen MUI `Dialog`/`Drawer`
- [ ] Snackbar für Feedback verwendet (zentrale Lösung)
- [ ] Loading-States nutzen `LoadingSpinner`/`Skeleton`

### A11y & Usability

- [ ] Alle `IconButton`s haben `aria-label`
- [ ] Interaktive Elemente sind per Tab erreichbar
- [ ] Fokuszustände sind sichtbar
- [ ] Interaktive Flächen mind. 40x40px

## Testing

- [ ] Manuell getestet
- [ ] Responsive Verhalten geprüft
- [ ] Tastatur-Navigation getestet

## Screenshots (falls UI-Änderungen)

<!-- Optional: Screenshots der Änderungen -->

## Weitere Hinweise

<!-- Zusätzliche Informationen für Reviewer -->
