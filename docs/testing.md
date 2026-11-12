# Browsertest

Beide Wege steuern das Spiel über `DAB` (siehe `GLOSSARY.md`): Einsatz mit `DAB.start`, Zeit mit `DAB.run`.
Die Spielschleife steht dabei still: Der Browser-Bereich ist oft verdeckt, dann ruht `requestAnimationFrame`; der Rauchtest stoppt ihn selbst.
Jeder Aufruf von `DAB.run` kostet spürbar Zeit, unabhängig von der simulierten Dauer, weil Chrome in Software rendert; daher sparsam einsetzen.

## Im Browser-Bereich

1. Laden mit hochgezählter Versionsnummer: `http://localhost:8765/index.html?v=<n>` (Server: `preview_start` mit `hoth`). Ohne sie liefert der Browser die alte Datei.
2. Einsatz starten: `await DAB.start({ scen, gm, weapon, mode })`.
3. Zeit simulieren mit `DAB.run(sekunden)`; in Skripten nur auf `setTimeout` warten, nie auf `requestAnimationFrame`.
4. Vor jedem Bildschirmfoto einen eigenen Aufruf `DAB.run(0.03)` absetzen; sonst zeigt es das vorletzte gezeichnete Bild.

Fertig, wenn `read_console_messages` keine Fehler meldet und `#err` leer ist.

## Rauchtest (`npm test`)

`npm test` lädt `index.html` per `file://` in Chrome (Playwright, kein Server).
Voraussetzung sind Node und ein installiertes Google Chrome; einmal `npm install`, danach genügt `npm test`.
Fertig, wenn `npm test` mit Exit-Code 0 endet.

Beim Erweitern:

- Jede neue Prüfung zuerst rot sehen: `npm test <Pfad>` prüft eine andere `index.html`, etwa eine Kopie ohne die Änderung oder mit eingeschleustem `throw`; sie muss mit Exit-Code 1 enden.

Umgehungen, die der Test braucht:

- Jeder Einsatz läuft in frisch geladener Seite, weil `DAB.start` nicht von Boden- auf Drohnenmodus umschaltet (siehe #10).
- Game-Over und Briefing setzt er über `DAB.G.state` von Hand, weil `DAB` keinen Einsatz beenden kann.
