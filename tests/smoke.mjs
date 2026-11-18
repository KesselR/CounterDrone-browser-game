// Rauchtest: lädt index.html per file:// in Chrome und prüft Grundfunktionen.
// Aufruf: npm test; mit npm test <Pfad> prüft er eine andere index.html (etwa eine absichtlich kaputte Kopie).
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const file = process.argv[2] ? resolve(process.argv[2]) : resolve(import.meta.dirname, '../index.html');
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const DEFAULT_VIEWPORT = { width: 640, height: 360 }; // klein, weil Chrome in Software rendert
const errors = [];
// Neue Seite; der Touch-Durchlauf nutzt eine eigene mit emuliertem Smartphone
const newPage = async (opts = {}) => {
  const p = await browser.newPage({ viewport: DEFAULT_VIEWPORT, ...opts });
  p.setDefaultTimeout(20000);
  p.on('pageerror', e => errors.push(String(e)));
  p.on('console', m => m.type() === 'error' && errors.push(m.text()));
  return p;
};
let page = await newPage();

let fails = 0;
const check = (cond, msg) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + msg);
  if (!cond) fails++;
};

const load = async () => {
  await page.goto(pathToFileURL(file).href);
  await page.waitForFunction(() => window.DAB, null, { timeout: 60000 });
  // Die Spielschleife steht still; die Zeit läuft nur über DAB.run. Sonst rendert sie dauernd in Software und bremst alles.
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
};
const start = play => page.evaluate(async play => {
  DAB.G.play = play;
  await DAB.start({ scen: 'paris', gm: 'air', weapon: 'hk416', mode: 'smash' });
}, play);
const state = () => page.evaluate(() => DAB.G.state);
const time = () => page.evaluate(() => DAB.G.time);
const run = seconds => page.evaluate(s => DAB.run(s), seconds);
const errEl = () => page.textContent('#err');
const press = code => page.keyboard.press(code);
const setState = async s => { await page.evaluate(s => { DAB.G.state = s; }, s); await run(0.1); };

// Hilfe-Overlay (Issue #5): Sichtbarkeit und Tastenliste über das DOM
const helpVisible = () => page.evaluate(() => {
  const el = document.getElementById('help');
  return !!el && !el.classList.contains('hidden');
});
const overlayBox = () => page.evaluate(() => {
  const el = document.getElementById('help');
  const r = el.getBoundingClientRect();
  const overflowY = getComputedStyle(el).overflowY;
  return { top: r.top, bottom: r.bottom, fits: el.scrollHeight <= el.clientHeight, scrollable: overflowY === 'auto' || overflowY === 'scroll' };
});
const keyTexts =selector => page.evaluate(sel => [...document.querySelectorAll(sel + ' > div')]
  .map(d => d.textContent.replace(' (im Einsatz)', '')), selector);

// Jeder Einsatz in frisch geladener Seite, weil DAB.start nicht von Boden- auf Drohnenmodus umschaltet
const mission = async (play, { menu, steps } = {}) => {
  await load();
  await menu?.();
  await start(play);
  const t0 = await time();
  await run(0.2);
  check(await state() === 'play', `${play}: Einsatz läuft nach dem Start`);
  check(await time() > t0, `${play}: Spielzeit schreitet voran`);
  await steps?.();
  check((await errEl()).trim() === '', `${play}: #err ist leer`);
};

