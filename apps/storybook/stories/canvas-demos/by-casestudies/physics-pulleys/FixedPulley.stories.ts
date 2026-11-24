import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';
import { drawCard, mountLesson, RopeScene, ropeDefaults } from './_pulley-kit';

const meta: Meta = { title: 'canvas-demos/by-casestudies/physics-pulleys/FixedPulley' };
export default meta;
type Story = StoryObj;

/**
 * **Lesson 1 — the fixed pulley.** A wheel bolted to the ceiling. Pulling down
 * lifts the crate up, but you still pull as hard as the crate weighs (F = W): a
 * fixed pulley changes the **direction** of the force, not its **size**.
 *
 * Try: untick *just enough pull*, then drag *your pull* below the crate's
 * weight. The crate stays down and an amber arrow shows the floor holding up
 * the rest. Push the pull above W and the crate speeds up.
 */
export const FixedPulleyStory: Story = {
  name: 'FixedPulley',
  render: () => createContainer({ id: 'physics-fixed-pulley' }),
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#physics-fixed-pulley')!;
    const lesson = await mountLesson(container);
    const params = ropeDefaults(1);
    const scene = new RopeScene(params);

    lesson.onFrame((dt) => {
      scene.step(dt);
      scene.draw(lesson.board);
      drawCard(lesson.board, {
        tag: 'Lesson 1 · Fixed pulley',
        title: 'Pull down, it goes up',
        lines: [
          { kind: 'para', text: 'The wheel is bolted to the ceiling. Pull the rope DOWN and the crate goes UP.', size: 15 },
          { kind: 'para', text: 'A rope pulls equally hard all along its length. That pull is called tension, T.', size: 15 },
          { kind: 'para', text: 'So you pull as hard as the crate weighs: F = W. The pulley only turns the force around, so you can use your own weight to pull.', size: 15 },
          { kind: 'gap', size: 4 },
          ...scene.readouts(),
        ],
      });
    });

    const gui = new GUI({ title: 'Fixed pulley' });
    onStoryTeardown(() => gui.destroy());
    gui.add(params, 'playing').name('play');
    gui.add({ reset: () => scene.reset() }, 'reset').name('put crate back on floor');
    gui.add(params, 'mass', 1, 18, 1).name('crate mass (kg)');
    gui.add(params, 'autoPull').name('just enough pull');
    gui.add(params, 'pull', 0, 200, 1).name('your pull (N)');
    const show = gui.addFolder('arrows');
    show.add(params.show, 'weight').name('weight W (red)');
    show.add(params.show, 'tension').name('rope tension T (blue)');
    show.add(params.show, 'pull').name('your pull F (green)');
    show.add(params.show, 'floor').name('floor push (amber)');
    show.add(params.show, 'support').name('ceiling holds pulley');
  },
};
