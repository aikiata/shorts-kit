import {Config} from "@remotion/cli/config";

// Frames are piped as JPEG (faster than PNG, no visible loss after H.264).
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// yuv420p H.264 is what every player opens. Colour tags and range are fixed
// later by `bun run encode` (§11): Remotion tags its output iec61966-2-1.
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
