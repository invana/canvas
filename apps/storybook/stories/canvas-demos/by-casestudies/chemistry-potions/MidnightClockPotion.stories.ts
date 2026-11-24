import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';
import {
  BEAKER,
  burst,
  drawCard,
  drawMeter,
  drawPuffs,
  drawRack,
  drawSparks,
  drawStream,
  drawWorkshop,
  ease,
  fmt,
  mix,
  mountWorkshop,
  P,
  splash,
  stepPuffs,
  stepSparks,
  TABLE_Y,
  TestTube,
  Vessel,
  type Puff,
  type Spark,
} from './_potion-kit';

const meta: Meta = { title: 'canvas-demos/by-casestudies/chemistry-potions/MidnightClockPotion' };
export default meta;
type Story = StoryObj;

/**
 * **Potion 3 — the Midnight Clock Potion.** Two potions that both look like
 * plain water: *Starlight* in the beaker and *Sleepy Dew* in the test tube.
 * Pour them together and… nothing. The clock ticks. Then, all at once, the
 * whole beaker turns **midnight blue-black**. This is the real **iodine clock**
 * reaction: a hidden helper quietly eats the iodine as it forms, and the
 * moment the helper runs out, starch grabs the iodine and goes dark.
 *
 * Try: make the potion *stronger* or *warmer* and the clock runs faster; make
 * it weaker or colder and you wait longer. Guess the time before you pour!
 *
 * **Engine vs story:** the beaker liquid is the engine's `liquid-fill`; the
 * clock, tilting tube, stream, ink swirls and sparkles are overlay drawing.
 */
