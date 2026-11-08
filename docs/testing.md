# Browsertest

Der Browser-Bereich ist oft verdeckt. Dann ruht `requestAnimationFrame`, die Spielschleife steht still, und Bildschirmfotos zeigen das vorletzte gezeichnete Bild.

1. Laden mit hochgezählter Versionsnummer: `http://localhost:8765/drohnenabwehr.html?v=<n>` (Server: `preview_start` mit `hoth`). Ohne sie liefert der Browser die alte Datei.
2. Einsatz starten: `await DAB.start({ scen, gm, weapon, mode })`.
3. Zeit simulieren mit `DAB.run(sekunden)`; in Skripten nur auf `setTimeout` warten, nie auf `requestAnimationFrame`.
4. Vor jedem Bildschirmfoto einen eigenen Aufruf `DAB.run(0.03)` absetzen; erst das Foto danach zeigt den aktuellen Stand.

Fertig, wenn `read_console_messages` keine Fehler meldet und `#err` leer ist.
