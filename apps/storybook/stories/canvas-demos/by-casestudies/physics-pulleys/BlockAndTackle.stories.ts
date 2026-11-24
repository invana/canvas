import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';
import { drawCard, mountLesson, RopeScene, ropeDefaults } from './_pulley-kit';

const meta: Meta = { title: 'canvas-demos/by-casestudies/physics-pulleys/BlockAndTackle' };
export default meta;
type Story = StoryObj;

/**
 * **Lesson 3 — block and tackle.** More pulleys, more rope strands holding the
 * lower block. The number of strands **n** is the *mechanical advantage*:
 * F = W ÷ n, and you pull n times as much rope as the crate rises.
 *
 * Try: slide *ropes holding the crate* from 1 to 4. The green arrow shrinks
 * while your hand travels further. 1 is Lesson 1, 2 is Lesson 2.
 */
export const BlockAndTackleStory: Story = {
  name: 'BlockAndTackle',
  render: () => createContainer({ id: 'physics-block-and-tackle' }),
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#physics-block-and-tackle')!;
    const lesson = await mountLesson(container);
    const params = ropeDefaults(4);
    const scene = new RopeScene(params);

    lesson.onFrame((dt) => {
      scene.step(dt);
      scene.draw(lesson.board);
      drawCard(lesson.board, {
        tag: 'Lesson 3 · Block and tackle',
        title: 'Count the ropes',
        lines: [
          { kind: 'para', text: 'Count the ropes holding the bottom block. That number, n, is the mechanical advantage.', size: 15 },
          { kind: 'para', text: 'Your pull: F = W ÷ n.  Rope you pull: n × how far the crate rises.', size: 15 },
          { kind: 'para', text: 'Sailors and cranes use this to lift huge loads by hand, slowly.', size: 15 },
          { kind: 'gap', size: 4 },
          ...scene.readouts(),
        ],
      });
    });

    const gui = new GUI({ title: 'Block and tackle' });
    onStoryTeardown(() => gui.destroy());
    gui.add(params, 'playing').name('play');
    gui.add({ reset: () => scene.reset() }, 'reset').name('put crate back on floor');
    gui
      .add(params, 'strands', 1, 4, 1)
      .name('ropes holding the crate')
      .onChange(() => scene.reset());
    gui.add(params, 'mass', 1, 18, 1).name('crate mass (kg)');
    gui.add(params, 'autoPull').name('just enough pull');
    gui.add(params, 'pull', 0, 200, 1).name('your pull (N)');
    const show = gui.addFolder('arrows');
    show.add(params.show, 'weight').name('weight W (red)');
    show.add(params.show, 'tension').name('rope tension T (blue)');
    show.add(params.show, 'pull').name('your pull F (green)');
    show.add(params.show, 'countStrands').name('number the ropes');
    show.add(params.show, 'floor').name('floor push (amber)');
    show.add(params.show, 'support').name('ceiling holds pulleys');
  },
};
