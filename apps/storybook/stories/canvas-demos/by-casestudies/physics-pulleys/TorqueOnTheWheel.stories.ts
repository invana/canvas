import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';
import { drawCard, mountLesson, TorqueScene, torqueDefaults } from './_pulley-kit';

const meta: Meta = { title: 'canvas-demos/by-casestudies/physics-pulleys/TorqueOnTheWheel' };
export default meta;
type Story = StoryObj;

/**
 * **Lesson 4 — why the wheel turns: torque.** Each rope pulls the rim down, a
 * distance **r** (the lever arm, dashed) from the axle. A pull at a distance
 * makes a twist: torque τ = T × r. The left rope twists ↺, the right one ↻;
 * the bigger twist wins and the wheel spins faster and faster that way.
 *
 * Try: make both crates the same mass (twists cancel), then add 1 kg to one
 * side. Raise *wheel mass* to see inertia: a heavy wheel spins up slowly.
 */
export const TorqueOnTheWheelStory: Story = {
  name: 'TorqueOnTheWheel',
  render: () => createContainer({ id: 'physics-torque-on-the-wheel' }),
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#physics-torque-on-the-wheel')!;
    const lesson = await mountLesson(container);
    const params = torqueDefaults();
    const scene = new TorqueScene(params);

    lesson.onFrame((dt) => {
      scene.step(dt);
      scene.draw(lesson.board);
      drawCard(lesson.board, {
        tag: 'Lesson 4 · Torque',
        title: 'Why does the wheel turn?',
        lines: [
          { kind: 'para', text: 'Each rope pulls the rim down, a distance r from the middle (dashed line).', size: 15 },
          { kind: 'para', text: 'A pull at a distance makes a twist, called torque: τ = force × r. Longer r, bigger twist — like a long spanner.', size: 15 },
          { kind: 'para', text: 'Two twists fight. The bigger one wins and the wheel spins up. A heavier wheel resists (inertia).', size: 15 },
          { kind: 'gap', size: 4 },
          ...scene.readouts(),
        ],
      });
    });

    const gui = new GUI({ title: 'Torque on the wheel' });
    onStoryTeardown(() => gui.destroy());
    gui.add(params, 'playing').name('play');
    gui.add({ reset: () => scene.reset() }, 'reset').name('level the crates');
    gui.add(params, 'leftMass', 1, 10, 0.5).name('left crate (kg)').onChange(() => scene.reset());
    gui.add(params, 'rightMass', 1, 10, 0.5).name('right crate (kg)').onChange(() => scene.reset());
    gui.add(params, 'wheelMass', 0, 30, 1).name('wheel mass (kg)').onChange(() => scene.reset());
    gui.add(params, 'radius', 0.4, 1.4, 0.05).name('wheel radius r (m)').onChange(() => scene.reset());
    const show = gui.addFolder('arrows');
    show.add(params.show, 'forces').name('forces (blue / red)');
    show.add(params.show, 'leverArms').name('lever arms r');
    show.add(params.show, 'torques').name('torque twists (violet)');
  },
};
