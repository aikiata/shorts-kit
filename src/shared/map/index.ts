/**
 * Flat map tooling: one coordinate system (Web Mercator world units), a camera
 * that flies between boxes, satellite mosaics, vector layers, routes,
 * annotations, and the Vietnam preset with Hoàng Sa and Trường Sa.
 *
 * The 3D globe lives in `./globe`, `./globe-line` and `./GlobeReveal`; import
 * those directly, so a flat-map video does not pull three.js into its bundle.
 */
export * from "./mercator";
export {coast, drift, fly, glide, move, MOTION_FLOOR, PAN_TAU, path, smoothstep, type CoastRate, type Move} from "./camera";
export {magnification, mosaicLayers, SatelliteMap, useMapView, canvasWorldHeight, type MapView, type Mosaic, type SatelliteManifest} from "./SatelliteMap";
export {VectorLayer} from "./VectorLayer";
export {cutAt, Route, routeGeometry} from "./Route";
export {clampToSafe, Cross, formatKm, GhostSpan, LABEL_SAFE, labelWidth, Measure, Pin, Ping, Region, type PinSide} from "./annotations";
export {ARCH_MARGIN_DEG, ARCH_SHAPES, ARCHIPELAGO, archLabel, Archipelagos, archipelagosInView, type ArchId, type LabelLang} from "./archipelagos";
export {at, MEKONG_DELTA_BRANCHES, NEIGHBOURS, place, PLACES, RIVERS, VIETNAM, VIETNAM_VIEWS, VietnamMap, type CountryPath, type Place, type RiverPath} from "./vietnam";
