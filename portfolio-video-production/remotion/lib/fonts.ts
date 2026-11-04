// Fonts are bundled from local @fontsource packages; rendering waits until they load.
import "@fontsource-variable/inter/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "@fontsource-variable/manrope/wght.css";
import { continueRender, delayRender } from "remotion";

const handle = delayRender("Loading fonts");
Promise.all([
  document.fonts.load('400 40px "Inter Variable"'),
  document.fonts.load('700 40px "Inter Variable"'),
  document.fonts.load('500 30px "JetBrains Mono Variable"'),
  document.fonts.load('700 40px "Manrope Variable"'),
])
  .then(() => document.fonts.ready)
  .then(() => continueRender(handle));
