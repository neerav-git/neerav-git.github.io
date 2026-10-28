import React from "react";
import type { Layout } from "../lib/geometry";
import { FONT } from "../lib/theme";

// A clean window around the product: 16 px corners, hairline border, deep soft shadow,
// and a minimal title bar naming the product (never a URL).
export const BrowserFrame: React.FC<{ layout: Layout; product: string; icon?: React.ReactNode; children: React.ReactNode; dark?: boolean }> = ({
  layout,
  product,
  icon,
  children,
  dark = false,
}) => {
  const { window: win, content } = layout;
  const bar = dark ? "#151a22" : "#f4f6f9";
  return (
    <div
      style={{
        position: "absolute",
        left: win.left,
        top: win.top,
        width: win.width,
        height: win.titleBar + content.height,
        borderRadius: 16,
        overflow: "hidden",
        background: bar,
        boxShadow: "0 0 0 1px rgba(255,255,255,0.10), 0 2px 6px rgba(0,0,0,0.18), 0 30px 70px rgba(4,8,20,0.45), 0 80px 160px rgba(4,8,20,0.35)",
      }}
    >
      <div
        style={{
          height: win.titleBar,
          display: "flex",
          alignItems: "center",
          position: "relative",
          borderBottom: dark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(15,23,42,0.08)",
        }}
      >
        <div style={{ display: "flex", gap: 9, marginLeft: 22 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, boxShadow: "inset 0 0 0 0.5px rgba(0,0,0,0.15)" }} />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            height: 40,
            padding: "0 20px",
            borderRadius: 10,
            background: dark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)",
            fontFamily: FONT,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 0.1,
            color: dark ? "rgba(255,255,255,0.72)" : "rgba(15,23,42,0.62)",
          }}
        >
          {icon}
          {product}
        </div>
      </div>
      <div style={{ position: "relative", width: content.width, height: content.height, overflow: "hidden" }}>{children}</div>
    </div>
  );
};
