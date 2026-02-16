1. Backendlage
   - `companyTemplates`-Dokumente: Pflichtfelder `title`, `message` (app) bzw. `subject`, `bodyHtml`/`bodyText` (email); Platzhalter-Felder entfernen.
   - API `app/api/templates` + `[templateId]`: Payload-Validierung auf neue Felder umstellen, `placeholders`/`defaultPayload` streichen.
   - Functions: `notificationTriggers.ts` lädt Template direkt und speichert geschnittene Texte; `templateRenderer.ts` löschen.
   - Types & Services: `TemplatePlaceholder` u.ä. aus `lib/types`, `templateService` etc. entfernen/vereinfachen.

2. Admin Oberfläche
   - `TemplateManager`: Formular auf finale Felder reduzieren, Vorschau direkt aus Formularwerten, Placeholder-Abschnitt + Default-Payload entfernen.
   - Query/Mutations an neues API-Schema anpassen; Filter/Listen belassen.

3. Dokumentation & Tests
   - Doku (`docs/TEMPLATE_MANAGEMENT.md`, etc.) auf statische Templates aktualisieren.
   - Manual-Testbeschreibung für Event-Trigger ohne Platzhalter ergänzen.
