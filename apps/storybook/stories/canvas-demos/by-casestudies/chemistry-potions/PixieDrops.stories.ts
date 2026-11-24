import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';
import {
  BEAKER,
  burst,
  drawCard,
  drawMeter,
  drawPuffs,
  drawSparks,
  drawWorkshop,
  Dropper,
  mix,
  mountWorkshop,
  P,
  splash,
  stepPuffs,
  stepSparks,
  TABLE_Y,
  Vessel,
  type Puff,
  type Spark,
} from './_potion-kit';

const meta: Meta = { title: 'canvas-demos/by-casestudies/chemistry-potions/PixieDrops' };
export default meta;
type Story = StoryObj;

/**
 * **Potion 2 — Pixie Drops.** A beaker of clear *Moon Water* (a weak acid with
 * a few drops of phenolphthalein) and a dropper of *Pixie Drops* (a weak base).
 * Every drop blooms into a **pink cloud** that quickly fades — the sour in the
 * Moon Water gobbles the soapy drop up. Near the end the clouds linger longer
 * and longer… and the one drop that finishes the sour turns the **whole
 * beaker pink**. That's a titration's *end point*.
 *
 * Try: squeeze one drop at a time and count how many it takes. Turn on
 * *magic stir* to see the cloud spin and mix away faster. Change the
 * *sourness* and reset — more sour means more drops.
 *
 * **Engine vs story:** the beaker liquid is the engine's `liquid-fill`; drops,
 * ripples, pink clouds and sparkles are overlay drawing.
 */
