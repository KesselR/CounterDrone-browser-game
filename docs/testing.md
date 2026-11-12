# Browsertest

Der Browser-Bereich ist oft verdeckt. Dann ruht `requestAnimationFrame`, die Spielschleife steht still, und Bildschirmfotos zeigen das vorletzte gezeichnete Bild.

1. Laden mit hochgezählter Versionsnummer: `http://localhost:8765/index.html?v=<n>` (Server: `preview_start` mit `hoth`). Ohne sie liefert der Browser die alte Datei.
2. Einsatz starten: `await DAB.start({ scen, gm, weapon, mode })`.
3. Zeit simulieren mit `DAB.run(sekunden)`; in Skripten nur auf `setTimeout` warten, nie auf `requestAnimationFrame`.
4. Vor jedem Bildschirmfoto einen eigenen Aufruf `DAB.run(0.03)` absetzen; erst das Foto danach zeigt den aktuellen Stand.

Fertig, wenn `read_console_messages` keine Fehler meldet und `#err` leer ist.

## Rauchtest

`npm test` lädt `index.html` per `file://` in Chrome (Playwright, kein Server).
Voraussetzung sind Node und ein installiertes Google Chrome; einmal `npm install`, danach genügt `npm test`.
Der Test greift nur über `DAB.start`, `DAB.run`, `DAB.G`, die Taste `P`, Konsolenfehler und `#err` zu.
Er startet Einsätze am Boden und als Drohne, prüft Spielzeit und Pause mit `P` und meldet Konsolenfehler sowie ein nicht leeres `#err`.
Das Hilfe-Overlay mit `H` prüft er über `#help`, `#helpKeys` und `#menuKeys`: Ein- und Ausblenden, Pause, Pilotenmodus, Tastenliste und die Zustände ohne Overlay.
Die Leertaste prüft er als Feuertaste am Boden (`DAB.G.shots`), als Steigen in der Drohne (`DAB.DR.pos.y`) und als Eintrag im Startmenü.
Das Game-Over setzt er über `DAB.G.state` von Hand, weil `DAB` keinen Weg bietet, einen Einsatz zu beenden.
Jeder Einsatz läuft in frisch geladener Seite, weil `DAB.start` nicht von Boden- auf Drohnenmodus umschaltet.
Rotprobe: `npm test <Pfad>` prüft eine andere `index.html`, etwa eine Kopie mit eingeschleustem `throw`; sie muss mit Exit-Code 1 enden.
Fertig, wenn `npm test` mit Exit-Code 0 endet.
