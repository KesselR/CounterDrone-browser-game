# SPEC – Drohnenabwehr (CounterDrone-browser-game)

Spezifikation des Browserspiels Drohnenabwehr. Sie hält fest, **was** das Spiel leisten muss (Anforderungen) und **wie** es umgesetzt ist (Umsetzungsdetails, Zahlenwerte, Algorithmen). Sie dient als Referenz für Weiterentwicklung, Fehlersuche und Abnahme. Oberfläche, Meldungen und Code-Kommentare sind auf Deutsch.

Wörter in `Code-Schrift` sind Namen aus dem Quelltext; die wichtigsten erklärt das [Glossar](GLOSSARY.md). Zahlen ohne Einheit sind Meter, Sekunden oder Grad, je nach Zusammenhang.

---

## Überblick: Vorgaben, Entscheidungen, Technik

Die folgenden drei Abschnitte trennen, woher die Inhalte dieser SPEC stammen. Die ausführlichen Kapitel ab 1 bleiben vorerst unverändert. Ob später gekürzt wird, ist offen.

### V – Vorgaben aus dem Auftrag
Ausdrücklich verlangt (aus den Prompts der ersten Sitzung):

- **V1** Browserspiel mit moderner Grafik im Stil von *Arma 3* oder *Call of Duty*, als einfache Browser-Version.
- **V2** Spielaufbau ähnlich dem Planet-Hoff-Spiel (Hoth).
- **V3** Drei Schauplätze mit der Silhouette von **Paris**, **Leipzig** und **Lübeck**.
- **V4** Anfliegende Drohnen: **Geran-5**, **Shahed** und **kleine chinesische Quadcopter**.
- **V5** Waffen: **HK416**, **AR-15** und **MG6** (deutsches MG).
- **V6** Zielsystem **Smart Shooter**: rechner- und KI-gestützt vorausberechneter Haltepunkt, um kleine Drohnen auf etwa 250 m zu bekämpfen.
- **V7** Zielsystem **Arbel**: unterbricht bei Dauerfeuer automatisch den Abzug und lässt nur Schüsse zu, die treffen können.
- **V8** Ein Modus, in dem man **selbst aus einer Drohne fliegt** und diese **automatisch feuert**.

Noch einzuordnen (in späteren Sitzungen entstanden, unklar ob Vorgabe oder Vorschlag): Bodenkampf mit Infanterie und Kampfpanzern, FGM-148 Javelin, Waffentisch, Aufzug zur Straße, MG6-Lafetten vor dem Haus, Trittbrett, abwechslungsreiche Häuserzeilen.

### E – Gestaltungsentscheidungen
Während der Umsetzung getroffen, begründet und änderbar:

- **E1** Die Stellung steht auf einem Hausdach mit Blick auf die Wahrzeichen; die Startblickrichtung zeigt die Silhouette.
- **E2** In Paris kommen die Drohnen aus der tiefstehenden Sonne hinter dem Eiffelturm, für eine dramatische Gegenlicht-Silhouette.
- **E3** Drei Tageszeiten für Abwechslung: Paris Abenddämmerung, Leipzig blaue Stunde, Lübeck Nacht.
- **E4** Zusätzliche Gegner FPV-Kamikazedrohne und Lastdrohne sowie Shahed als Geran-2/Shahed-136.
- **E5** Smart Shooter ohne Abzugssperre (nur Haltepunkt), Arbel ohne Haltepunkt (nur Sperre), damit sich die beiden Systeme klar unterscheiden.
- **E6** Die Abfangdrohne wird vom Waffentisch gestartet statt über einen eigenen Menümodus; ihr Auto-Feuer nutzt die Arbel-Prüfung mit einem schwenkbaren Turm (bis 9°).
- **E7** Gegner zielen auf die fliegende Drohne, solange sie in der Luft ist.
- **E8** Wellen, Punkte, Kettenbonus und Rekord nach dem Vorbild von Hoth; Stadtschutz als zweite Niederlagebedingung.
- **E9** Optiken beim Zielen als 2D-Darstellung statt 3D-Modell, für ein freies Sichtfeld.

### T – Technische Hinweise
Was der Code nicht selbst erklärt; alles andere (Zahlenwerte, Algorithmen, HUD, Tasten) steht im Code genau genug:

- **T1** Robustheitsregeln aus behobenen Grafikfehlern (Kapitel 23): keine Point-Sprites, `smoothstep` nur mit aufsteigenden Grenzen, NaN-Schutz in leuchtenden Shadern, Himmel unter der Bloom-Schwelle.
- **T2** Bekannte Einschränkungen und offene Punkte (Kapitel 25), unter anderem der Pilotenmodus ohne Menüeintrag.
- **T3** Abnahmekriterien zu den Vorgaben V1–V8 (Kapitel 24).
- **T4** Verweise statt Tabellen: Waffenwerte in `WEAP`, Gegner in `DT`, Szenarien in `SCEN`, Feuerleitung in `FCS`, `arbelPredict` und `solveIntercept`.

---

## Inhalt

