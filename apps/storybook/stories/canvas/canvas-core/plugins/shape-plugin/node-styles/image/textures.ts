/** SVG pattern textures as data-URLs — kept in a separate module so that
 *  Vite's import scanner (acorn fallback) never has to parse TypeScript syntax
 *  mixed with large SVG strings inside a Storybook story file.
 */

const svgToUrl = (svg: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const TEXTURES: Record<string, string> = {
  grid: svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#1e3a5f"/><path d="M0 0h32M0 16h32M0 32h32M0 0v32M16 0v32M32 0v32" stroke="#38bdf8" stroke-width="0.75" fill="none"/></svg>`),
  stripes: svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#1a2e1a"/><path d="M0 0l32 32M-8 0l32 32M8 0l32 32M-16 0l32 32M16 0l32 32" stroke="#4ade80" stroke-width="3" fill="none"/></svg>`),
  checkers: svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#1c1c2e"/><rect x="0" y="0" width="16" height="16" fill="#7c3aed"/><rect x="16" y="16" width="16" height="16" fill="#7c3aed"/></svg>`),
  dots: svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="#1a1a2e"/><circle cx="12" cy="12" r="4" fill="#f59e0b"/><circle cx="0" cy="0" r="2.5" fill="#f59e0b"/><circle cx="24" cy="0" r="2.5" fill="#f59e0b"/><circle cx="0" cy="24" r="2.5" fill="#f59e0b"/><circle cx="24" cy="24" r="2.5" fill="#f59e0b"/></svg>`),
  waves: svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="#1e1b4b"/><path d="M0 10 Q10 0 20 10 Q30 20 40 10" stroke="#818cf8" stroke-width="2.5" fill="none"/><path d="M0 20 Q10 10 20 20 Q30 30 40 20" stroke="#818cf8" stroke-width="2.5" fill="none"/><path d="M0 0 Q10 -10 20 0 Q30 10 40 0" stroke="#818cf8" stroke-width="2.5" fill="none"/></svg>`),
  diamonds: svgToUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#2d1515"/><path d="M16 2l14 14-14 14L2 16z" stroke="#f87171" stroke-width="1.5" fill="#3d1515"/><circle cx="16" cy="16" r="2.5" fill="#f87171"/></svg>`),
};
