# Drohnenabwehr

- **Anforderungen**: `SPEC.md` lesen, bevor du Spielverhalten änderst; Abschnitt „Überblick“ trennt Vorgaben, Entscheidungen und Technik.
- **Codenamen**: `GLOSSARY.md` erklärt Kennungen wie `WEAP`, `DT`, `DAB`.
- **Browsertest**: `docs/testing.md` vor jedem Test im Browser-Bereich und vor Änderungen am Rauchtest (`npm test`) lesen.
- **Commits**: Deutsch, Betreff ohne Präfix, Issue-Nummer als erster Stichpunkt im Body (`- #6`), Stil wie `git log`.

## Agent skills

### Issue tracker

Tickets liegen als GitHub-Issues in KesselR/CounterDrone-browser-game (öffentlich), bearbeitet mit der `gh`-CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Fünf Triage-Rollen mit Standardnamen: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` und `docs/adr/` im Hauptordner. See `docs/agents/domain.md`.
