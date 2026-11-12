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
const page = await browser.newPage({ viewport: DEFAULT_VIEWPORT });
page.setDefaultTimeout(20000);
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => m.type() === 'error' && errors.push(m.text()));

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
  check(errors.length === 0, 'keine Konsolenfehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
} catch (e) {
  check(false, 'Test abgebrochen: ' + e.message.split('\n')[0]);
  if (errors.length) console.log('Fehler der Seite: ' + errors.join(' | '));
} finally {
  await browser.close();
}
process.exit(fails ? 1 : 0);
