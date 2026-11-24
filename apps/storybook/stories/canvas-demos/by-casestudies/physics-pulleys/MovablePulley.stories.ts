import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';
import { drawCard, mountLesson, RopeScene, ropeDefaults } from './_pulley-kit';

const meta: Meta = { title: 'canvas-demos/by-casestudies/physics-pulleys/MovablePulley' };
export default meta;
type Story = StoryObj;

/**
 * **Lesson 2 — the movable pulley.** The lower pulley rides on the crate, so
 * **two** rope strands hold it up and each pulls with the same tension T. Two
 * ropes share the weight, so your pull halves: F = W ÷ 2.
 *
 * The catch: to lift the crate 1 m, both strands must shorten by 1 m, so you
 * pull 2 m of rope. Force × distance (the work) comes out the same, which the
 * card's *work in* / *work out* rows show live.
 */
export const MovablePulleyStory: Story = {
  name: 'MovablePulley',
  render: () => createContainer({ id: 'physics-movable-pulley' }),
  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#physics-movable-pulley')!;
    const lesson = await mountLesson(container);
    const params = ropeDefaults(2);
    const scene = new RopeScene(params);

    lesson.onFrame((dt) => {
      scene.step(dt);
      scene.draw(lesson.board);
      drawCard(lesson.board, {
        tag: 'Lesson 2 · Movable pulley',
        title: 'Two ropes share the load',
        lines: [
          { kind: 'para', text: 'The bottom pulley moves with the crate. Count the ropes holding it: 1, 2.', size: 15 },
          { kind: 'para', text: 'Each rope pulls up with T, so together they lift 2 × T. You only need half the weight: F = W ÷ 2.', size: 15 },
          { kind: 'para', text: 'Nothing is free: you pull twice as much rope. Force × distance (work) stays the same.', size: 15 },
          { kind: 'gap', size: 4 },
          ...scene.readouts(),
        ],
      });
    });

    const gui = new GUI({ title: 'Movable pulley' });
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
    show.add(params.show, 'countStrands').name('number the ropes');
    show.add(params.show, 'floor').name('floor push (amber)');
    show.add(params.show, 'support').name('ceiling holds pulley');
  },
};
