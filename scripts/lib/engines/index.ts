import {edge} from "./edge";
import {elevenlabs} from "./elevenlabs";
import {say} from "./say";
import type {Engine} from "./types";

export const ENGINES: Record<string, Engine> = {say, edge, elevenlabs};