export const PixieDropsStory: Story = {
  name: 'PixieDrops',
  render: () => createContainer({ id: 'potion-pixie-drops' }),
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#potion-pixie-drops')!;
    const lab = await mountWorkshop(container);

    const params = { sourness: 12, autoDrip: false, dripsPerSecond: 2, stir: false };
    const PINK = 0xff3fa4;
    const DROP_COLOR = 0xe0f2ff;
    const START_AREA = 18000;
    const DROP_AREA = 140;

    const beaker = new Vessel(lab.glassware, { id: 'beaker', x: 430, y: TABLE_Y, profile: BEAKER, marks: true });
    const dropper = new Dropper(430, 290, DROP_COLOR);
    const puffs: Puff[] = [];
    const sparks: Spark[] = [];
    const ripples: Array<{ x: number; y: number; life: number }> = [];

    let drops = 0; // drops landed
    let pink = 0; // shown pinkness 0..1
    let drip = 0; // auto-drip accumulator
    let celebrated = false;

    const reset = (): void => {
      beaker.area = START_AREA;
      drops = 0;
      pink = 0;
      celebrated = false;
      puffs.length = 0;
      sparks.length = 0;
      ripples.length = 0;
    };
    reset();

    /** A drop lands: ripple, splash, and a pink cloud that lives longer near the end point. */
    const onHit = (x: number, y: number): void => {
      drops++;
      beaker.add(DROP_AREA);
      ripples.push({ x, y, life: 1 });
      splash(sparks, x, y, 4, DROP_COLOR);
      const nearness = Math.min(1, drops / params.sourness);
      const life = 0.5 + 3.5 * Math.pow(nearness, 4);
      for (let i = 0; i < 7; i++) {
        puffs.push({
          x: x + (Math.random() - 0.5) * 10, y: y + 10 + Math.random() * 20,
          vx: (Math.random() - 0.5) * 50, vy: 40 + Math.random() * 60,
          r: 6, grow: 14 + Math.random() * 12, color: PINK, alpha: 0.55,
          life, max: life,
        });
      }
    };

    lab.onFrame((dt) => {
      const t = lab.time();

      if (params.autoDrip) {
        drip += dt * params.dripsPerSecond;
        while (drip >= 1) {
          drip -= 1;
          if (dropper.pending < 3) dropper.squeeze();
        }
      }
      dropper.step(dt, beaker.surfaceY, onHit);

      // Sour left decides the colour: still sour → clear; one drop past → pink.
      const extra = drops - params.sourness;
      const targetPink = extra >= 0 ? Math.min(1, 0.55 + 0.15 * extra) : 0;
      pink += (targetPink - pink) * Math.min(1, (targetPink > pink ? 1.5 : 4) * dt);
      beaker.color = mix(P.clear, PINK, pink);
      beaker.alpha = 0.45 + 0.4 * pink;
      beaker.sync();

      if (!celebrated && extra >= 0) {
        celebrated = true;
        burst(sparks, beaker.opts.x, beaker.rimY - 30, 22, [PINK, P.gold, 0xffffff]);
      }

      stepPuffs(puffs, dt * (params.stir ? 1.8 : 1), beaker, params.stir ? 6 : 0);
      stepSparks(sparks, dt, 420);
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i]!.life -= dt * 1.6;
        if (ripples[i]!.life <= 0) ripples.splice(i, 1);
      }

      drawWorkshop(lab.back, t);
      const fx = lab.fx;
      drawPuffs(fx, puffs);
      for (const r of ripples) {
        for (const k of [0, 0.35]) {
          const life = r.life - k;
          if (life <= 0) continue;
          const rad = 6 + (1 - life) * 50;
          fx.ink.ellipse(r.x, r.y, rad, rad * 0.22).stroke({ color: 0xffffff, width: 1.5, alpha: life * 0.7 });
        }
      }
      beaker.drawGlass(fx);
      dropper.draw(fx);
      // Stirring rod circles when magic stir is on.
      if (params.stir) {
        const a = t * 4;
        const rx = beaker.opts.x + Math.cos(a) * 45;
        const top = beaker.surfaceY + 30 + Math.sin(a) * 6;
        fx.line(rx + 30, beaker.rimY - 70, rx, top + 70, P.glass, 6, 0.75);
      }
      drawSparks(fx, sparks);

      fx.text('lbl-beaker', beaker.opts.x, TABLE_Y + 34, 'Moon Water', { size: 15, weight: 700, pill: true });
      fx.text('lbl-dropper', beaker.opts.x + 120, 160, 'Pixie Drops', { size: 15, weight: 700, pill: true });
      fx.text('lbl-count', beaker.opts.x - 210, 300, `${drops}`, { size: 56, weight: 900, color: extra >= 0 ? PINK : P.ink });
      fx.text('lbl-count-cap', beaker.opts.x - 210, 345, 'drops', { size: 15, color: P.dim });
      if (extra >= 0) fx.text('lbl-done', beaker.opts.x, beaker.rimY - 40, 'It stays pink!', { size: 24, weight: 900, color: P.gold });

      const sourLeft = Math.max(0, 1 - drops / params.sourness);
      drawMeter(fx, 'sour', 60, 700, 300, sourLeft, 0xfde047, 'SOUR LEFT IN THE MOON WATER');
      drawMeter(fx, 'pink', 430, 700, 300, pink, PINK, 'PINKNESS');

      drawCard(lab.fx, {
        tag: 'Potion 2 · Drop by drop',
        title: 'Pixie Drops',
        lines: [
          { kind: 'para', text: 'Moon Water is a little bit sour. It has a secret helper in it, phenolphthalein, that blushes pink when things get soapy.', size: 15 },
          { kind: 'para', text: 'Pixie Drops are soapy. Each drop makes a pink cloud, but the sour gobbles it up and the pink fades away.', size: 15 },
          { kind: 'para', text: 'Watch the clouds stay longer and longer. When the sour is all gone, one last drop turns the whole beaker pink. Scientists call that the end point.', size: 15 },
          { kind: 'gap', size: 4 },
          { kind: 'row', label: 'drops so far', value: `${drops}` },
          { kind: 'row', label: 'sour left', value: `${Math.round(sourLeft * 100)}%`, color: 0xfde047 },
          { kind: 'row', label: 'pink clouds', value: `${puffs.length}`, color: PINK },
          { kind: 'gap', size: 4 },
          { kind: 'para', text: 'Real recipe: acid + base → salt + water, with phenolphthalein as the indicator (colourless below pH 8.2, pink above).', size: 13, color: P.dim },
        ],
      });
    });

    const gui = new GUI({ title: 'Pixie Drops' });
    onStoryTeardown(() => gui.destroy());
    gui.add({ drop: () => dropper.squeeze() }, 'drop').name('💧 squeeze one drop');
    gui.add({ five: () => { for (let i = 0; i < 5; i++) dropper.squeeze(); } }, 'five').name('💧×5 squeeze five');
    gui.add(params, 'autoDrip').name('drip by itself');
    gui.add(params, 'dripsPerSecond', 0.5, 6, 0.5).name('drips per second');
    gui.add(params, 'stir').name('🌀 magic stir');
    gui.add(params, 'sourness', 4, 30, 1).name('sourness (drops needed)');
    gui.add({ reset }, 'reset').name('↺ start again');
  },
};
