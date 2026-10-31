import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Video } from "../components/CaptureScene";
import { alpha, EASE, FONT, type Palette } from "../lib/theme";

// The payoff: what Maya got done on day one, as four real end frames from the capture take, with the
// new hire's three questions from the opening schematic ticked off above them.
export type RecapTile = { video: string; frame: number; crop: { x: number; y: number; width: number; height: number }; label: string; colour: string; at: number };

const ramp = (frame: number, a: number, b: number) => EASE.enter(interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

const TW = 700;
const TH = 394;
const GAP = 30;
const LEFT = (1920 - (TW * 2 + GAP)) / 2;
const TOP = 140;
// Capture CSS pixels (the page is 1920 x 1080).
const PAGE = { width: 1920, height: 1080 };

const Tick: React.FC<{ size: number; colour: string; p: number }> = ({ size, colour, p }) => (
  <div style={{ flex: "none", width: size, height: size, borderRadius: size / 2, background: colour, display: "grid", placeItems: "center", transform: `scale(${0.4 + 0.6 * p})`, opacity: p }}>
    <svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
    </svg>
  </div>
);

export const RelayRecap: React.FC<{ palette: Palette; duration: number; tiles: RecapTile[]; questions: string[]; questionsAt: number; ticksAt: number }> = ({ palette, duration, tiles, questions, questionsAt, ticksAt }) => {
  const frame = useCurrentFrame();
  const push = 1 + 0.03 * interpolate(frame, [0, duration], [0, 1], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill>
      <Backdrop palette={palette} />
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "960px 560px" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 50, display: "flex", justifyContent: "center", gap: 22, fontFamily: FONT }}>
          {questions.map((q, k) => {
            const shown = ramp(frame, questionsAt + k * 5, questionsAt + k * 5 + 16);
            const ticked = ramp(frame, ticksAt + k * 7, ticksAt + k * 7 + 14);
            return (
              <div key={q} style={{ display: "flex", alignItems: "center", gap: 12, height: 54, padding: "0 24px 0 12px", borderRadius: 999, background: "#fff", boxShadow: "0 12px 30px rgba(0,0,0,0.35)", opacity: shown, transform: `translateY(${(1 - shown) * 12}px)` }}>
                <div style={{ position: "relative", width: 34, height: 34 }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: 17, border: "2.5px solid #c3c9d1", opacity: 1 - ticked }} />
                  <div style={{ position: "absolute", inset: 0 }}><Tick size={34} colour={palette.ok} p={ticked} /></div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 650, color: "#10202c" }}>{q}</div>
              </div>
            );
          })}
        </div>
        {tiles.map((tile, k) => {
          const x = LEFT + (k % 2) * (TW + GAP);
          const y = TOP + Math.floor(k / 2) * (TH + GAP);
          const land = ramp(frame, tile.at, tile.at + 20);
          const ticked = ramp(frame, tile.at + 12, tile.at + 26);
          const s = TW / tile.crop.width;
          return (
            <div key={k} style={{ position: "absolute", left: x, top: y, width: TW, height: TH, borderRadius: 16, overflow: "hidden", background: "#eef0f3", boxShadow: `0 26px 60px rgba(0,0,0,0.45), 0 0 0 1px ${alpha("#ffffff", 0.12)}`, opacity: land, transform: `translateY(${(1 - land) * 30}px) scale(${0.94 + 0.06 * land})` }}>
              <div style={{ position: "absolute", left: -tile.crop.x * s, top: -tile.crop.y * s, width: PAGE.width * s, height: PAGE.height * s }}>
                <Video src={tile.video} frame={tile.frame} width={PAGE.width * s} height={PAGE.height * s} />
              </div>
              <div style={{ position: "absolute", left: 16, bottom: 16, display: "flex", alignItems: "center", gap: 12, height: 50, padding: "0 20px 0 10px", borderRadius: 999, background: "rgba(10,14,26,0.86)", boxShadow: "0 10px 26px rgba(0,0,0,0.35)", borderLeft: `5px solid ${tile.colour}`, fontFamily: FONT }}>
                <Tick size={30} colour={palette.ok} p={ticked} />
                <div style={{ color: "#fff", fontSize: 24, fontWeight: 600, whiteSpace: "nowrap" }}>{tile.label}</div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
