import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';
import {
  drawCard,
  mountLesson,
  RopeScene,
  ropeDefaults,
  TorqueScene,
  torqueDefaults,
  type CardLine,
  type RopeParams,
  type TorqueParams,
} from './_pulley-kit';

const meta: Meta = { title: 'canvas-demos/by-casestudies/physics-pulleys/GuidedLesson' };
export default meta;
type Story = StoryObj;

/**
 * **The whole pulley lesson, one step at a time** — the order a teacher would
 * take a class through it: gravity and the floor → the fixed pulley → tension →
 * the movable pulley → block and tackle → work is conserved → torque (balanced,
 * unbalanced, heavy wheel).
 *
 * Use **Next ▶ / ◀ Back** in the panel (or the → / ← keys). Each step sets
 * the machine up and says what to look at; the live numbers sit under the
 * explanation.
 */
export const GuidedLessonStory: Story = {
  name: 'GuidedLesson',
  render: () => createContainer({ id: 'physics-guided-lesson' }),
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#physics-guided-lesson')!;
    const lesson = await mountLesson(container);

    const rope = new RopeScene(ropeDefaults(1));
    const torque = new TorqueScene(torqueDefaults());

    /** One step of the lesson: which machine, how it's set up, and what the teacher says. */
    interface Step {
      readonly title: string;
      readonly scene: 'rope' | 'torque';
      readonly rope?: Partial<RopeParams> & { show?: Partial<RopeParams['show']> };
      readonly torque?: Partial<TorqueParams>;
      readonly say: readonly string[];
    }
    const off = { weight: false, tension: false, pull: false, floor: false, support: false, countStrands: false };
    const steps: readonly Step[] = [
      {
        title: 'Gravity pulls down',
        scene: 'rope',
        rope: { strands: 1, autoPull: false, pull: 0, show: { ...off, weight: true, floor: true } },
        say: [
          'Everything is pulled down by gravity. That pull is the crate\'s weight: W = mass × 9.8.',
          'So why isn\'t it falling? The floor pushes back up just as hard (amber). Equal and opposite forces = balanced = no change.',
        ],
      },
      {
        title: 'A fixed pulley turns the force around',
        scene: 'rope',
        rope: { strands: 1, autoPull: true, show: { ...off, weight: true, pull: true, floor: true } },
        say: [
          'Hang the crate on a rope over a wheel fixed to the ceiling.',
          'Pull DOWN with F and the crate goes UP. Look at the arrows: green is as long as red. F = W.',
          'It isn\'t easier — but now you can use your body weight to pull.',
        ],
      },
      {
        title: 'Tension: the rope pulls the same everywhere',
        scene: 'rope',
        rope: { strands: 1, autoPull: true, show: { ...off, weight: true, pull: true, tension: true, support: true } },
        say: [
          'A rope pulls equally hard all along it. We call that tension, T (blue).',
          'The pulley has rope pulling down on both sides, so the ceiling must hold 2 × T.',
        ],
      },
      {
        title: 'A movable pulley shares the load',
        scene: 'rope',
        rope: { strands: 2, autoPull: true, show: { ...off, weight: true, pull: true, tension: true, countStrands: true } },
        say: [
          'Now the pulley rides on the crate. Count the ropes holding it: 2.',
          'Each pulls up with T, so 2 × T = W. Your pull is only half: F = W ÷ 2. Look how short the green arrow is!',
        ],
      },
      {
        title: 'Block and tackle: 4 ropes',
        scene: 'rope',
        rope: { strands: 4, autoPull: true, show: { ...off, weight: true, pull: true, tension: true, countStrands: true } },
        say: [
          'More pulleys, more ropes holding the load. 4 ropes → F = W ÷ 4.',
          'The number of ropes is the mechanical advantage.',
        ],
      },
      {
        title: 'Nothing is free: work in = work out',
        scene: 'rope',
        rope: { strands: 4, autoPull: true, show: { ...off, weight: true, pull: true, countStrands: true } },
        say: [
          'Watch the hand: it travels 4 times as far as the crate rises.',
          'Work = force × distance. Small force × long pull = big weight × short lift. Check the two work rows: always equal.',
        ],
      },
      {
        title: 'Torque: equal twists cancel',
        scene: 'torque',
        torque: { leftMass: 5, rightMass: 5, wheelMass: 4, radius: 0.9 },
        say: [
          'Why does a pulley wheel turn at all? Each rope pulls the rim, a distance r (dashed) from the middle.',
          'A pull at a distance makes a twist: torque τ = T × r. Equal crates → equal twists ↺ ↻ → no spin.',
        ],
      },
      {
        title: 'Torque: the bigger twist wins',
        scene: 'torque',
        torque: { leftMass: 5, rightMass: 7, wheelMass: 4, radius: 0.9 },
        say: [
          'Add 2 kg on the right. Now the right rope twists harder ↻.',
          'The net twist makes the wheel spin faster and faster — the crates speed up too.',
        ],
      },
      {
        title: 'Heavy wheel, slow start',
        scene: 'torque',
        torque: { leftMass: 5, rightMass: 7, wheelMass: 30, radius: 0.9 },
        say: [
          'Same crates, but a much heavier wheel. It resists starting to spin — that\'s inertia.',
          'Same twist, slower spin-up: α = τ ÷ I. Real cranes use light wheels for this reason.',
        ],
      },
    ];

    let index = 0;
    const state = { step: '' };
    const apply = (i: number): void => {
      index = Math.max(0, Math.min(steps.length - 1, i));
      const s = steps[index]!;
      if (s.scene === 'rope' && s.rope) {
        const base = ropeDefaults(s.rope.strands ?? 1);
        Object.assign(rope.p, base, s.rope, { show: { ...base.show, ...s.rope.show } });
        rope.reset();
      }
      if (s.scene === 'torque' && s.torque) {
        Object.assign(torque.p, torqueDefaults(), s.torque);
        torque.reset();
      }
      state.step = `${index + 1} / ${steps.length}`;
      stepCtrl.updateDisplay();
    };

    lesson.onFrame((dt) => {
      const s = steps[index]!;
      const active = s.scene === 'rope' ? rope : torque;
      active.step(dt);
      active.draw(lesson.board);
      const lines: CardLine[] = s.say.map((text) => ({ kind: 'para', text, size: 15 }));
      drawCard(lesson.board, {
        tag: `Step ${index + 1} of ${steps.length}`,
        title: s.title,
        lines: [...lines, { kind: 'gap', size: 4 }, ...active.readouts()],
      });
    });

    const gui = new GUI({ title: 'Pulley lesson' });
    onStoryTeardown(() => gui.destroy());
    const stepCtrl = gui.add(state, 'step').name('step').disable();
    gui.add({ next: () => apply(index + 1) }, 'next').name('Next ▶');
    gui.add({ back: () => apply(index - 1) }, 'back').name('◀ Back');
    gui.add({ again: () => (steps[index]!.scene === 'rope' ? rope.reset() : torque.reset()) }, 'again').name('↺ replay this step');

    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight') apply(index + 1);
      if (e.key === 'ArrowLeft') apply(index - 1);
    };
    window.addEventListener('keydown', onKey);
    onStoryTeardown(() => window.removeEventListener('keydown', onKey));

    apply(0);
  },
};
