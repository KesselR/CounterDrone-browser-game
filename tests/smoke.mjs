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
const page = await browser.newPage();
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
};
const start = play => page.evaluate(async play => {
  DAB.G.play = play;
  await DAB.start({ scen: 'paris', gm: 'air', weapon: 'hk416', mode: 'smash' });
}, play);
const state = () => page.evaluate(() => DAB.G.state);
const time = () => page.evaluate(() => DAB.G.time);
const run = seconds => page.evaluate(s => DAB.run(s), seconds);
const errEl = () => page.textContent('#err');
const press = async code => { await page.keyboard.press(code); await run(0.03); };
const setState = async s => { await page.evaluate(s => { DAB.G.state = s; }, s); await run(0.1); };

// Hilfe-Overlay (Issue #5): Sichtbarkeit und Tastenliste über das DOM
const helpVisible = () => page.evaluate(() => {
  const el = document.getElementById('help');
  return !!el && !el.classList.contains('hidden');
});
const keyTexts = selector => page.evaluate(sel => [...document.querySelectorAll(sel + ' > div')]
  .map(d => d.textContent.replace(' (im Einsatz)', '')), selector);

// Jeder Einsatz in frisch geladener Seite, weil DAB.start nicht von Boden- auf Drohnenmodus umschaltet
const mission = async (play, { menu, steps } = {}) => {
  await load();
  await menu?.();
  await start(play);
  const t0 = await time();
  await run(1);
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
      check(!await helpVisible(), 'Hilfe: Overlay ist beim Einsatzstart ausgeblendet');
      await press('KeyH');
      check(await helpVisible(), 'Hilfe: H blendet das Overlay ein');
      const t = await time();
      await run(1);
      check(await state() === 'play' && await time() > t, 'Hilfe: Spiel läuft beim Einblenden weiter');
      const menuKeys = await keyTexts('#menuKeys');
      const helpKeys = await keyTexts('#helpKeys');
      check(menuKeys.length > 5 && JSON.stringify(menuKeys) === JSON.stringify(helpKeys), 'Hilfe: Startmenü und Overlay zeigen dieselbe Tastenliste');
      await press('KeyH');
      check(!await helpVisible(), 'Hilfe: erneutes H blendet das Overlay aus');

      await press('KeyP');
      check(await state() === 'pause', 'ground: P pausiert');
      const tPause = await time();
      await run(1);
      check(await time() === tPause, 'ground: Spielzeit steht in der Pause');

      await press('KeyH');
      check(await helpVisible(), 'Hilfe: H blendet das Overlay in der Pause ein');
      await press('KeyH');
      check(!await helpVisible() && await state() === 'pause', 'Hilfe: H schließt das Overlay in der Pause');
      await press('KeyH');
      await page.click('#btnResume');
      await run(0.03);
      check(await state() === 'play' && await helpVisible(), 'Hilfe: Overlay bleibt nach dem Fortsetzen sichtbar');

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
