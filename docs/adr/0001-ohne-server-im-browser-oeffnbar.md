# 0001: Spiel bleibt ohne eigenen Server im Browser öffnbar

**Status:** angenommen (8. November 2026)

## Kontext
Die Spieldatei soll in mehrere Dateien aufgeteilt werden. Der naheliegende Weg wären ES-Module (`import`/`export` zwischen Dateien). Ein Test in Edge über `file://` hat gezeigt: Lokale Moduldateien blockiert der Browser („blocked by CORS policy“). Klassische Skriptdateien (`<script defer src="…">`) laden dagegen ohne Probleme.

## Entscheidung
- Das Spiel muss sich per Doppelklick auf die HTML-Datei in Edge und Chrome starten lassen, ohne lokalen Server und ohne Build-Schritt.
- Eigener Spielcode in separaten Dateien wird als klassisches Skript eingebunden, nicht als ES-Modul.
- Three.js darf weiter vom CDN kommen; das Spiel braucht also eine Internetverbindung.

## Folgen
- Abhängigkeiten zwischen den Dateien stehen nicht in `import`-Zeilen. Sie ergeben sich aus der Reihenfolge der `<script>`-Zeilen und müssen anders sichtbar gemacht werden.
- Wer ES-Module, einen Build-Schritt oder ein Offline-Bundle vorschlägt, muss diese Entscheidung ausdrücklich neu aufrollen.
- Firefox und Safari sind nicht Ziel dieser Entscheidung.
