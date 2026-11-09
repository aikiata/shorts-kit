/** The few glyphs the preview needs, drawn here (16px grid, currentColor), in the stroke style of Knowns UI. */
import type {SVGProps} from "react";

const base = {viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true} as const;
type P = SVGProps<SVGSVGElement>;
const I = (d: string) => (p: P) => (
  <svg {...base} className="size-4" {...p}>
    <path d={d} />
  </svg>
);

export const ArrowLeft = I("M13 8H3m4.5-4.5L3 8l4.5 4.5");
export const Check = I("m3.5 8.5 3 3 6-7");
export const Copy = I("M5.5 5.5v-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M3.5 5.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z");
export const Refresh = I("M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3");
export const Close = I("m4 4 8 8m0-8-8 8");
export const Chat = I("M2.5 7.5c0-2.8 2.5-5 5.5-5s5.5 2.2 5.5 5-2.5 5-5.5 5c-.8 0-1.6-.1-2.3-.4L2.5 13.5l.9-2.6c-.6-.9-.9-2-.9-3.4Z");
export const Users = I("M6 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-4 6c0-2.2 1.8-4 4-4s4 1.8 4 4m1-6a2 2 0 1 0 0-4m1.5 10c0-1.7-.9-3.1-2.3-3.7");
export const Code = I("m5.5 4.5-3.5 3.5 3.5 3.5m5-7 3.5 3.5-3.5 3.5");
export const Globe = I("M8 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm-5.5-5.5h11M8 2.5c1.5 1.5 2.2 3.3 2.2 5.5S9.5 12 8 13.5C6.5 12 5.8 10.2 5.8 8S6.5 4 8 2.5Z");
export const GitHub = (p: P) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" fill="currentColor" className="size-4" {...p}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);
