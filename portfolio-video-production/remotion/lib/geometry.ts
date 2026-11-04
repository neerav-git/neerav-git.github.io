// Mirrors edit/planner.mjs: capture CSS pixels → composition pixels through the camera.
export type Layout = {
  window: { left: number; top: number; width: number; titleBar: number };
  scale: number;
  content: { left: number; top: number; width: number; height: number };
  rest: { x: number; y: number };
};
export type Cam = { z: number; fx: number; fy: number; bx: number; by: number };
export type Box = { x: number; y: number; width: number; height: number };

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const camOf = (row: number[]): Cam => ({ z: row[0], fx: row[1], fy: row[2], bx: row[3], by: row[4] });

export function anchorFor(z: number, L: Layout) {
  // Smoothstep (not a linear ramp): a kink here made every zoom through 1.35x bounce.
  const u = clamp((z - 1) / 0.6, 0, 1);
  const t = u * u * (3 - 2 * u);
  const restY = L.content.top + L.content.height / 2;
  return { x: 960, y: lerp(restY, 548, t) };
}

export const base = (p: { x: number; y: number }, L: Layout) => ({
  x: L.content.left + p.x * L.scale,
  y: L.content.top + p.y * L.scale,
});

export function screenOf(p: { x: number; y: number }, cam: Cam, L: Layout) {
  const a = anchorFor(cam.z, L);
  const b = base(p, L);
  const bf = base({ x: cam.fx, y: cam.fy }, L);
  return { x: a.x + cam.z * (b.x - bf.x), y: a.y + cam.z * (b.y - bf.y) };
}

export function screenBox(box: Box, cam: Cam, L: Layout): Box {
  const a = screenOf({ x: box.x, y: box.y }, cam, L);
  const b = screenOf({ x: box.x + box.width, y: box.y + box.height }, cam, L);
  return { x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y };
}

// CSS transform that places the window group (laid out at rest) under the camera.
export function cameraTransform(cam: Cam, L: Layout) {
  const a = anchorFor(cam.z, L);
  const bf = base({ x: cam.fx, y: cam.fy }, L);
  return `translate(${a.x - cam.z * bf.x}px, ${a.y - cam.z * bf.y}px) scale(${cam.z})`;
}