1. [Ziel und Abgrenzung](#1-ziel-und-abgrenzung)
2. [Technische Grundlagen](#2-technische-grundlagen)
3. [Spielablauf und Zustände](#3-spielablauf-und-zustände)
4. [Hauptmenü](#4-hauptmenü)
5. [Spielmodi](#5-spielmodi)
6. [Einsatzorte](#6-einsatzorte)
7. [Stadtgenerator](#7-stadtgenerator)
8. [Stellung auf dem Dach und vor dem Haus](#8-stellung-auf-dem-dach-und-vor-dem-haus)
9. [Spielerbewegung und Kamera](#9-spielerbewegung-und-kamera)
10. [Waffen](#10-waffen)
11. [Feuerleitsysteme](#11-feuerleitsysteme)
12. [Abfangdrohne](#12-abfangdrohne)
13. [Luftgegner](#13-luftgegner)
14. [Bodengegner](#14-bodengegner)
15. [Wellen, Punkte, Spielende](#15-wellen-punkte-spielende)
16. [Schadensquellen](#16-schadensquellen)
17. [HUD](#17-hud)
18. [Grafik und Effekte](#18-grafik-und-effekte)
19. [Audio](#19-audio)
20. [Steuerung](#20-steuerung)
21. [Persistenz](#21-persistenz)
22. [Test- und Diagnosezugang](#22-test--und-diagnosezugang)
23. [Qualitäts- und Robustheitsregeln](#23-qualitäts--und-robustheitsregeln)
24. [Abnahmekriterien](#24-abnahmekriterien)
25. [Bekannte Einschränkungen und offene Punkte](#25-bekannte-einschränkungen-und-offene-punkte)
26. [Glossar](GLOSSARY.md) (eigene Datei)

---

## 1. Ziel und Abgrenzung

### 1.1 Spielidee
Ein Ego-Shooter im Browser mit moderner Grafik nach dem Vorbild von *Arma 3* und *Call of Duty*, aber als einfache Browser-Version. Der Spieler verteidigt eine Stellung auf einem Hausdach in einer europäischen Stadt gegen Drohnenangriffe. In einem zweiten Modus kämpft er gegen Infanterie und Kampfpanzer am Boden.

### 1.2 Kernanforderungen (Herkunft: Auftrag von Sam)
- **A1** Drei Einsatzorte mit erkennbarer Silhouette: **Paris**, **Leipzig**, **Lübeck**.
- **A2** Anfliegende Drohnen: **Geran-2/Shahed-136**, **Geran-5** (Strahltriebwerk) und **kleine chinesische Quadcopter**. Ergänzt um FPV-Kamikazedrohnen und Lastdrohnen.
- **A3** Waffen: **HK416**, **AR-15**, **MG6** (Bundeswehr-Bezeichnung der M134D-Gatling). Ergänzt um die **FGM-148 Javelin**.
- **A4** Zwei wählbare Feuerleitsysteme:
  - **Smart Shooter (SMASH):** Rechner und KI berechnen einen Haltepunkt vor; ausgelegt für Kleindrohnen auf etwa 250 m.
  - **Arbel:** Das System unterbricht bei Dauerfeuer den Abzug und lässt nur Schüsse zu, die treffen können.
- **A5** Ein Modus, in dem man **selbst eine Drohne fliegt** und diese **automatisch feuert** (umgesetzt als Abfangdrohne vom Waffentisch, siehe Kapitel 12).
- **A6** Spielmodus **Bodenkampf** mit Aufzug vom Dach zur Straße, Infanterie und Kampfpanzern.
- **A7** Ähnlicher Spielaufbau wie das ältere Spiel „Hoth – Echo-Stellung“: feste Stellung, Wellen, Punkte, Kettenbonus, Rekord.

### 1.3 Abgrenzung
- Kein Mehrspielermodus, kein Server, keine Konten.
- Nur Desktop mit Maus und Tastatur; Touch-Geräte werden nicht unterstützt.
- Das Spiel stellt Abwehr dar. Angriffe auf Zivilisten sind nicht spielbar; Einschläge in der Stadt sind ein Misserfolg des Spielers.

---

## 2. Technische Grundlagen

### 2.1 Auslieferung
- **Eine HTML-Datei** mit eingebettetem CSS und einem `<script type="module">`. Kein Build-Schritt, keine lokalen Abhängigkeiten.
- **Three.js 0.170.0** über eine Import-Map von jsDelivr:
  - `three` → `https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js`
  - `three/addons/` → `…/examples/jsm/`
  - Verwendete Addons: `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `ShaderPass`, `OutputPass`, `mergeGeometries` (BufferGeometryUtils), `RoundedBoxGeometry`.
- Schriften über Google Fonts: *Rajdhani* (Oberfläche) und *Share Tech Mono* (Anzeigen). Fallback auf Systemschriften.
- **Internetverbindung erforderlich** (Three.js und Schriften kommen aus dem Netz).
- Starten über einen beliebigen Webserver oder per Doppelklick, solange das CDN erreichbar ist.
- Ein globaler Fehlerfänger zeigt Laufzeitfehler unten links im Element `#err` an.

### 2.2 Browser-Anforderungen
WebGL 2, Pointer Lock API, Web Audio API, ES-Module mit Import-Maps, `CanvasRenderingContext2D` (für `createConicGradient` gibt es eine Rückfallebene).

### 2.3 Koordinaten und Einheiten
- Einheiten: Meter, Sekunden, Kurs in Grad.
- Kurs 0° = Norden = −Z, 90° = Osten = +X. Hilfsfunktionen: `polar(kurs, distanz) → [x, z]`, `headingOf(x, z) → kurs`.
- Die eigene Stellung steht im Ursprung. Die Dachgruppe `world.roofG` ist um `−viewHdg` gedreht, sodass ihr lokales −Z in die Hauptblickrichtung des Einsatzorts zeigt.
- Modelle (Drohnen, Soldaten, Panzer, Flugkörper) blicken lokal nach +Z, damit `lookAt` funktioniert.

### 2.4 Render-Pipeline
| Baustein | Umsetzung |
|---|---|
| Renderer | `WebGLRenderer`, Pixelverhältnis max. 1,25, ACES-Filmic-Tonemapping, sRGB-Ausgabe, PCF-Soft-Schatten |
| Hauptszene | `scene` mit `camera` (FOV 72°, near 0,25, far 16.000) |
| Waffenszene | `gunScene` mit eigener `gunCam` (FOV 56°, beim Zielen 28°); verhindert, dass die Waffe in Wände ragt |
| Composer | Render-Ziel HalfFloat mit 4-fach MSAA |
| Pässe | Hauptszene → Waffenszene (nur Tiefenpuffer löschen) → Bloom → OutputPass → Schlusspass |
| Bloom | Stärke 0,5, Radius 0, Schwelle 1,2; Gewichte der Stufen `[1, 0,75, 0,4, 0,15, 0,05]`; Hochpass filtert ungültige Werte (NaN) und begrenzt auf 10 |
| Schlusspass | Vignette, Filmkorn, chromatische Aberration, Farbkorrektur (Lift/Gain/Sättigung), rote Schadenseinfärbung, Mündungsblitz |
| Umgebung | Himmel per PMREM als Umgebungskarte gebacken (`bakeEnv`), für beide Szenen |
| Beleuchtung | Gerichtetes Licht (Sonne oder Mond) mit 2048er-Schattenkarte, ±22 m um die Kamera; Halbkugellicht; Waffenszene mit eigenem Licht, das der Blickrichtung folgt |

### 2.5 Programmaufbau (Abschnitte im Quelltext)
1. Mathe-Helfer, Renderer, Szenen, Composer
2. Himmels-Shader und Umgebungskarte
3. Prozedurale Texturen (Fassaden, Dächer, Ziegel, Partikelatlas …)
4. Materialien
5. Stadtbau: Geometrie-Baukasten `GB`, Gebäude, Wahrzeichen, Szenarien `SCEN`, Stadtgenerator, Straßenmöblierung
6. Level-Aufbau `buildLevel`
7. Stellung (`buildRoof`) und Waffendaten (`WEAP`, `JAV`, `FCS`), Waffenmodelle
8. Drohnen: Typen `DT`, Modelle, Verhalten
9. Effekte (Partikel, Leuchtspur, Hülsen, Explosionen)
10. Audio (Synthese)
11. Spiellogik: Zustand, Ballistik, Javelin, Waffen, Feuerleitung, Wellen, Spieler
12. Abfangdrohne
13. Bodenkampf: Gebäude-Kollision, Wegfindung, Bodengegner, Aufzug
14. Ablauf, Eingabe, Menü
15. HUD
16. Hauptschleife, Start, Diagnosezugang

---

## 3. Spielablauf und Zustände

### 3.1 Zustandsmaschine (`G.state`)
```
menu ──[EINSATZ BEGINNEN]──▶ loading ──▶ brief ──[Klick/Enter]──▶ play ◀──▶ pause
  ▲                                                                 │
  └──────────────[HAUPTMENÜ]──────────── over ◀──[Spielende]────────┘
```
- **menu:** Menü-Overlay, keine 3D-Darstellung.
- **loading:** „STADT WIRD AUFGEBAUT“; nach 60 ms `buildLevel(G.scen)` und `prepareRun()`. Bei einem Fehler zurück ins Menü mit Fehlertext.
- **brief:** Einsatzbesprechung über der fertigen Szene; die Kamera schwenkt leicht. Der Text hängt von Modus und Waffe ab.
- **play:** Spiel läuft; `beginPlay()` startet den Ton und fordert Pointer Lock an.
- **pause:** bei Verlust des Pointer Locks (Esc) oder Taste P. Klick oder „WEITER“ setzt fort.
- **over:** Spielende; nach 1,4 s erscheint die Auswertung. Abstürzende Drohnen und Effekte laufen weiter.

### 3.2 Anforderungen an den Ablauf
- **F-ABL-1** Jeder Neustart (`prepareRun`) setzt Punkte, Welle, Stadtschutz, Gesundheit, Munition, Gegner, Geschosse, Flugkörper, Drohnen-Bereitschaft und Aufzug vollständig zurück.
- **F-ABL-2** Die erste Welle beginnt 6 s nach Spielstart (Anzeige „ERSTE WELLE IN … S“).
- **F-ABL-3** Ohne Pointer Lock (etwa in eingebetteten Browsern) läuft das Spiel trotzdem; die Maus wirkt dann über `movementX/Y`.
- **F-ABL-4** Die Auswertung zeigt Punkte, Rekord, Welle, Abschüsse, abgegebene Schüsse, Trefferquote, im Drohnenabwehr-Modus den Stadtschutz und bei Arbel die Zahl gesperrter Schüsse.

---

## 4. Hauptmenü

Vier Abschnitte mit Karten; die Auswahl wird markiert und gespeichert.

| Abschnitt | Auswahl | Inhalt der Karte |
|---|---|---|
| 01 · SPIELMODUS | Drohnenabwehr / Bodenkampf | Beschreibung, Gegner, Bedingung für das Spielende |
| 02 · EINSATZORT | Paris / Leipzig / Lübeck | gezeichnete Skyline-Silhouette, Uhrzeit, Kurztext, Rekord |
| 03 · FEUERLEITSYSTEM | Smart Shooter / Arbel | Funktionsweise, Wirkbereich |
| 04 · STARTWAFFE | HK416 / AR-15 / MG6 / Javelin | Kaliber, Kadenz, v0, Magazin bzw. Flugkörper |

Darunter: Knopf „EINSATZ BEGINNEN“ und eine Tastenübersicht.

- **F-MEN-1** Die Skyline-Bilder werden per Canvas gezeichnet (Paris: Eiffelturm in der Abendsonne, Invalidendom, Montparnasse, Sacré-Cœur; Leipzig: City-Hochhaus, Rathausturm, Völkerschlachtdenkmal, Kühltürme mit Dampf; Lübeck: Holstentor, sieben Türme, Mond, Wasser).
- **F-MEN-2** Der Rekord auf der Stadtkarte gilt für den gewählten Spielmodus.

---

## 5. Spielmodi

### 5.1 Drohnenabwehr (`G.gm = 'air'`)
- Gegner: Luftziele (Kapitel 13).
- Ziel: Wahrzeichen und Wohnblocks schützen (Wert **Stadtschutz**, Start 100 %).
- Spielende: Stadtschutz 0 % („STADT NICHT GEHALTEN“) oder Gesundheit 0 („GEFALLEN“).
- Bonus am Wellenende: 150 × Welle + 5 × Stadtschutz-Prozent.
- Aufzug, Straße und MG6-Lafetten vor dem Haus sind ebenfalls nutzbar.

### 5.2 Bodenkampf (`G.gm = 'land'`)
- Gegner: Infanterie und alle fünf Wellen ein Kampfpanzer (Kapitel 14).
- Kein Stadtschutz; Spielende nur bei Gesundheit 0.
- Bewegungsraum auf der Straße: Kreis mit 100 m Radius um die Stellung (`LAND.radius`); am Rand erscheint eine Warnung.
- Hauswände halten Geschosse, Flugkörper und Handgranaten auf.
- Radar zeigt 150 m statt 1,5 km.
- Bonus am Wellenende: 150 × Welle.

### 5.3 Abfangdrohne
Wird in beiden Modi über den **Waffentisch** auf dem Dach gestartet (Kapitel 12). Der Soldat bleibt dabei auf dem Dach; die Sicht wechselt in die Drohne.

### 5.4 Eigenständiger Pilotenmodus (Altbestand)
Der Code kennt weiterhin `G.play = 'drone'` ohne Waffentisch: Die Drohne startet dann vom Landeplatz, hat einen Akku (300 s), 800 Schuss und lädt am Landeplatz H nach. Im Menü gibt es dafür **keine Auswahl** mehr; erreichbar ist der Modus nur über einen alten Eintrag `play: 'drone'` in den gespeicherten Einstellungen (siehe 25).

---

## 6. Einsatzorte

Alle Szenarien stehen in `SCEN`. Gemeinsame Felder: Startwert des Zufallsgenerators `seed`, Dachhöhe `roofH`, Hauptblickrichtung `viewHdg`, Bedrohungsrichtung `threat`, Himmel `sky`, Nebel `fog`, Licht, Belichtung, Fensterbeleuchtung, Farbkorrektur, Flüsse, Hügel, Parks, Wahrzeichen, Anzahl Suchscheinwerfer und Flak-Stellungen, Bezirksregel `district()`.

### 6.1 Übersicht
| | Paris | Leipzig | Lübeck |
|---|---|---|---|
| Uhrzeit | Abenddämmerung 20:47 | Blaue Stunde 17:58 | Nacht 23:14 |
| Dachhöhe | 25 m | 44 m | 27 m |
| Blickrichtung | 250° (WSW) | 210° (SSW) | 90° (O) |
| Bedrohung aus | 250° ± 80° | 215° ± 80° | 70° ± 85° |
| Eigene Fassade | haussmann | office | gruender2 |
| Himmel | Sonne 3° über dem Horizont, orange, Wolken 42 % | Sonne 5° unter dem Horizont, Wolken 68 % | Mond 21° hoch, Sterne, Wolken 34 % |
| Nebel (Farbe, Dichte) | #b78a72, 0,00034 | #4c5266, 0,00040 | #121828, 0,00052 |
| Belichtung | 0,68 | 1,05 | 1,3 |
| Fenster beleuchtet | 22 % | 40 % | 38 % |
| Suchscheinwerfer / Flak | 2 / 3 | 4 / 5 | 5 / 4 |

### 6.2 Wahrzeichen (Kurs / Entfernung von der Stellung)
**Paris:** Eiffelturm 250°/1.150 m (Gitterkonstruktion aus Trägern, Beleuchtung), Invalidendom 212°/680 m, Tour Montparnasse 195°/1.850 m, Arc de Triomphe 286°/2.350 m, La Défense 291°/5.600 m mit Grande Arche, Sacré-Cœur 15°/2.600 m auf dem Montmartre-Hügel (112 m), Notre-Dame am Seine-Ufer, Panthéon 158°/1.300 m. Seine als Flussband (120 m breit) mit Kaimauern und vier Brücken; Champ de Mars als Park.

**Leipzig:** City-Hochhaus 215°/270 m (Grundriss als gekrümmte Linse, Krone mit Positionslichtern), Gewandhaus, Oper, Nikolaikirche 262°/330 m, Neues Rathaus 236°/820 m, Thomaskirche 252°/680 m, Völkerschlachtdenkmal 160°/4.200 m mit Wasserbecken, Kraftwerk mit zwei Kühltürmen und Dampf 186°/6.800 m, Hauptbahnhof 330°/680 m mit sechs Bahnsteighallen, Wintergartenhochhaus 350°/560 m mit Leuchtring, MDR-Turm. Augustusplatz als freie Fläche; Clara-Zetkin-Park.

**Lübeck:** Holstentor 95°/235 m (Rundtürme mit Kegeldächern, Treppengiebel), Salzspeicher, Petrikirche, Marienkirche (Doppelturm), Rathaus mit Schildwand, Dom (Doppelturm), Jakobikirche, Ägidienkirche. Trave und Kanal als Flüsse, Altstadtinsel leicht erhöht (12 m), Holstenbrücke, vier Schiffe mit Lichtern, Platz vor dem Holstentor. Backsteinkirchen und Kupferdächer werden nachts angestrahlt (Emission).

### 6.3 Anforderungen
- **F-ORT-1** Die Silhouette jedes Orts muss aus der Startposition ohne Drehen erkennbar sein; nahe Häuser dürfen die Wahrzeichen nicht verdecken (in Lübeck daher niedrigere Häuser unter 400 m und ein freier Platz vor dem Holstentor).
- **F-ORT-2** Wahrzeichen werden zur Stellung hin ausgerichtet (`face`) und erscheinen mit Namen im Kompass.
- **F-ORT-3** Wahrzeichen (außer La Défense, Grande Arche, Kraftwerk) sind Angriffsziele mit dreifachem Gewicht.

---

## 7. Stadtgenerator

### 7.1 Ringe
`genCity(S)` legt ein um `gridRot` gedrehtes Raster in drei Ringen an:

| Ring | Radius | Zelle | Straßenbreite | Bebauung |
|---|---|---|---|---|
| 0 (nah) | 22–650 m | `cellNear` (30–36 m) | 12 m | Häuserblöcke mit Einzelhäusern (`cityBlock`) |
| 1 (mittel) | 650–1.900 m | 54 m | 15 m | Häuserblöcke, Hausbreiten × 1,6 |
| 2 (fern) | 1.900–5.200 m | 96 m | 24 m | einfache Quader/Zeilen als Silhouette |

Zellen fallen weg bei: Nähe zur eigenen Stellung (< 22 m), Ausschlusszonen der Wahrzeichen, Flüssen und Parks. An Blockecken entstehen Straßenlaternen als Leuchtpunkte.

### 7.2 Häuserblöcke (`cityBlock`)
Ein Block besteht aus Einzelhäusern mit eigener Breite, Geschosszahl, Dachform, Hausvorlage und Farbton. Blocktypen mit Gewichten je Szenario (`kinds`):
- **rand:** Blockrand mit vier Zeilen um einen Innenhof mit Bäumen
- **doppel:** zwei Zeilen Rücken an Rücken
- **reihe:** eine Zeile, dahinter Gärten
- **solo:** Einzelbau, oft als Winkel mit Seitenflügel
- **luecke:** Baulücke, schmale Zeile mit Bäumen dahinter

Weitere Regeln: Eckhäuser oft ein Geschoss höher, Vor- und Rücksprünge der Bauflucht, giebelständige Häuser (`gs`) und Treppengiebel (`step`), Dachform-Abweichungen (`alt`), Gauben in Spielernähe (< 260 m), Schornsteine.

### 7.3 Gebäude (`addBuilding`)
- Wände und Dächer als Vierecke im Geometrie-Baukasten `GB`, gebündelt pro Material (wenige Draw-Calls). Vertex-Farben tragen den Farbton jedes Hauses.
- Dachformen: `flat` (Kies, ab 24 m Höhe mit Aufbau), `mansard` (Zink, mit Schornsteinen und Gauben), `gable` (Satteldach), `step` (Treppengiebel), `none` (eigenes Haus).
- **15 Hausvorlagen** (`FACADE`): haussmann, stone2, modern, office, platte, gruender, gruender2, brick, brick2, plaster sowie mit Ladenzone im Erdgeschoss pastell, jugend, klinker, nachkrieg, lamelle. Jede Vorlage ist eine 512×512-Textur mit 8×8 Fensterachsen: Farbkarte, Leuchtkarte (beleuchtete Fenster) und Rauheitskarte. Fenstermaße je Vorlage in `STYLE_DIM`.
- Jedes Gebäude trägt sich in die **Höhenkarte** `HM` ein (6-m-Raster, 6 × 6 km) für die Kollision der Drohne.
- Häuser im Umkreis von 230 m landen mit genauem Grundriss in `world.blds` (Blöcke als Umriss mit `kids`) für Kollision, Sichtlinien und Geschosse im Bodenkampf.

### 7.4 Straßenmöblierung (`addStreetProps`)
Im Umkreis von 260 m: Laternen (mit Lichtkegel auf dem Pflaster), Bänke, Mülleimer (Farbe je Stadt), Straßenbäume. Kreuzungen und der Aufzugsausgang bleiben frei. Alle Objekte stehen in einem 8-m-Raster (`propGrid`) und sind Hindernisse für Spieler und Infanterie; Panzer walzen darüber.

### 7.5 Wahrzeichen
Aus Grundkörpern gebaut (`prim`), anschließend pro Material zusammengeführt (`bakeGroup`) mit Box-Projektions-UVs im Weltmaßstab. Gitterträger (Eiffelturm) über `beamInto`. Für die Drohnenkollision: Kreis mit halbem Ausschlussradius (max. 45 m) und 80 % der Höhe.

---

## 8. Stellung auf dem Dach und vor dem Haus

### 8.1 Dach (20 × 20 m, Höhe `roofH`)
| Element | Lage (lokal, −Z = Blickrichtung) | Funktion |
|---|---|---|
| Brüstung | Rand, 1,15 m hoch mit Abdeckung | Deckung |
| Trittbrett | innen an der Brüstung, 0,45 m hoch, hinter dem Treppenhaus unterbrochen | hinaufsteigen, nah an die Mauer, beim Blick nach unten vorbeugen (bis 0,45 m) |
| Sandsäcke | auf dem Trittbrett, Front dreilagig, Flanken zweilagig | Deckung, Optik |
| Treppenhaus mit Aufzug | hinten links | Aufzug zur Straße, Schild und Ruftaster |
| Waffentisch | Mitte links | HK416, AR-15, MG6, Javelin und Abfangdrohne mit Fernbedienung zum Aufnehmen |
| Munitionskisten | vorne rechts, mit Tablet (Lagebild) | Reserven auffüllen |
| Radar auf Stativ | vorne links | dreht sich |
| Landeplatz H | Mitte links | Start und Landung der Drohne |
| Klimageräte, Antennenmast mit Warnlicht, Schüssel | rechts bzw. hinten | Hindernisse, Optik |
| Schornsteine (nur Paris) bzw. Lüftungskasten | Rand | Hindernisse |
| Arbeitsleuchte | am Treppenhaus | Licht (nicht in Paris) |

Hindernisse stehen in `roofObstacles`; die Kollision schiebt den Spieler auf dem kürzesten Weg heraus, nie hinter die Mauer.

### 8.2 Vor dem Haus
- **Vier MG6-Lafetten** auf der Straße, je eine pro Hausseite, Mündung nach außen, mit Sandsackwall im Halbkreis. Jede Lafette bekommt eine Himmelsrichtung als Namen (NORD, OST …).
- **Aufzugstür** an der Rückfassade mit Schild, Lampe und Ruftaster.

### 8.3 Anforderungen
- **F-STE-1** Der Spieler kann das Dach nicht verlassen außer per Aufzug oder beim Wechsel an eine Lafette.
- **F-STE-2** Vom Trittbrett aus muss man über die Brüstung auf die Straße schießen können.
- **F-STE-3** Die gehaltene Waffe fehlt auf dem Waffentisch; die gestartete Drohne ebenfalls.

---

## 9. Spielerbewegung und Kamera

| Wert | Größe |
|---|---|
| Gehen / Laufen (Shift + W) | 3,3 / 5,6 m/s |
| Ducken (C oder Strg) | halbe Geschwindigkeit, Augenhöhe 1,05 m statt 1,65 m |
| Beim Zielen | 55 % der Geschwindigkeit |
| An der Lafette | keine Bewegung, Augenhöhe 1,55 m, Nickwinkel −0,35 … 1,25 rad |
| Sonst Nickwinkel | ±1,45 rad |
| Mausempfindlichkeit | 0,0021 rad/px × (FOV / 72) |
| Gesundheit | 100, Regeneration 14/s nach 4,5 s ohne Treffer (nicht in der Drohne) |

- Kopfnicken beim Gehen, Kamerawackeln bei Explosionen (`G.shake`), Rückstoß als Nickversatz.
- Auf der Straße: Kollision mit Häusern, Möblierung, Wahrzeichen und Flüssen (`walkBlocked`), Radius 100 m, kein Durchlaufen von Panzern.
- **Aufzug:** Fahrt 2,4 s mit Abblende; in der Mitte wird die Position getauscht. Während der Fahrt kein Feuern.

---

## 10. Waffen

### 10.1 Waffendaten (`WEAP`)
| | HK416 A5 | AR-15 (16") | MG6 (M134D) | FGM-148 Javelin |
|---|---|---|---|---|
| Kaliber | 5,56 × 45 mm | 5,56 / .223 | 7,62 × 51 mm | 127 mm Lenkflugkörper |
| Kadenz | 850/min | 480/min (nur Einzelfeuer) | 3.000/min | 1 Schuss pro Startrohr |
| Feuerart | Dauer/Einzel (B) | Einzel | Dauer | Fire and Forget |
| Magazin / Reserve | 30 / 270 | 30 / 270 | 1.500 / 3.000 | 1 / 6 |
| v0 | 890 m/s | 940 m/s | 850 m/s | 230 m/s |
| Luftwiderstand c | 0,42 | 0,40 | 0,33 | – |
| Schaden pro Treffer | 1 | 1,05 | 1,6 | 100 |
| Streuung Hüfte / Visier | 1,0° / 0,06° | 0,9° / 0,045° | 0,42° / 0,28° | – |
| Rückstoß | 0,30° | 0,22° | 0,03° | – |
| Visier-FOV | 22° | 22° | 28° | 18° (Zielgerät 4×/9×) |
| Nachladen (Rest / leer) | 2,2 / 2,7 s | 2,3 / 2,8 s | 5,0 s | 4,2 s |
| Leuchtspur | jeder 4. | jeder 5. | jeder 5. | – |
| Besonderheit | – | – | 0,45 s Anlaufzeit, nur auf Lafette | Zielgerät und Aufschaltung nötig |

### 10.2 Ballistik
- Geschosse fliegen mit linearem Luftwiderstand und Schwerkraft. Die Position wird **exakt** berechnet statt schrittweise integriert:
  `x(t) = o + (g/c)·t + (v0 − g/c)·(1 − e^(−c·t))/c`
- Flugzeit für eine Entfernung R: `t = −ln(1 − c·R/v0)/c` (keine Lösung, wenn `1 − c·R/v0 ≤ 0,05`).
- Treffertest pro Bild: Strecke zwischen alter und neuer Position gegen die Trefferkugel jedes Ziels (Radius `T.r`). Im Bodenkampf und auf der Straße zusätzlich gegen Hauswände (`segBlock`).
- Geschosse verschwinden nach 3 s oder unter dem Boden.

### 10.3 Schießen
- Streuung wächst mit Bewegung (bis +120 %) und Dauerfeuer („Bloom“, bis +250 %, Abbau 2,6/s).
- Rückstoß: 55 % bleiben im Nickwinkel, 45 % federn zurück; im Visier 75 %.
- Hülsen fliegen aus dem Auswurf und hüpfen auf dem Boden (max. 80 gleichzeitig, mit Klirren); das MG6 wirft seltener und nach unten aus.
- Mündungsfeuer als Sternsprite, Punktlicht in beiden Szenen, gelegentlich Rauch.
- Leeres Magazin: Klicken und automatisches Nachladen, wenn Reserve vorhanden.
- **Munitionskiste (E):** füllt in 1,2 s alle Reserven auf.
- Am Wellenende: Reserve + 2 Magazine (MG6: halber Gurt), höchstens bis zum Startwert.

### 10.4 MG6 und Lafetten
- Das MG6 ist nur auf einer Lafette nutzbar. Aufnehmen vom Tisch oder Taste 3 wählt die **nächste** Lafette, auf der Straße E an einer Lafette in 1,5 m.
- Beim Wechsel an die Lafette merkt sich das Spiel die Dachposition; X verlässt die Lafette und kehrt zur letzten Handwaffe und Position zurück.
- Das Rohrbündel läuft 0,45 s an und 1,4 s aus; geschossen wird erst bei 98 % Drehzahl. Ton: durchlaufende Salve plus Motorgeräusch.

### 10.5 Javelin (`JAV`)
| Wert | Größe |
|---|---|
| Zielaufschaltung | bis 500 m, Zielrahmen 4°, Halten innerhalb 12° |
| Aufschaltzeit | 1,2 s ruhig im Rahmen (1,5-facher Rahmen zählt) |
| Suchkopf kühlen | 1,5 s nach dem Aufnehmen |
| Ablauf nach dem Schuss | 0,8 s nachsehen, dann 4,2 s neues Startrohr |
| Start | Ausstoß mit 26 m/s, Marschtriebwerk zündet nach 0,32 s |
| Flug | Beschleunigung 340 m/s², höchstens 230 m/s, Kurvenrate 2,6 rad/s |
| Lenkung | auf den vorausberechneten Treffpunkt (Proportionalnavigation vereinfacht) |
| Zünder | scharf nach 25 m, Annäherungszünder 2,2 m + Zielradius |
| Wirkung | 100 Schaden, Splitterradius 6 m (tötet ungepanzerte Ziele) |
| Selbstzerlegung | nach 500 m oder 8 s |

- Feuern nur mit geöffnetem Zielgerät (rechte Maustaste) und Aufschaltung; sonst Hinweis.
- Zielgerät (CLU) als Wärmebild: entsättigt, grünstichig, Bildzeilen, Statusfelder IR/WFOV/NFOV/SEEK/TOP/DIR/FLT/HANG, Tonsignal (pulsierend = Erfassung, Dauerton = aufgeschaltet).
- B schaltet das Sichtfeld 4×/9×; Q wechselt das Ziel.
- Eigener Flugkörper verletzt den Spieler innerhalb 10 m (bis 60).

### 10.6 Waffenmodelle (Viewmodel)
- HK416 mit Vierkant-Schiene, AR-15 mit schlankem M-LOK-Handschutz und FDE-Magazin, MG6 mit sechs Läufen, Zuführschacht und Spatengriffen, Javelin mit Startrohr und Zielgerät. Behandschuhte Hände und Tarnärmel.
- Optik je Feuerleitsystem: kastenförmige SMASH-Optik bzw. Röhrenoptik mit Arbel-Modul an der Abzugsgruppe.
- Animationen: Schwanken, Kopfnicken, Rückstoß, Laufhaltung, Nachladen (Magazin fällt und kommt wieder), Waffenwechsel (0,5 s), Aufmunitionieren.
- **Beim Zielen** wird das 3D-Modell ab 80 % ausgeblendet und eine 2D-Optik gezeichnet: dunkles Gehäuse, Fenster (SMASH rechteckig, Arbel rund), Glasreflex, Vergrößerungsangabe.

---

## 11. Feuerleitsysteme

Wahl im Menü, Wechsel im Spiel mit V, Ein/Aus mit F. Bei der Javelin sind beide Systeme außer Kraft.

### 11.1 Smart Shooter (SMASH)
- **Anforderung:** Rechner und KI berechnen einen Haltepunkt vor; gedacht für Kleindrohnen bis etwa 250 m. Der Abzug bleibt frei.
- Nur mit Visier aktiv.
- Aufschaltung auf das Ziel, das am nächsten an der Bildmitte liegt (Kegel 5°, bis 440 m). Die Aufschaltung hält bis 14° Abweichung und 460 m.
- Nach 0,35 s ist das Ziel aufgeschaltet (Piepton), dann wird bis 250 m der Haltepunkt berechnet (`solveIntercept`): Vorhalt aus Zielgeschwindigkeit und Flugzeit (sechs Iterationen) plus Geschossfall.
- Anzeige: KI-Erkennungsrahmen mit Konfidenz („UAV 9x %“) um alle Ziele bis 440 m, Aufschaltrahmen zieht sich zusammen, Haltepunkt als Raute mit Linie zum Ziel, Flugzeit und Vorhalt in Metern, „HALTEPUNKT ERFASST · FEUER“, wenn das Absehen innerhalb der Treffertoleranz liegt. Über 250 m: „AUSSER WIRKBEREICH“.
- Q wechselt zum nächsten Ziel.

### 11.2 Arbel
- **Anforderung:** Bei gehaltenem Abzug werden nur Schüsse freigegeben, deren berechnete Flugbahn treffen kann; alle anderen werden gesperrt.
- Für **jeden** Schuss wird die tatsächliche Richtung inklusive Streuung geprüft (`arbelPredict`):
  1. Ziele bis 700 m innerhalb eines Kegels (cos > 0,96, etwa 16°).
  2. Fehlabstand zwischen Geschossbahn und geradlinig fortgeschriebener Zielbahn über `t ∈ [0; 1,6·Flugzeit + 0,05]`: 21 grobe Stützstellen, danach Dreiteilungssuche mit 14 Schritten.
  3. Freigabe, wenn der kleinste Abstand unter 80 % des Zielradius liegt.
- Gesperrte Schüsse verbrauchen keine Munition und werden gezählt; leises Sperr-Klicken.
- Anzeige: roter Leuchtpunkt mit Statusring (grün = Trefferlösung), Zustände BEREIT / TREFFERLÖSUNG / FREIGABE / SPERRE, Zähler „GESPERRT n · ABGEGEBEN m“. Auch beim Hüftfeuer färbt sich das Fadenkreuz.

---

## 12. Abfangdrohne

### 12.1 Einsatz vom Waffentisch (`G.uav`)
- **Anforderung:** Aus der Drohne selbst fliegen; die Drohne feuert automatisch.
- Start mit E am Tisch. Die Drohne startet vom Landeplatz H; der Soldat bleibt auf dem Dach, seine Gesundheit wird gemerkt.
- 200 Schuss pro Einsatz (`UAV.ammo`), **Funkreichweite 500 m** um den Landeplatz (weiche Grenze mit Rückstoß und Warnung ab 460 m), kein Akkuverbrauch.
- Ende: X ruft die Drohne zurück (Restmunition bleibt erhalten). Bei leerer Munition oder Zerstörung wird sie deaktiviert und ist **2:50 min gesperrt** (`UAV.cool`), danach mit vollen 200 Schuss wieder bereit.
- Zerstörung der Drohne beendet das Spiel nicht; die Sicht kehrt nach 1,4 s aufs Dach zurück.
- Status links oben: „ABFANGDROHNE BEREIT · n SCHUSS“, „IM EINSATZ“ oder Countdown.

### 12.2 Flugmodell
| Wert | Größe |
|---|---|
| Beschleunigung / Boost (Shift + W) | 28 / 46 m/s² |
| Dämpfung | v × e^(−0,55·dt) (Endgeschwindigkeit etwa 51 bzw. 84 m/s) |
| Steigen / Sinken | Leertaste / C oder Strg (90 % Anteil) |
| Seitwärts | 80 % Anteil |
| Gipfelhöhe | 700 m |
| Kollision | Höhenkarte `HM` + 0,4 m; ab 11 m/s Schaden (v − 11) × 2,4 |
| Rammen | Feindliche Drohne in Reichweite r + 1,3 m wird zerstört; Schaden 14 (klein) bzw. 38 (groß) |
| Neigung und Rollen | aus Geschwindigkeit und Eingabe, gedämpft |

### 12.3 Bord-MG und Auto-Feuer (`DRW`)
- 5,56 mm, 900/min, v0 900 m/s, Streuung 0,3°, jede 3. Patrone Leuchtspur.
- **Zielnachführung:** Der MG-Turm schwenkt bis 9° aus der Flugrichtung auf den berechneten Vorhaltepunkt (`solveIntercept`) des besten Ziels bis 650 m.
- **Auto-Feuer (F, Standard an):** Ist ein Ziel erfasst, wird jeder Schuss mit der Arbel-Prüfung (`arbelPredict`) freigegeben. Zurückgehaltene Schüsse werden gezählt.
- Manuelles Feuer mit der linken Maustaste ist immer möglich (ohne Prüfung).
- Rechte Maustaste zoomt (FOV 34°).

### 12.4 Kamera und Anzeige
- **Verfolgerkamera** (Standard): 7,5 m hinter und 2,2 m über der Drohne, über Gebäuden gehalten, FOV 76°.
- **FPV-Bugkamera** (V): FOV 92°, Drohne ausgeblendet, Horizont rollt mit.
- OSD: Nickleiter, Geschwindigkeitsvektor, MG-Absehen an der tatsächlichen Turmrichtung, Zielrahmen „AUTO-FEUER · Typ · Entfernung“, Geschwindigkeit in km/h, Höhe über Grund, Steigrate, Markierung „H BASIS n m“, Warnungen (Reichweite, Munition), „[X] DROHNE ZURÜCKRUFEN“.
- Motorgeräusch aus drei Sägezahn-Oszillatoren, Tonhöhe folgt Geschwindigkeit und Boost.

### 12.5 Gegnerverhalten gegenüber der Drohne
FPV-Drohnen, Explosionen, Trümmer, Panzergranaten und Infanteriefeuer zielen auf die Drohne (`playerPoint()`), solange sie fliegt. Infanterie trifft die Drohne mit 60 % der normalen Wahrscheinlichkeit.

---

## 13. Luftgegner

### 13.1 Typen (`DT`)
| Typ | Anzeige | Treffer | Trefferradius | Geschw. | Punkte | Stadtschaden |
|---|---|---|---|---|---|---|
| shahed | GERAN-2 / SHAHED-136 | 4 | 2,0 m | 50 m/s | 150 | 7 % |
| geran5 | GERAN-5 (Strahltriebwerk) | 6 | 2,7 m | 112 m/s | 260 | 12 % |
| quad | Quadcopter (Mavic-Typ) | 1 | 0,8 m | 15 m/s | 60 | – |
| fpv | FPV-Kamikazedrohne | 1 | 0,7 m | 31 m/s | 90 | – |
| heavy | Lastdrohne (Agrar-Typ) | 3 | 1,5 m | 9 m/s | 120 | 3 % |

Modelle: Shahed als schwarzer Deltaflügler mit Winglets und Druckpropeller; Geran-5 grau mit Rumpf, Pfeilflügel, V-Leitwerk und aufgesetztem Strahltriebwerk mit Flamme; Quadcopter hellgrau mit blinkenden LEDs und Granate; FPV als Carbon-X-Rahmen mit RPG-Gefechtskopf; Lastdrohne weiß mit vier großen Rotoren, Tank, Kufen und Bombe.

### 13.2 Erscheinen
| Typ | Entfernung | Höhe | Richtung |
|---|---|---|---|
| shahed | 2.400 m | Dach + 55…120 m | Bedrohungsrichtung ± Streuung |
| geran5 | 3.000 m | 210…320 m | Bedrohungsrichtung ± Streuung |
| quad | 800…1.000 m | Dach + 28…60 m | 30 % aus beliebiger Richtung |
| fpv | 850…1.000 m | Dach + 12…40 m | 30 % aus beliebiger Richtung |
| heavy | 950 m | Dach + 45…75 m | Bedrohungsrichtung ± Streuung |

Shaheds kommen mit 35 % Wahrscheinlichkeit als Schwarm (1–2 Begleiter, 2–3,5 s Abstand, ±4° Kurs).

### 13.3 Verhalten
- **Shahed / Geran-5:** Reiseflug auf ein Ziel (60 % Ziele auf der Anflugseite, gewichtet: Wahrzeichen 3, Wohnblock 1), leichtes Schlingern und Höhenschwankung. Sturzflug, sobald der waagerechte Abstand kleiner als 1,25 × (Shahed) bzw. 0,9 × (Geran-5) die Höhe über dem Ziel ist; Sturzgeschwindigkeit 72 bzw. 150 m/s. Bei Erreichen: Einschlag, Rauchsäule, Stadtschaden.
- **Quadcopter:** Anflug auf einen Kreis um die Stellung (Radius 30–65 m, Höhe Dach + 14…32 m), kreisen 5–10 s mit Blick zum Spieler, dann Überflug in Dach + 17 m mit Vorhalt auf die Spielerbewegung und **Granatenabwurf** (2 Granaten). Danach zurück auf den Kreis; ohne Granaten Abflug und Verschwinden nach 1.200 m.
- **FPV:** Anflug in Zickzack bis etwa 140 m, dann **Endanflug** auf den Spieler mit 37 m/s und abnehmendem Ausweichen; Treffer unter 2,3 m. Verfehlt sie, folgt ein neuer Anlauf.
- **Lastdrohne:** fliegt 38 m über ein Ziel (50 % die Stellung, sonst ein Ziel im Umkreis von 450 m), wirft eine **Bombe** ab und fliegt davon.

### 13.4 Abschuss
- Kleine Drohnen fallen trudelnd mit Rauchspur, ihre Rotoren verschwinden.
- Große Drohnen: Treffer im vorderen Bereich (mehr als 30 % des Radius vor der Mitte) lösen mit 40 % Wahrscheinlichkeit den **Gefechtskopf** aus: sofortige Explosion in der Luft, 1,5-fache Punkte.
- Abstürzende Drohnen explodieren am Boden; Trümmer verletzen in der Nähe.
- Abwurfmunition explodiert beim Aufschlag; Bomben auf der Stadt kosten Stadtschutz und hinterlassen eine Rauchsäule.

---

## 14. Bodengegner

### 14.1 Typen (`DT`, `ground: true`)
| Typ | Anzeige | Treffer | Geschw. | Punkte | Bewaffnung | Kampfentfernung |
|---|---|---|---|---|---|---|
| soldier | Feindliche Infanterie | 3 | 3,2 m/s | 80 | Gewehr, Feuerstöße 2–4, 4–7 Schaden | 28–60 m |
| assault | Sturmsoldat (leichtes MG) | 7 | 2,7 m/s | 170 | LMG, Feuerstöße 4–7, 6–9 Schaden, Treffer × 1,4 | 30–65 m |
| commander | Kommandant mit Schild | 5 + Schild 20 | 3,0 m/s | 280 | Pistole, 4–6 Schaden, Handgranaten | 16–30 m |
| tank | Kampfpanzer | 200 + 100 je Stufe über 1 | 4 m/s (+0,3 je Stufe) | 1.200 × Stufe | Kanone (55 × (1 + 0,15·(Stufe − 1)), Radius 8 m) und Koax-MG | Halt bei 55 m |

### 14.2 Regeln
- **Sichtlinie:** Alle 0,2 s Prüfung Auge → Spieler gegen Hauswände (`segBlock`). Ohne Sichtlinie keine Markierung, keine Aufschaltung, kein Feuer (der Panzer bleibt im HUD sichtbar).
- **Treffer der Gegner** sind Wahrscheinlichkeiten: Basis `0,3 − 0,003·Entfernung` (5–30 %), + 2 % je Welle, × Waffenfaktor; Bewegung (bis −40 %), Ducken (−45 %) und Dachposition (−40 %) senken sie. Jeder Schuss erzeugt sichtbare feindliche Leuchtspur.
- **Kommandant:** Das Schild deckt Treffer von vorn (Winkel cos > 0,45) bei einem Schusswinkel von oben unter 40°. Schild zerstörbar (20 Treffer). Handgranate alle 7–11 s auf 8–32 m, nur wenn der Spieler auf Straßenhöhe steht und nicht in der Drohne ist; Wurfbahn ballistisch mit Streuung, prallt von Wänden ab.
- **Kampfpanzer:** Panzerung 0,12 (Gewehrtreffer wirken mit 12 %), Javelin wirkt voll. Turm dreht 0,6 rad/s (+0,1 je Stufe), Kanone alle max(3,5 s; 7 − 0,8 × Stufe) bis 140 m, Koax-MG bis 90 m. Granaten treffen Wände, Boden oder den Spieler und töten Infanterie im Umkreis von 4 m. Zerstört: Wrack mit verschobenem Turm, Rauchsäule, große Meldung. Lebensleiste oben im HUD.
- Über Infanterie stehen Klassenname, Lebens- und Schildbalken.
- Gefallene Soldaten kippen um und verschwinden nach 12 s, Wracks nach 60 s.

### 14.3 Wegfindung
- Abstandsfeld (Flow Field) auf einem 2-m-Raster über 224 × 224 m, zwei Ebenen: Infanterie (Freiraum 0,6 m, beachtet Möblierung) und Panzer (2,8 m, walzt Möblierung).
- **Ziele**, solange der Spieler auf dem Dach ist: Plätze 16–55 m vom Haus mit freier Sicht auf die Dachkante, bevorzugt mit Sicht auf die aktuelle Spielerposition. Auf der Straße: freie Zellen rund um den Spieler.
- Neuberechnung alle 0,5 s (Breitensuche, 8 Nachbarn, keine Abkürzung über Hausecken).
- Infanterie weicht einander aus; Panzer fahren nur, wenn die Richtung passt.
- Erscheinen auf einem Ring 82–102 m (Panzer 78–98 m), auf der Straße mindestens 35 m vom Spieler entfernt.

---

## 15. Wellen, Punkte, Spielende

### 15.1 Wellenaufbau (`waveDef`)
**Drohnenabwehr**, Dauer 20 + 5·n s:
| Typ | Anzahl in Welle n |
|---|---|
| quad | 2 + n |
| shahed | 1 + ⌊0,9·n⌋ (+ Schwärme) |
| fpv | ⌊0,7·n⌋ ab Welle 2 |
| heavy | ⌊n/2⌋ ab Welle 2 |
| geran5 | ⌊(n − 1)/2⌋ ab Welle 3 |

**Bodenkampf**, Dauer 14 + 3·n s: insgesamt min(3 + n; 14) Infanteristen, davon min(5; max(1; ⌊(n − 1)/2⌋)) Sturmsoldaten und min(3; max(1; 1 + ⌊(n − 4)/4⌋)) Kommandanten, also ab Welle 1 je mindestens einer. In jeder 5. Welle ein Kampfpanzer der Stufe n/5.

### 15.2 Ablauf
- Welle startet mit großer Meldung und Sirene; neue Gegnertypen werden beim ersten Auftreten gemeldet (beim Kommandanten mit Hinweis auf das Schild).
- Welle endet, wenn die Warteschlange leer ist und kein Gegner mehr lebt; 9 s Pause mit Bonus und Munitionsnachschub.

### 15.3 Punkte
- Grundwert des Typs × Panzerstufe.
- × 1,5 bei Gefechtskopf-Treffer, × 1,3 bei mehr als 300 m Entfernung.
- **Kette:** Abschüsse innerhalb von 4,5 s erhöhen den Multiplikator bis × 5.
- Abschussliste rechts mit Entfernung, Punkte schweben über dem Ziel.

### 15.4 Spielende
| Bedingung | Titel |
|---|---|
| Gesundheit 0 (Soldat) | GEFALLEN |
| Stadtschutz 0 % (nur Drohnenabwehr) | STADT NICHT GEHALTEN |
| Drohne zerstört im Pilotenmodus (5.4) | DROHNE ZERSTÖRT |

Ein Spielende während eines Drohneneinsatzes vom Tisch beendet zuerst den Einsatz.

---

## 16. Schadensquellen

| Quelle | Schaden | Reichweite |
|---|---|---|
| FPV-Treffer | 58 | < 2,3 m |
| FPV-Aufschlag am Boden | bis 40 | 7 m |
| Granatenabwurf (Quad) / Handgranate | bis 55 (Ducken × 0,7) | 7 m |
| Bombenabwurf (Lastdrohne) | bis 85 (Ducken × 0,7) | 13 m |
| Einschlag Shahed/Geran | bis 70 | 40 m |
| Gefechtskopf in der Luft | bis 55 | 30 m |
| Trümmer großer / kleiner Drohnen | bis 45 / 20 | 18 / 6 m |
| Eigener Javelin-Flugkörper | bis 60 | 10 m |
| Infanteriefeuer | 4–9 je Treffer | Wahrscheinlichkeit |
| Panzergranate | bis 55 × Stufenfaktor (Ducken × 0,7) | 8 m |
| Drohne: Kollision | (v − 11) × 2,4 | ab 11 m/s |
| Drohne: Rammen | 14 / 38 | r + 1,3 m |

Jeder Treffer zeigt eine Meldung mit Ursache, einen roten Richtungsbogen um die Bildmitte und eine rote Bildeinfärbung. Unter 35 Gesundheit bleibt der Rand rot.

---

## 17. HUD

Gezeichnet auf einem 2D-Canvas über dem 3D-Bild (Pixelverhältnis bis 2).

| Bereich | Inhalt |
|---|---|
| Oben links | Stadt, Uhrzeit, Welle, Punktestand (7-stellig), Kette mit Zeitbalken, Status der Abfangdrohne |
| Oben Mitte | Kompassband ±60° mit Himmelsrichtungen, Wahrzeichen-Namen, Gegnerdreiecken, Kursanzeige |
| Oben rechts | Stadtschutz mit Balken bzw. „BODENKAMPF · DACH/STRASSE/AUFZUG“, Kontakte und erwartete Gegner, Abschüsse und Trefferquote |
| Oben Mitte (Bodenkampf) | Lebensleiste des Kampfpanzers |
| Unten links | Radar (1,5 km bzw. 150 m) mit Sichtkegel, Kreisbalken, Schutzzielen, Gegnern, Flugkörpern, Abwurfmunition; darüber Gesundheit bzw. Drohnenzustand |
| Unten rechts | Waffe, Kaliber, Magazin/Reserve, Feuerart, Zustand des Feuerleitsystems bzw. Suchkopfs, Rohrbündel-Drehzahl (MG6); in der Drohne Munition, Reichweite oder Akku |
| Bildmitte | Fadenkreuz (dynamisch nach Streuung), Optik, Zielgerät oder Drohnen-OSD, Treffermarker (rot bei Abschuss) |
| Im Bild | Gegnermarkierungen mit Typ und Entfernung, Namensschilder, Pfeile am Rand für Gefahren außerhalb des Blickfelds, Warnungen (FPV-Endanflug, Granate, Bombe) |
| Mitte | große Wellenmeldungen, bis zu 5 Textmeldungen |
| Rechts | Abschussliste |
| Unten Mitte | Interaktionshinweise: Waffentisch, Aufzug, Lafette, Munitionskiste, Nachladen, Lafette verlassen, Grenze des Einsatzgebiets |
| Vollbild | Abblende während der Aufzugfahrt |

---

## 18. Grafik und Effekte

- **Himmel:** ein Shader für Verlauf, Horizontglühen, Sonne, Mond, Sterne und animierte fBm-Wolken. Der Himmelswert ist auf 1 begrenzt; nur Sonnen- und Mondscheibe dürfen heller sein (für Bloom).
- **Partikel:** zwei instanzierte Billboard-Systeme (additiv 1.600, normal 1.400) mit 2×2-Atlas (Feuer, Rauch, Glut, Blitz), Nebel im Shader, Farb- und Größenverlauf.
- **Explosionen:** Feuerbälle, Blitz, Funken mit Schwerkraft, Rauch, Bodenstaub, Punktlicht (3er-Pool), Kamerawackeln, Schall mit Laufzeit.
- **Rauchsäulen** nach Einschlägen (max. 10, 110 s), mit Glut am Fuß in den ersten 40 s.
- **Leuchtspur:** gestreckte Zylinder, Breite wächst mit der Entfernung.
- **Flak in der Ferne** als Atmosphäre: Feuerstöße aus 3–5 Stellungen mit orangen Leuchtspurstrichen und dumpfem Grollen.
- **Suchscheinwerfer:** additive Kegel, die langsam schwenken.
- **Dampf** über den Leipziger Kühltürmen.
- **Leuchtpunkte** (Laternen, Positionslichter, Eiffelturm-Beleuchtung) als instanzierte Billboards mit Größen- und Nebelabschwächung.
- **Wasser:** glattes Material mit animierter Normalkarte und Umgebungsreflexion.
- **Bäume:** instanzierte, leicht verformte Ikosaeder mit Farbvariation.

---

## 19. Audio

Alle Klänge werden zur Laufzeit synthetisiert (Web Audio, keine Dateien).

- Ausgabe über `THREE.AudioListener` an der Kamera, Kompressor, Hall (3,2 s Impulsantwort).
- **Ortung einfacher Klänge** (`spatial`): Stereo-Panorama, Abschwächung über Entfernung, Tiefpass mit wachsender Entfernung, **Schallverzögerung mit 343 m/s**.
- **Drohnen** mit `PositionalAudio`: Shahed als knatternder Mopedmotor, Geran-5 als Strahlrauschen mit Pfeifton, Quadcopter/FPV/Lastdrohne als Rotorschwirren in unterschiedlicher Tonhöhe, Panzer als Diesel mit Kettenrasseln.
- Weitere Klänge: Schüsse (5,56 mm, AR-15), MG6-Salve und Motor, Klicken, Magazin raus/rein, Verschluss, Hülsenklirren, Treffer- und Abschusston, Explosion nah/fern, Sirene beim Wellenstart, Abwurfpfeifen, Signaltöne, Javelin-Ausstoß und Marschtriebwerk, Javelin-Suchkopfton, Wind.
- M schaltet den Ton stumm.

---

## 20. Steuerung

### 20.1 Soldat
| Eingabe | Wirkung |
|---|---|
| Maus | Zielen |
| Linke Maustaste | Feuer (halten) |
| Leertaste | Feuer (halten), wie linke Maustaste; für Touchpads, damit Zielen per Zwei-Finger-Klick gleichzeitig möglich ist |
| Rechte Maustaste | Visier / Optik / Zielgerät |
| W A S D, Shift | Bewegen, Laufen |
| C oder Strg | Ducken |
| R | Nachladen |
| E | Waffentisch, Aufzug, Lafette, Munitionskiste (in dieser Reihenfolge) |
| X | Lafette verlassen |
| 1 / 2 / 3 / 4 | HK416 / AR-15 / MG6 / Javelin |
| B | Feuerart; bei der Javelin Sichtfeld 4×/9× |
| F | Feuerleitsystem ein/aus |
| V | Feuerleitsystem wechseln (SMASH ↔ Arbel) |
| Q | Ziel wechseln (SMASH bzw. Javelin) |
| Esc / P | Pause |
| M | Ton an/aus |

### 20.2 Abfangdrohne
| Eingabe | Wirkung |
|---|---|
| Maus | Flugrichtung |
| W / S, A / D | vor/zurück, seitwärts |
| Leertaste / C oder Strg | steigen / sinken |
| Shift (mit W) | Boost |
| Linke Maustaste | manuelles Feuer |
| Rechte Maustaste | Zoom |
| F | Auto-Feuer ein/aus |
| V | Verfolger- / FPV-Kamera |
| X | Drohne zurückrufen |
| Esc / P, M | Pause, Ton |

---

## 21. Persistenz

`localStorage`; jeder Zugriff ist in `try/catch` gekapselt, das Spiel läuft auch ohne Speicher.

| Schlüssel | Inhalt |
|---|---|
| `dab_prefs` | `{ scen, mode, weapon, play, gm }` |
| `dab_hi_<stadt>` | Rekord Drohnenabwehr |
| `dab_hi_<stadt>_land` | Rekord Bodenkampf |
| `dab_hi_<stadt>_drone` (+ `_land`) | Rekord im Pilotenmodus (5.4) |

---

## 22. Test- und Diagnosezugang

`window.DAB` stellt Zustand und Funktionen in der Browser-Konsole bereit: `G`, `P`, `RT`, `AMMO`, `VM`, `DR`, `J`, `UAV`, `FF`, `world`, `scene`, `camera`, `drones`, `missiles`, `eShots`, `shells`, `spawnDrone`, `spawnEnemy`, `killDrone`, `explode`, `requestWeapon`, `startLift`, `segBlock`, `walkBlocked`, `bloomPass`, `renderer`, `tick` und weitere.

- `DAB.run(sekunden, dt = 1/60)` simuliert Bilder ohne Darstellung und zeichnet am Ende einmal. Damit lassen sich Abläufe auch in einem verdeckten Browser-Tab testen, in dem `requestAnimationFrame` ruht.
- `DAB.tick(dt, true)` rechnet einen Schritt ohne Zeichnen.

Beispiel: Quadcopter 90 m vor die Kamera setzen und 2 s simulieren:
```js
const d = DAB.spawnDrone('quad'); d.pos.copy(DAB.camera.position).add(new DAB.THREE.Vector3(0, 10, -90));
d.state = 'orbit'; d.loiter = 99; DAB.run(2);
```

---

## 23. Qualitäts- und Robustheitsregeln

Diese Regeln stammen aus behobenen Fehlern und sind bei Änderungen einzuhalten.

- **R1** Keine `GL_POINTS`/Point-Sprites. Manche Treiber (ANGLE/D3D) zeichnen Punkte hinter der Kamera gespiegelt in den Himmel. Leuchtpunkte sind instanzierte Billboards; Instanzen mit Tiefe unter 1 m werden im Vertex-Shader verworfen.
- **R2** `smoothstep(a, b, x)` nur mit `a < b`; umgekehrte Grenzen sind in GLSL undefiniert. Stattdessen `1.0 - smoothstep(b, a, x)`.
- **R3** Leuchtende Shader schützen ihre Ausgabe gegen NaN (`col == col`) und begrenzen sie. Der Bloom-Hochpass filtert zusätzlich NaN und begrenzt auf 10. Sonst bläst Bloom einzelne Pixel zu quadratischen Blöcken auf.
- **R4** Varyings, die an Dreieckskanten mit MSAA hochgerechnet werden (etwa die Längskoordinate der Suchscheinwerfer-Kegel), im Fragment-Shader auf ihren gültigen Bereich begrenzen.
- **R5** Der Himmel bleibt unter der Bloom-Schwelle; nur Sonne und Mond dürfen leuchten.
- **R6** Stadtgeometrie wird pro Material gebündelt; Kleinobjekte sind instanziert. Neue Objekte in großer Zahl ebenso umsetzen.
- **R7** Pixelverhältnis höchstens 1,25; Schattenkarte 2048 nur im Nahbereich der Kamera.
- **R8** Pro Bild höchstens 50 ms Simulationsschritt (`dt`-Begrenzung).
- **R9** Kollision gegen Gebäude: Für die Drohne genügt die Höhenkarte; für Infanterie, Spieler auf der Straße und Geschosse die genauen Grundrisse in `world.blds`.
- **R10** Zufall in der Stadt kommt aus dem Startwert des Szenarios (`rng(seed)`), damit jede Stadt bei jedem Laden gleich aussieht. Gauben nutzen eine positionsabhängige Pseudozufallszahl (`r01`).

---

## 24. Abnahmekriterien

Prüfbar im Browser (bei verdecktem Tab mit `DAB.run`).

**Allgemein**
- [ ] Datei lädt ohne Konsolenfehler; Menü zeigt vier Abschnitte und drei Skylines.
- [ ] Jede Kombination aus Modus, Stadt, System und Waffe baut ohne Fehlermeldung auf.
- [ ] Neuer Einsatz nach Spielende baut die Stadt neu auf und setzt alle Werte zurück.
- [ ] Keine hellen Quadrate oder Blöcke am Himmel in allen drei Städten.

**Städte**
- [ ] Paris: Eiffelturm als Silhouette vor der Abendsonne in der Startblickrichtung.
- [ ] Leipzig: City-Hochhaus und Neues Rathaus im Blick, Kühltürme mit Dampf am Horizont.
- [ ] Lübeck: Holstentor in der Bildmitte, Kirchtürme dahinter, nicht von Nachbarhäusern verdeckt.

**Waffen und Feuerleitung**
- [ ] SMASH: Mit Visier wird ein Quadcopter in 0,35 s aufgeschaltet; ein Schuss auf den Haltepunkt trifft.
- [ ] Arbel: Bei absichtlich ungenauem Dauerfeuer werden die meisten Schüsse gesperrt; gesperrte Schüsse kosten keine Munition.
- [ ] MG6: Feuer erst nach dem Anlaufen, an der nächsten Lafette; X kehrt zurück.
- [ ] Javelin: ohne Aufschaltung kein Start; aufgeschaltetes Ziel wird getroffen; nächster Flugkörper 5 s nach dem Schuss.

**Gegner und Wellen**
- [ ] Welle 1 Drohnenabwehr: 3 Quadcopter und 1 Shahed (plus möglicher Schwarm).
- [ ] Shahed-Einschlag senkt den Stadtschutz um 7 % und hinterlässt eine Rauchsäule.
- [ ] Quadcopter werfen Granaten über der Stellung ab.
- [ ] Bodenkampf: Welle 1 enthält je mindestens einen Sturmsoldaten und Kommandanten; Welle 5 einen Kampfpanzer.
- [ ] Schild des Kommandanten hält frontale Treffer; von der Seite oder steil von oben trifft man.
- [ ] Gegner hinter Hauswänden werden nicht markiert und schießen nicht.

**Abfangdrohne**
- [ ] Start am Waffentisch mit E; 200 Schuss; Grenze bei 500 m.
- [ ] Auto-Feuer gibt nur treffende Schüsse frei; der Turm folgt dem Ziel bis 9°.
- [ ] X ruft zurück, Restmunition bleibt; nach Verschießen 2:50 min gesperrt.
- [ ] Zerstörung der Drohne beendet das Spiel nicht.

**Ablauf**
- [ ] Esc pausiert, Klick setzt fort; Spielende zeigt die Auswertung und speichert einen neuen Rekord.

---

## 25. Bekannte Einschränkungen und offene Punkte

1. **Pilotenmodus ohne Menüeintrag:** `G.play = 'drone'` wird aus `dab_prefs` übernommen, im Menü aber nicht mehr angeboten. Wer einen alten Eintrag gespeichert hat, startet im Pilotenmodus und kann ihn im Menü nicht abwählen. Abhilfe: `play` beim Laden nur noch als `'ground'` übernehmen oder den Modus wieder ins Menü aufnehmen.
2. **Netzabhängigkeit:** Ohne Internet startet das Spiel nicht (Three.js über CDN).
3. **Luftgegner ignorieren Gebäude:** Shahed, Geran und Quadcopter fliegen durch Häuser; nur Einschlag und Absturz prüfen den Boden.
4. **Grobe Kollision der Wahrzeichen** für die Drohne: Kreis mit 80 % der Höhe, der Eiffelturm wirkt dadurch wie ein massiver Block.
5. **Gegnerfeuer per Wahrscheinlichkeit:** Feindliche Geschosse sind Darstellung; ob sie treffen, entscheidet der Zufall beim Abfeuern, nicht die Flugbahn.
6. **Kein Mündungsgeschwindigkeitsanteil der Drohne:** Geschosse der Abfangdrohne erben deren Geschwindigkeit nicht; das hält Vorhalt und Arbel-Prüfung einfach.
7. **Keine Touch- und Gamepad-Steuerung**, keine Einstellungen für Empfindlichkeit, Grafikqualität oder Lautstärke.
8. **Leistung** auf schwacher Hardware nicht gemessen; die Stadt hat einige hunderttausend Eckpunkte.
9. **Javelin-Angriffsprofil:** nur Direktangriff (DIR); der Top-Attack-Modus (TOP) wird angezeigt, ist aber nicht umgesetzt.
10. **Eigenes Haus** ist für die Drohne nur bis zur Dachfläche kollidierbar, nicht bis zur Brüstung.

