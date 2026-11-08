# Glossar – Drohnenabwehr

Erklärungen zu Namen aus dem Quelltext und Fachbegriffen der [SPEC](SPEC.md).

## Namen aus dem Quelltext
| Name | Bedeutung |
|---|---|
| `G` | Spielzustand: Zustand (Menü, Spiel, Pause …), Modus, Welle, Punkte, Stadtschutz, Meldungen |
| `P` | Spieler: Position, Blickrichtung, Gesundheit, Ducken, Lafette |
| `RT` | Laufzeitwerte der Waffe: Feuerpause, Nachladen, Waffenwechsel, Rückstoß, MG6-Drehzahl |
| `AMMO` | Munition je Waffe (Magazin und Reserve) |
| `VM` | Viewmodel (Waffenmodell vor der Kamera): Zielen, Schwanken, Rückstoß, Mündungsfeuer |
| `SCEN` | Szenarien: Daten der drei Einsatzorte |
| `WEAP` | Waffentabelle: Werte von HK416, AR-15, MG6 und Javelin |
| `JAV` | Werte der Javelin: Aufschaltung, Flug, Zünder |
| `J` | Laufzeitzustand des Javelin-Suchkopfs (aufgeschaltetes Ziel, Kühlung, Zoom) |
| `FCS` | Fire Control System (Feuerleitsystem): Smart Shooter und Arbel |
| `DT` | Drone Types (Gegnertypen): alle Luft- und Bodengegner mit ihren Werten |
| `drones` | Liste aller lebenden Gegner (Luft und Boden) |
| `DR` | Zustand der Abfangdrohne: Position, Geschwindigkeit, Munition, Akku, Kamera |
| `DRW` | Werte des Bord-MGs der Abfangdrohne |
| `UAV` | Grenzen des Drohneneinsatzes vom Waffentisch (Munition, Reichweite, Sperrzeit) |
| `HM` | Höhenkarte der Stadt für die Kollision der Drohne |
| `FF` | Flow Field (Abstandsfeld) für die Wegfindung der Bodengegner |
| `LAND` | Werte des Bodenkampfs (Bewegungsradius, Aufzugdauer) |
| `world` | alles zum aufgebauten Level: Gebäude, Ziele, Lafetten, Waffentisch, Landeplatz |
| `world.blds` | genaue Hausgrundrisse in Spielernähe für Kollision und Sichtlinien |
| `buildLevel` | baut Stadt, Wahrzeichen und Stellung für einen Einsatzort auf |
| `prepareRun` | setzt alle Werte für einen neuen Einsatz zurück |
| `updateDrones` | bewegt in jedem Bild alle Luftgegner und die Abwurfmunition |
| `updateGround` | steuert in jedem Bild einen Bodengegner: sehen, laufen, zielen, schießen |
| `updatePlayerDrone` | Flugmodell, Kollision und Auto-Feuer der Abfangdrohne |
| `arbelPredict` | prüft, ob ein bestimmter Schuss ein Ziel treffen kann (Arbel, Auto-Feuer) |
| `solveIntercept` | berechnet den Haltepunkt mit Vorhalt und Geschossfall (Smart Shooter, Drohnenturm) |
| `segBlock` | prüft, ob eine Strecke eine Hauswand schneidet (Geschosse, Sichtlinie) |
| `playerPoint` | Punkt, auf den Gegner zielen: Spieler oder fliegende Drohne |
| `DAB` | Diagnosezugang in der Browser-Konsole |

## Fachbegriffe
| Begriff | Bedeutung |
|---|---|
| ADS | Aim Down Sights (über Visier zielen), rechte Maustaste |
| Arbel | Feuerleitsystem, das bei gehaltenem Abzug nur treffende Schüsse freigibt |
| Bloom | Leuchteffekt um sehr helle Bildstellen |
| CLU | Command Launch Unit (Zielgerät der Javelin) |
| FOV | Field of View (Sichtfeld in Grad); kleiner = stärker vergrößert |
| FPV | First Person View (Sicht aus der Drohne); auch Name der Kamikazedrohne |
| Haltepunkt | Stelle, auf die man zielen muss, damit das Geschoss das bewegte Ziel trifft |
| Lafette | Gestell, auf dem das MG6 steht |
| Leuchtspur | sichtbar leuchtendes Geschoss, zeigt die Flugbahn |
| MSAA | Kantenglättung des Bildes |
| NaN | „Not a Number“ (ungültiger Rechenwert), erzeugt Bildfehler |
| Pointer Lock | Mausfang: der Mauszeiger verschwindet, die Maus steuert die Blickrichtung |
| SMASH | Smart Shooter, Feuerleitsystem mit KI-Zielerkennung und Haltepunkt |
| Vorhalt | Abstand, um den man vor ein bewegtes Ziel zielt |
| v0 | Mündungsgeschwindigkeit des Geschosses |
| Viewmodel | das Waffenmodell, das man vor sich in der Hand sieht |
