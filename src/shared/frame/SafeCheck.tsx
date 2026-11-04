import React from "react";
import {AbsoluteFill} from "remotion";
import {SafeZones} from "./SafeZones";

/** Renders its children, and the safe-zone overlay on top when `safe` is true. */
export const SafeCheck: React.FC<{safe?: boolean; cover?: boolean; children: React.ReactNode}> = ({
  safe = false,
  cover = false,
  children,
}) => (
  <AbsoluteFill>
    {children}
    {safe ? <SafeZones cover={cover} /> : null}
  </AbsoluteFill>
);
