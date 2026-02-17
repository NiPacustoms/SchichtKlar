# Design-Consistency-Report: Seiten-Layout

**Stand:** Prüfung aller `app/**/page.tsx` gegen das gemeinsame Layout-Design.  
**Update:** Alle Inhaltsseiten (Admin, Employee, Root/Sonder) nutzen einheitlich `PageContainer` mit passendem `maxWidth`.

## Design-Regel (Ziel)

- **Admin- & Employee-Bereich:** Layout liefert bereits `AppLayout` (GlobalHeader, gradient-background, Innenabstand `pt/pb/px`, maxWidth 1440px). Der **Seiten-Inhalt** soll in **`PageContainer`** mit passendem `maxWidth` (standard 1200, wide 1400, narrow 800, form 720) stehen → einheitliches Padding (px xs 2 / sm 3, py 3) und zentrierte Breite.
- **Auth-Bereich:** Auth-Layout mit `gradient-background`; Seiten nutzen zentrierte Karten (z. B. `min-height-viewport`, Paper/Box mit maxWidth 440–520).
- **Konstanten:** `lib/constants/layout.ts` (PAGE_MAX_WIDTH_MAP).

---

## Konsistent (nutzen PageContainer oder passendes Auth-Layout)

| Seite | Container |
|-------|-----------|
| `(employee)/employee/einsaetze/[id]` | PageContainer maxWidth="narrow" |
| `(admin)/admin/einsaetze/new` | PageContainer maxWidth="form" |
| `(admin)/admin/berichte/geplante-berichte` | PageContainer maxWidth="wide" |
| `(admin)/admin/aktivitaeten` | PageContainer maxWidth="wide" |
| Auth: anmelden, passwort-vergessen, e-mail-bestaetigen, admin-registrieren, einladung-annehmen | Zentrierte Paper/Box, maxWidth 440–520 |
| `(auth)/recht/impressum`, `(auth)/recht/datenschutz` | Container/Paper, MUI |

---

## Abweichungen

### 1. Doppeltes AppLayout (Layout bereits in Route)

- **`(admin)/admin/berichte/page.tsx`** – nutzt `<AppLayout>` in der Page (Layout liefert bereits AppLayout).
- **`(employee)/employee/berichte/page.tsx`** – gleiche Doppelung.

**Erledigt:** Beide Berichte-Seiten nutzen nur noch `PageContainer maxWidth="wide"` (kein doppeltes AppLayout).

---

### 2. ~~Kein PageContainer, eigene Box mit maxWidth + p:3~~ (erledigt)

**Erledigt:** Alle genannten Admin- und Employee-Seiten nutzen jetzt `PageContainer` mit passendem `maxWidth` (standard/wide/narrow/form).

---

### 3. Andere Container / anderes UI-Framework

| Seite | Problem |
|-------|--------|
| **admin/stunden** | MUI `Container maxWidth="xl"` + `py: 4` statt PageContainer. |
| **admin/pruefprotokolle** (Audit Logs) | ~~Tailwind~~ → **Erledigt:** MUI + PageContainer. |
| **admin/dokumente/vorlagen**, **admin/stunden**, **admin/einrichtungen**, **employee/dienstplan** | **Erledigt:** Alle nutzen PageContainer. |

---

### 4. Root / Sonder-Routen

| Seite | Anmerkung |
|-------|-----------|
| **app/page.tsx** | Landing, eigenes Layout – unverändert. |
| **app/profile** | Redirect nach /profil – OK. |
| **app/customers** | **Erledigt:** PageContainer + MUI (Typography, Button) für einheitliches Layout. |
| **app/debug/token**, **app/debug-env** | **Erledigt:** PageContainer + MUI Typography. |
| **app/wartung**, **app/systemstatus** | **Erledigt:** PageContainer (wartung: narrow; systemstatus: narrow, MUI Chip/Typography). |
| **app/einladung-annehmen** | Paper + glass – bewusst Auth-Layout, unverändert. |
| **app/accept-invite**, **login**, **register**, **forgot-password** | Redirects – OK. |

---

## Kurzfassung

- **Konsistent:** Alle Seiten, die `PageContainer` nutzen bzw. im Auth-Bereich zentrierte MUI-Karten; Recht (Impressum/Datenschutz) mit Container/Paper.
- **Kritisch:**  
  - **admin/uebersicht** fehlt horizontales Padding.  
  - **admin/berichte** und **employee/berichte** doppeltes AppLayout.  
  - **admin/pruefprotokolle** und **app/customers** weichen auf Tailwind ab (Rest der App ist MUI + PageContainer/Box).
- **Empfohlen:** Alle Admin/Employee-Inhaltsseiten auf `PageContainer` mit passendem `maxWidth` umstellen; keine doppelten Layout-Wrapper; einheitlich MUI (kein Mix mit Tailwind-Klassen für Seiten-Container/Typografie).
