import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';
import {
  Bubbles,
  burst,
  CABBAGE,
  drawCard,
  drawRack,
  drawSparks,
  drawStream,
  drawWorkshop,
  FLASK,
  fmt,
  mix,
  mountWorkshop,
  P,
  ramp,
  splash,
  stepSparks,
  TABLE_Y,
  TestTube,
  Vessel,
  type Spark,
} from './_potion-kit';

const meta: Meta = { title: 'canvas-demos/by-casestudies/chemistry-potions/FizzingDragonPotion' };
export default meta;
type Story = StoryObj;

/**
 * **Potion 1 — the Fizzing Dragon Potion.** A flask of pink *Sour Dragon
 * Tears* (vinegar with a splash of red-cabbage juice) and a test tube of
 * milky *Cloud Powder* (baking soda in water). Pour the tube in and the
 * potion **fizzes** — carbon-dioxide bubbles rise, swell and pop, foam climbs
 * the neck — and the colour walks **pink → purple → blue** as the sour is used
 * up. Cabbage juice is a real colour-changing indicator.
 *
 * Try: pour once (1 spoon) and the potion stays pinkish; add more spoons and
 * pour again — the colour keeps walking across the meter. Give it 6 spoons in
 * one go and the foam overflows.
 *
 * **Engine vs story:** the flask liquid is the engine's `liquid-fill`
 * decoration on a `'path'` shape. Bubbles, pops, foam, the tilting tube and
 * the stream are overlay drawing driven by this story's frame callback.
 */