try {
  await mission('ground', {
    menu: async () => {
      await press('KeyH');
      check(!await helpVisible(), 'Hilfe: H im Startmenü zeigt kein Overlay');
    },
    steps: async () => {
      // Abfangdrohne vom Waffentisch: Leertaste gehalten, Drohne per X zurückrufen, kein Dauerfeuer am Boden
      await page.evaluate(() => DAB.startUav());
      await run(0.5);
      check(await page.evaluate(() => DAB.G.uav === true), 'Abfangdrohne: startet vom Waffentisch');
      await page.keyboard.down('Space');
      await run(0.5);
      await press('KeyX');
      await run(0.1);
      const shotsAfterRecall = await page.evaluate(() => DAB.G.shots);
      await run(0.4);
      check(await page.evaluate(() => DAB.G.play) === 'ground', 'Abfangdrohne: X ruft die Drohne zurück');
      check(await page.evaluate(s => DAB.G.shots === s, shotsAfterRecall), 'Leertaste: gehaltene Leertaste schießt nach dem Rückruf nicht am Boden');
      await page.keyboard.up('Space');
      await run(0.1);
      const shotsBeforeRepress = await page.evaluate(() => DAB.G.shots);
      await page.keyboard.down('Space');
      await run(0.4);
      await page.keyboard.up('Space');
      check(await page.evaluate(s => DAB.G.shots > s, shotsBeforeRepress), 'Leertaste: nach erneutem Drücken feuert sie wieder am Boden');

      // Leertaste als zweite Feuertaste (Issue #3)
      const shots0 = await page.evaluate(() => DAB.G.shots);
      await page.keyboard.down('Space');
      await run(0.4);
      await page.keyboard.up('Space');
      check(await page.evaluate(s => DAB.G.shots > s, shots0), 'Leertaste: feuert am Boden');
      const shots1 = await page.evaluate(() => DAB.G.shots);
      await run(0.3);
      check(await page.evaluate(s => DAB.G.shots === s, shots1), 'Leertaste: nach dem Loslassen kein Feuer mehr');
      check((await keyTexts('#menuKeys')).some(k => /LEERTASTE/.test(k)), 'Leertaste: Startmenü nennt die Taste');

      // Wechsel Dach ↔ Lafette läuft durchs Treppenhaus
      await press('Digit3');
      await run(0.6);
      check(await page.evaluate(() => DAB.G.lift?.stairs && DAB.P.onMount), 'Treppenhaus: Taste 3 auf dem Dach führt die Treppe hinunter');
      const frozen = () => page.evaluate(() => { const d = DAB.drones.at(-1); return { t: DAB.G.time, x: d.pos.x, y: d.pos.y, z: d.pos.z }; });
      await page.evaluate(() => DAB.spawnDrone('quad'));
      const w0 = await frozen();
      await run(0.5);
      check(JSON.stringify(await frozen()) === JSON.stringify(w0), 'Treppenhaus: Spielzeit und Gegner stehen während der Fahrt still');
      await run(1.9);
      check(await page.evaluate(() => DAB.G.lift?.stairs), 'Treppenhaus: Fahrt dauert nach 3 s noch an');
      await run(0.6);
      check(await page.evaluate(() => !DAB.G.lift && DAB.P.onMount && DAB.G.street), 'Treppenhaus: unten an der Lafette angekommen');
      await run(0.6);
      await press('KeyX');
      await run(3.5);
      check(await page.evaluate(() => !DAB.G.lift && !DAB.P.onMount && DAB.P.pos.y === DAB.world.roofH), 'Treppenhaus: X führt zurück aufs Dach');
      const shotsArrive = await page.evaluate(() => DAB.G.shots);
      await page.keyboard.down('Space');
      await run(0.4);
      check(await page.evaluate(s => DAB.G.shots === s, shotsArrive), 'Treppenhaus: nach der Ankunft 0,5 s kein Feuer');
      await page.keyboard.up('Space');
      await run(0.2);
      await page.evaluate(() => DAB.requestWeapon('mg6'));
      await run(0.5);
      const shotsSkip = await page.evaluate(() => DAB.G.shots);
      await page.keyboard.down('Space');
      await run(0.1);
      check(await page.evaluate(() => !DAB.G.lift && DAB.P.onMount), 'Treppenhaus: Leertaste überspringt die Fahrt');
      await run(1.0);
      check(await page.evaluate(s => DAB.G.shots === s, shotsSkip), 'Treppenhaus: gehaltene Leertaste feuert nach dem Überspringen nicht');
      await page.keyboard.up('Space');
      await press('KeyX');
      await run(0.5);
      await page.mouse.click(320, 180);
      await run(0.1);
      check(await page.evaluate(() => !DAB.G.lift && !DAB.P.onMount), 'Treppenhaus: Klick überspringt die Fahrt');
      // Taste T: Schwarzblende statt Fahrt, gespeichert über das Neuladen (am Ende dieses Einsatzes geprüft)
      await run(0.6);
      await press('KeyT');
      const stairsOff = async label => {
        await page.evaluate(() => DAB.requestWeapon('mg6'));
        await run(0.3);
        const t0 = await time();
        await run(0.4);
        check(await page.evaluate(t => !DAB.G.lift && DAB.P.onMount && DAB.G.time - t < 0.2, t0), label);
      };
      await stairsOff('Treppenhaus: mit T ausgeschaltet nur kurze Schwarzblende, Welt steht dabei still');
      check((await keyTexts('#menuKeys')).some(k => /^T.*Treppenhaus/.test(k)), 'Treppenhaus: Startmenü nennt Taste T');

      check(!await helpVisible(), 'Hilfe: Overlay ist beim Einsatzstart ausgeblendet');
      await press('KeyH');
      check(await helpVisible(), 'Hilfe: H blendet das Overlay ein');
      const t = await time();
      await run(0.2);
      check(await state() === 'play' && await time() > t, 'Hilfe: Spiel läuft beim Einblenden weiter');
      const menuKeys = await keyTexts('#menuKeys');
      const helpKeys = await keyTexts('#helpKeys');
      check(menuKeys.length > 5 && JSON.stringify(menuKeys) === JSON.stringify(helpKeys), 'Hilfe: Startmenü und Overlay zeigen dieselbe Tastenliste');
      await press('KeyH');
      check(!await helpVisible(), 'Hilfe: erneutes H blendet das Overlay aus');

      await press('KeyP');
      check(await state() === 'pause', 'ground: P pausiert');
      const tPause = await time();
      await run(0.2);
      check(await time() === tPause, 'ground: Spielzeit steht in der Pause');

      await press('KeyH');
      check(await helpVisible(), 'Hilfe: H blendet das Overlay in der Pause ein');
      await press('KeyH');
      check(!await helpVisible() && await state() === 'pause', 'Hilfe: H schließt das Overlay in der Pause');
      await press('KeyH');
      await page.click('#btnResume');
      check(await state() === 'play' && await helpVisible(), 'Hilfe: Overlay bleibt nach dem Fortsetzen sichtbar');

      // Kleine Fenster: Overlay bleibt im Viewport, zugänglich und lässt die Pausenbuttons frei
      for (const [w, h] of [[600, 320], [600, 500]]) {
        await page.setViewportSize({ width: w, height: h });
        const play = await overlayBox();
        check(play.top >= 0 && play.bottom <= h, `Hilfe: Overlay passt bei ${w}×${h} in den Viewport`);
        check(play.fits, `Hilfe: alle Einträge bei ${w}×${h} im Einsatz sichtbar (dort lässt sich nicht scrollen)`);
        await press('KeyP');
        const paused = await overlayBox();
        const buttons = await page.evaluate(() => ['btnResume', 'btnMenu1']
          .map(id => document.getElementById(id).getBoundingClientRect())
          .map(r => ({ top: r.top, bottom: r.bottom })));
        check(buttons.every(b => b.top >= 0 && b.bottom <= h), `Hilfe: Pausenbuttons liegen bei ${w}×${h} im Viewport`);
        check(buttons.every(b => b.bottom <= paused.top || b.top >= paused.bottom), `Hilfe: Overlay verdeckt bei ${w}×${h} keine Pausenbuttons`);
        check(paused.top >= 0 && paused.bottom <= h && (paused.scrollable || paused.fits), `Hilfe: Overlay in der Pause bei ${w}×${h} im Viewport und erreichbar`);
        await page.click('#btnResume');
      }
      await page.setViewportSize(DEFAULT_VIEWPORT);

      await setState('over');
      check(!await helpVisible(), 'Hilfe: beim Game-Over erscheint kein Overlay');
      await press('KeyH');
      check(!await helpVisible(), 'Hilfe: H beim Game-Over zeigt kein Overlay');
      await setState('brief');
      await press('KeyH');
      check(!await helpVisible(), 'Hilfe: H im Briefing zeigt kein Overlay');

      await load();
      await start('ground');
      await stairsOff('Treppenhaus: Einstellung von T bleibt nach dem Neuladen erhalten');
    },
  });

  await mission('drone', {
    steps: async () => {
      // In der Drohne bleibt die Leertaste das Steigen
      const y0 = await page.evaluate(() => DAB.DR.pos.y);
      await page.keyboard.down('Space');
      await run(0.6);
      await page.keyboard.up('Space');
      check(await page.evaluate(y => DAB.DR.pos.y > y + 0.5, y0), 'Leertaste: steigt in der Drohne');

      await press('KeyH');
      check(await helpVisible(), 'Hilfe: H blendet das Overlay im Pilotenmodus ein');
      const keys = await keyTexts('#helpKeys');
      check(keys.some(k => /Boost/i.test(k)) && keys.some(k => /FPV/i.test(k)), 'Hilfe: Overlay zeigt die Drohnen-Steuerung');
    },
  });
  // Touch-Steuerung (Issue #14): emuliertes Smartphone im Querformat, Berührungen über das DevTools-Protokoll
  await page.close();
  page = await newPage({ hasTouch: true, isMobile: true });
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, points = []) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y, id = 0]) => ({ x, y, id })) });
  const tap = async (x, y) => { await touch('touchStart', [[x, y]]); await touch('touchEnd'); };
  const touchVisible = () => page.evaluate(() => !document.getElementById('touch').classList.contains('hidden'));
  await mission('ground', {
    steps: async () => {
      await run(0.05);
      check(!await touchVisible(), 'Touch: Bedienfeld vor der ersten Berührung verborgen');
      await tap(480, 150);
      await run(0.05);
      check(await touchVisible(), 'Touch: Bedienfeld erscheint nach der ersten Berührung');
      await press('KeyW');
      await run(0.05);
      check(!await touchVisible(), 'Touch: Tastatureingabe blendet das Bedienfeld aus');
      await tap(480, 150);
      await run(0.05);

      // Stick links: nach oben ziehen läuft vorwärts, Loslassen hält an
      const pos = () => page.evaluate(() => ({ x: DAB.P.pos.x, z: DAB.P.pos.z }));
      const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
      const p0 = await pos();
      await touch('touchStart', [[120, 260, 1]]);
      await touch('touchMove', [[120, 200, 1]]);
      await run(0.6);
      const p1 = await pos();
      check(dist(p0, p1) > 0.5, 'Touch: Stick links bewegt den Spieler');
      await touch('touchEnd');
      await run(0.5);
      const p2 = await pos();
      await run(0.5);
      check(dist(p2, await pos()) < 0.05, 'Touch: Loslassen des Sticks hält den Spieler an');

      // Rechts ziehen dreht den Blick, gleichzeitig mit dem Stick
      const yaw0 = await page.evaluate(() => DAB.P.yaw);
      await touch('touchStart', [[120, 260, 1]]);
      await touch('touchStart', [[120, 260, 1], [480, 180, 2]]);
      await touch('touchMove', [[120, 200, 1], [540, 180, 2]]);
      await run(0.3);
      check(await page.evaluate(y => DAB.P.yaw < y - 0.05, yaw0), 'Touch: Ziehen rechts dreht den Blick nach rechts');
      check(dist(p2, await pos()) > 0.2, 'Touch: Bewegen und Blicken gleichzeitig mit zwei Fingern');
      await touch('touchEnd');
      await run(0.1);

      // Feuerknopf: halten feuert, Ziehen vom Knopf aus zielt zugleich, Loslassen beendet das Feuer
      const center = sel => page.evaluate(sel => { const r = document.querySelector(sel).getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; }, sel);
      const [fx, fy] = await center('#tFire');
      const shots0 = await page.evaluate(() => DAB.G.shots), yaw1 = await page.evaluate(() => DAB.P.yaw);
      await touch('touchStart', [[fx, fy, 3]]);
      await run(0.4);
      check(await page.evaluate(s => DAB.G.shots > s, shots0), 'Touch: Halten des Feuerknopfs feuert');
      await touch('touchMove', [[fx - 40, fy, 3]]);
      await run(0.1);
      check(await page.evaluate(y => DAB.P.yaw > y + 0.05, yaw1), 'Touch: Ziehen vom Feuerknopf aus dreht den Blick');
      await touch('touchEnd');
      await run(0.1);
      const shots1 = await page.evaluate(() => DAB.G.shots);
      await run(0.3);
      check(await page.evaluate(s => DAB.G.shots === s, shots1), 'Touch: nach dem Loslassen kein Feuer mehr');

      // Abfangdrohne wird im Touch-Modus abgelehnt
      await page.evaluate(() => DAB.startUav());
      await run(0.2);
      check(await page.evaluate(() => !DAB.G.uav && DAB.G.play === 'ground'), 'Touch: Abfangdrohne startet im Touch-Modus nicht');
      check(await page.evaluate(() => DAB.G.msgs.some(m => /NUR MIT MAUS UND TASTATUR/.test(m.txt))), 'Touch: Ablehnung der Abfangdrohne wird gemeldet');
    },
  });
  check(errors.length === 0, 'keine Konsolenfehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
} catch (e) {
  check(false, 'Test abgebrochen: ' + e.message.split('\n')[0]);
  if (errors.length) console.log('Fehler der Seite: ' + errors.join(' | '));
} finally {
  await browser.close();
}
process.exit(fails ? 1 : 0);
