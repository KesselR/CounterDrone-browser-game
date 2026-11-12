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

// Jeder Einsatz in frisch geladener Seite, weil DAB.start nicht von Boden- auf Drohnenmodus umschaltet
const mission = async (play, steps) => {
  await load();
  await start(play);
  const t0 = await time();
  await run(1);
  check(await state() === 'play', `${play}: Einsatz läuft nach dem Start`);
  check(await time() > t0, `${play}: Spielzeit schreitet voran`);
  await steps?.();
  check((await errEl()).trim() === '', `${play}: #err ist leer`);
};

try {
  await mission('ground', async () => {
    await page.keyboard.press('KeyP');
    await run(0.03);
    check(await state() === 'pause', 'ground: P pausiert');
    const tPause = await time();
    await run(1);
    check(await time() === tPause, 'ground: Spielzeit steht in der Pause');
  });
  await mission('drone');
  check(errors.length === 0, 'keine Konsolenfehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
} catch (e) {
  check(false, 'Test abgebrochen: ' + e.message.split('\n')[0]);
  if (errors.length) console.log('Fehler der Seite: ' + errors.join(' | '));
} finally {
  await browser.close();
}
process.exit(fails ? 1 : 0);