export const MidnightClockPotionStory: Story = {
  name: 'MidnightClockPotion',
  render: () => createContainer({ id: 'potion-midnight-clock' }),
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#potion-midnight-clock')!;
    const lab = await mountWorkshop(container);

    const params = { strength: 1.5, warmth: 20 };
    const MIDNIGHT = 0x0a0d33;
    const START_AREA = 15000;
    const TUBE_AREA = 3800;

    const beaker = new Vessel(lab.glassware, { id: 'beaker', x: 460, y: TABLE_Y, profile: BEAKER, marks: true });
    const tube = new TestTube({ x: 170, y: 360 }, { x: 358, y: 368 }, TUBE_AREA, P.clear, 0.5);
    const clock = { x: 660, y: 300, r: 56 };
    const puffs: Puff[] = [];
    const sparks: Spark[] = [];

    let mixedAt = -1; // lab time when the potions first touched (-1 = not yet)
    let delay = 0; // seconds from mixing to midnight
    let dark = 0; // 0 clear → 1 midnight
    let flashed = false;

    /** Seconds until midnight: stronger potion → faster; every +10° doubles the speed. */
    const clockDelay = (): number => (8 / params.strength) * Math.pow(2, (20 - params.warmth) / 10);

    const reset = (): void => {
      beaker.area = START_AREA;
      tube.reset(TUBE_AREA, P.clear, 0.5);
      mixedAt = -1;
      dark = 0;
      flashed = false;
      puffs.length = 0;
      sparks.length = 0;
    };
    reset();

    lab.onFrame((dt) => {
      const t = lab.time();

      const out = tube.step(dt);
      if (out > 0) {
        beaker.add(out);
        if (mixedAt < 0) {
          mixedAt = t;
          delay = clockDelay();
        }
      }
      const elapsed = mixedAt < 0 ? 0 : t - mixedAt;
      const helperLeft = mixedAt < 0 ? 1 : Math.max(0, 1 - elapsed / delay);

      // Midnight! Ink swirls bloom everywhere, then the whole potion darkens.
      if (mixedAt >= 0 && helperLeft === 0) {
        if (!flashed) {
          flashed = true;
          for (let i = 0; i < 26; i++) {
            const p = beaker.randomPoint(14);
            puffs.push({
              x: p.x, y: p.y, vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30,
              r: 3, grow: 40 + Math.random() * 40, color: MIDNIGHT, alpha: 0.85, life: 1.4, max: 1.4,
            });
          }
          burst(sparks, beaker.opts.x, beaker.rimY - 30, 24, [P.gold, 0x93c5fd, 0xffffff]);
        }
        dark = Math.min(1, dark + dt / 0.7);
      }
      beaker.color = mix(P.clear, MIDNIGHT, ease(dark));
      beaker.alpha = 0.45 + 0.55 * ease(dark);
      beaker.sheen = 0.3 - 0.24 * ease(dark);
      beaker.sync();

      stepPuffs(puffs, dt, beaker);
      stepSparks(sparks, dt, 260);

      drawWorkshop(lab.back, t);
      const fx = lab.fx;
      drawPuffs(fx, puffs);
      beaker.drawGlass(fx);
      const landing = drawStream(fx, tube, beaker);
      if (landing && Math.random() < 0.5) splash(sparks, landing.x, landing.y, 2, 0xffffff);
      tube.draw(fx);
      drawRack(fx, tube.rest.x, tube.rest.y);
      drawSparks(fx, sparks);

      // The clock: a full turn of the hand = the whole wait.
      const frac = mixedAt < 0 ? 0 : Math.min(1, elapsed / delay);
      fx.circle(clock.x, clock.y, clock.r + 6, 0x3b2a1a, 1, 0x8a5532, 4);
      fx.circle(clock.x, clock.y, clock.r, 0xfef3c7, 1);
      // Wedge of "time used".
      if (frac > 0) {
        const pts = [clock.x, clock.y];
        for (let i = 0; i <= 40; i++) {
          const a = -Math.PI / 2 + Math.PI * 2 * frac * (i / 40);
          pts.push(clock.x + Math.cos(a) * (clock.r - 4), clock.y + Math.sin(a) * (clock.r - 4));
        }
        fx.polygon(pts, MIDNIGHT, 0.25 + 0.5 * dark);
      }
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        fx.line(clock.x + Math.cos(a) * (clock.r - 10), clock.y + Math.sin(a) * (clock.r - 10), clock.x + Math.cos(a) * (clock.r - 3), clock.y + Math.sin(a) * (clock.r - 3), 0x3b2a1a, 3);
      }
      const ha = -Math.PI / 2 + Math.PI * 2 * frac;
      fx.line(clock.x, clock.y, clock.x + Math.cos(ha) * (clock.r - 12), clock.y + Math.sin(ha) * (clock.r - 12), 0x3b2a1a, 4);
      fx.circle(clock.x, clock.y, 5, 0x3b2a1a, 1);
      fx.sparkle(clock.x, clock.y - clock.r - 18, 9, P.moon, 0.6 + 0.4 * dark);

      const status = mixedAt < 0 ? 'pour to start the clock' : dark >= 1 ? 'MIDNIGHT!' : `${fmt(Math.max(0, delay - elapsed), 1)} s…`;
      fx.text('lbl-clock', clock.x, clock.y + clock.r + 26, status, { size: dark >= 1 ? 22 : 17, weight: 800, color: dark >= 1 ? P.gold : P.ink });
      fx.text('lbl-beaker', beaker.opts.x, TABLE_Y + 34, 'Starlight', { size: 15, weight: 700, pill: true });
      fx.text('lbl-tube', tube.rest.x, TABLE_Y + 34, 'Sleepy Dew', { size: 15, weight: 700, pill: true });

      drawMeter(fx, 'helper', 60, 700, 330, helperLeft, 0x86efac, 'HIDDEN HELPER LEFT (eats the iodine)');
      drawMeter(fx, 'dark', 440, 700, 300, dark, 0x6366f1, 'MIDNIGHT-NESS');

      drawCard(lab.fx, {
        tag: 'Potion 3 · A potion with a timer',
        title: 'The Midnight Clock Potion',
        lines: [
          { kind: 'para', text: 'Both potions look just like water. Pour them together and watch the clock…', size: 15 },
          { kind: 'para', text: 'When they mix they slowly make iodine. But a hidden helper eats the iodine as fast as it is made, so nothing shows.', size: 15 },
          { kind: 'para', text: 'When the helper runs out, starch in the potion grabs the iodine and turns midnight blue-black, all at once!', size: 15 },
          { kind: 'para', text: 'Stronger or warmer potions react faster, so the clock runs out sooner.', size: 15 },
          { kind: 'gap', size: 4 },
          { kind: 'row', label: 'wait (this mix)', value: `${fmt(mixedAt < 0 ? clockDelay() : delay, 1)} s` },
          { kind: 'row', label: 'helper left', value: `${Math.round(helperLeft * 100)}%`, color: 0x86efac },
          { kind: 'row', label: 'warmth', value: `${params.warmth} °C` },
          { kind: 'gap', size: 4 },
          { kind: 'para', text: 'Real recipe: iodate + bisulfite + starch (the Landolt iodine clock).', size: 13, color: P.dim },
        ],
      });
    });

    const gui = new GUI({ title: 'Midnight Clock Potion' });
    onStoryTeardown(() => gui.destroy());
    gui.add({ pour: () => tube.pour() }, 'pour').name('🧪 pour the Sleepy Dew');
    gui.add(params, 'strength', 0.5, 4, 0.1).name('potion strength');
    gui.add(params, 'warmth', 0, 50, 1).name('warmth (°C)');
    gui.add({ reset }, 'reset').name('↺ start again');
  },
};