export const FizzingDragonPotionStory: Story = {
  name: 'FizzingDragonPotion',
  render: () => createContainer({ id: 'potion-fizzing-dragon' }),
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#potion-fizzing-dragon')!;
    const lab = await mountWorkshop(container);

    // Chemistry state, in "spoon" units: 1 spoon of baking soda eats 1 unit of sour.
    const params = { spoons: 2, sourness: 4, foaminess: 1 };
    const VINEGAR_AREA = 15000;
    const TUBE_AREA = 3600;
    const SODA = 0xf4f1ea;

    const flask = new Vessel(lab.glassware, { id: 'flask', x: 470, y: TABLE_Y, profile: FLASK });
    const tube = new TestTube({ x: 170, y: 360 }, { x: 434, y: 318 }, TUBE_AREA, SODA, 0.85);
    const bubbles = new Bubbles();
    const sparks: Spark[] = [];

    let sour = 0; // sour units left in the flask
    let unreacted = 0; // baking soda poured in, not yet fizzed
    let extraSoda = 0; // baking soda left over once all the sour is gone
    let gas = 0; // CO₂ made so far (units)
    let foam = 0; // foam "area" above the liquid
    let shownPh = 2.5; // colour lags the chemistry a little — mixing takes time
    let rate = 0; // fizz rate, units/s
    let celebrated = false;

    const reset = (): void => {
      flask.area = VINEGAR_AREA;
      sour = params.sourness;
      unreacted = 0;
      extraSoda = 0;
      gas = 0;
      foam = 0;
      shownPh = 2.5;
      celebrated = false;
      bubbles.clear();
      sparks.length = 0;
      tube.reset(TUBE_AREA, SODA, 0.85);
    };
    reset();

    /** pH the colour aims for: sour → ~2.5, just used up → 7, leftover soda → ~8.5. */
    const targetPh = (): number => {
      if (sour > 0.001) return 2.5 + 4.2 * Math.pow(1 - sour / params.sourness, 2.2);
      return 7 + 1.5 * Math.min(1, extraSoda / 1.2);
    };

    lab.onFrame((dt) => {
      const t = lab.time();

      // ── Pour: soda leaves the tube and lands in the flask.
      const out = tube.step(dt);
      if (out > 0) {
        flask.add(out);
        // Soda arrives in proportion to the poured share of the tube.
        unreacted += (out / TUBE_AREA) * params.spoons;
      }

      // ── React: soda + sour → fizz (CO₂). First-order in whichever runs out first.
      // A small floor rate lets it actually finish instead of creeping toward zero forever.
      const limiting = Math.min(unreacted, sour);
      const react = Math.min(limiting, Math.max(limiting * (1 - Math.exp(-0.7 * dt)), 0.12 * dt));
      unreacted -= react;
      sour -= react;
      gas += react;
      if (sour <= 1e-3 && unreacted > 0) {
        extraSoda += unreacted;
        unreacted = 0;
        sour = 0;
      }
      rate += ((dt > 0 ? react / dt : 0) - rate) * Math.min(1, 6 * dt);

      // ── Bubbles: lots while fizzing, a few from the stream itself.
      const fizz = rate * 60 * params.foaminess;
      const n = Math.floor(fizz * dt + Math.random());
      if (fizz > 0.5) bubbles.spawn(flask, Math.min(n, 12));
      bubbles.step(dt, flask);

      // ── Foam: made by fizzing, slowly collapsing.
      foam += rate * 2600 * params.foaminess * dt - foam * 0.25 * dt;
      foam = Math.max(0, foam);
      const foamTopH = flask.heightOf(flask.area + foam);
      const overflow = flask.area + foam - flask.capacity;
      if (overflow > 0) {
        foam -= overflow * 0.6 * dt * 4;
        if (Math.random() < 0.6) {
          const side = Math.random() < 0.5 ? -1 : 1;
          sparks.push({
            x: flask.opts.x + side * 30, y: flask.rimY - 4, vx: side * (30 + Math.random() * 30), vy: -40,
            r: 5 + Math.random() * 3, life: 1.4, max: 1.4, color: mix(flask.color, 0xffffff, 0.75),
          });
        }
      }

      // ── Colour follows pH (with a little mixing lag).
      shownPh += (targetPh() - shownPh) * Math.min(1, 1.6 * dt);
      flask.color = ramp(CABBAGE, shownPh);
      flask.alpha = 0.8;
      flask.sync();

      if (!celebrated && shownPh > 6.6) {
        celebrated = true;
        burst(sparks, flask.opts.x, flask.rimY - 20, 18, [P.gold, 0x93c5fd, 0xc4b5fd]);
      }
      stepSparks(sparks, dt, 260);

      // ── Draw: scenery behind, then glass + effects in front of the liquid.
      drawWorkshop(lab.back, t);
      const fx = lab.fx;

      // Foam: rows of little bubbles from the surface up to the foam top.
      if (foam > 30) {
        const base = flask.level;
        const foamColor = mix(flask.color, 0xffffff, 0.72);
        for (let h = base - 2, row = 0; h < foamTopH; h += 8, row++) {
          const w = flask.halfWidthAt(h) - 6;
          for (let x = -w + ((row % 2) * 5); x <= w; x += 10) {
            const jiggle = Math.sin(t * 6 + x * 0.3 + row) * 1.2;
            fx.circle(flask.opts.x + x, flask.opts.y - h + jiggle, 6.2, foamColor, 0.9);
          }
        }
        // Bumpy foam crown.
        const w = flask.halfWidthAt(foamTopH) - 4;
        for (let x = -w; x <= w; x += 9) fx.circle(flask.opts.x + x, flask.opts.y - foamTopH + Math.sin(t * 4 + x) * 1.5, 5, 0xffffff, 0.85);
      }
      bubbles.draw(fx);
      flask.drawGlass(fx);

      const landing = drawStream(fx, tube, flask);
      if (landing) {
        bubbles.spawn(flask, Math.random() < 0.5 ? 1 : 0, landing);
        if (Math.random() < 0.5) splash(sparks, landing.x, landing.y, 2, mix(SODA, flask.color, 0.4));
      }
      tube.draw(fx);
      drawRack(fx, tube.rest.x, tube.rest.y);
      drawSparks(fx, sparks);

      // Labels on the bench.
      fx.text('lbl-flask', flask.opts.x, TABLE_Y + 34, 'Sour Dragon Tears', { size: 15, weight: 700, pill: true });
      fx.text('lbl-tube', tube.rest.x, TABLE_Y + 34, `Cloud Powder ×${params.spoons}`, { size: 15, weight: 700, pill: true });
      if (rate > 0.05) fx.text('lbl-fizz', flask.opts.x + 130, flask.surfaceY - 40, 'FIZZ!', { size: 26, weight: 900, color: P.gold });

      // Colour meter: the cabbage rainbow with a pointer at the current pH.
      const mx = 40, my = 690, mw = 720;
      for (let i = 0; i < 60; i++) {
        const ph = 2 + (10 * i) / 60;
        fx.box(mx + (mw * i) / 60, my, mw / 60 + 1, 18, ramp(CABBAGE, ph));
      }
      const px = mx + (mw * (shownPh - 2)) / 10;
      fx.polygon([px, my - 2, px - 9, my - 16, px + 9, my - 16], P.ink);
      fx.text('meter-sour', mx + 50, my + 34, 'very sour', { size: 13, color: P.dim });
      fx.text('meter-mid', mx + mw * 0.5, my + 34, 'just right', { size: 13, color: P.dim });
      fx.text('meter-soapy', mx + mw - 60, my + 34, 'soapy', { size: 13, color: P.dim });

      drawCard(lab.fx, {
        tag: 'Potion 1 · Fizz and colour',
        title: 'The Fizzing Dragon Potion',
        lines: [
          { kind: 'para', text: 'The flask holds Sour Dragon Tears: really vinegar, with a little red-cabbage juice that changes colour.', size: 15 },
          { kind: 'para', text: 'The tube holds Cloud Powder: baking soda in water. Press "pour" and watch!', size: 15 },
          { kind: 'para', text: 'Sour + soda make a new gas, carbon dioxide. That gas is every bubble you see.', size: 15 },
          { kind: 'para', text: 'Cabbage juice is pink when things are sour, purple in the middle and blue when soapy.', size: 15 },
          { kind: 'gap', size: 4 },
          { kind: 'row', label: 'sour left', value: `${fmt((sour / params.sourness) * 100, 0)}%`, color: 0xff2d6f },
          { kind: 'row', label: 'leftover soda', value: fmt(extraSoda, 1), color: 0x3b6fe6 },
          { kind: 'row', label: 'gas made', value: `${fmt(gas, 1)} puffs`, color: 0xffffff },
          { kind: 'row', label: 'bubbles now', value: `${bubbles.items.length}` },
          { kind: 'gap', size: 4 },
          { kind: 'para', text: 'Real recipe: NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂↑', size: 13, color: P.dim },
        ],
      });
    });

    const gui = new GUI({ title: 'Fizzing Dragon Potion' });
    onStoryTeardown(() => gui.destroy());
    gui.add({ pour: () => tube.pour() }, 'pour').name('🧪 pour the Cloud Powder');
    gui.add({ refill: () => { if (tube.phase === 'rest') tube.reset(TUBE_AREA, SODA, 0.85); } }, 'refill').name('refill the tube');
    gui.add(params, 'spoons', 1, 6, 1).name('spoons of soda in tube');
    gui.add(params, 'foaminess', 0.2, 2, 0.1).name('foaminess');
    gui.add(params, 'sourness', 1, 8, 0.5).name('sourness (next reset)');
    gui.add({ reset }, 'reset').name('↺ start again');
  },
};
