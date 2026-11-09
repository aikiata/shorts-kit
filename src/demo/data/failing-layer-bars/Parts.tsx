import React from "react";
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import * as THREE from "three";
import {loadChannelFont} from "../../shared/font";
import {ChapterHud} from "../../shared/frame/ChapterHud";
import {RecreationTag} from "../../shared/frame/RecreationTag";
import {CockpitGauges} from "../../shared/gauge/CockpitGauges";
import {TankGaugePair, TankGauge} from "../../shared/gauge/TankGauge";
import {ClaimCard} from "../../shared/diagram/ClaimCard";
import {LayerBars} from "../../shared/diagram/LayerBars";
import {Callout3D} from "../../shared/frame/Callout";
import {FuelLedger} from "../../shared/ledger/FuelLedger";
import {Airliner, REFUEL_POINT} from "../../shared/three/Airliner";
import {ApronLights, Pines, Runway, Terminal} from "../../shared/three/Airfield";
import {CampSite} from "../../shared/three/CampSite";
import {FuelHose} from "../../shared/three/FuelHose";
import {FuelTruck, truckPort} from "../../shared/three/FuelTruck";
import {Dipstick} from "../../shared/three/Dipstick";
import {GlidePath, pathPoint} from "../../shared/three/GlidePath";
import {Lighting} from "../../shared/three/Lighting";
import {PathCamera} from "../../shared/three/PathCamera";
import type {CameraRig, Vec3} from "../../shared/three/cameraPath";
import {LOWPOLY as P} from "../../shared/three/palette";
import {CHAPTERS} from "./timing";

/**
 * Parts sheet: one 60-frame section per new component, so a still at frame
 * 60*k + 50 shows component k fully built. Lab only; no data of any real video.
 */
export const PART = 60;
export const PARTS = 12;

const Backdrop: React.FC<{chapter: number; tag?: "recreated" | "illustrative" | "simplified"; world?: React.ReactNode; children?: React.ReactNode}> = ({chapter, tag = "illustrative", world, children}) => (
  <AbsoluteFill style={{background: world ? P.sky : `linear-gradient(180deg, ${P.sky} 0%, #0F161E 100%)`}}>
    {world}
    <ChapterHud channel="Ngoài sách giáo khoa" chapters={CHAPTERS} chapter={chapter} chapterProgress={0.4} accent={P.orange} compact />
    <RecreationTag kind={tag} compact />
    {children}
  </AbsoluteFill>
);

const Tanks = () => (
  <Backdrop chapter={1}>
    <TankGaugePair
      top={520}
      a={{label: "Phi công tưởng có", value: "22.300 kg", level1: 1, color: P.blue, fillFrames: 20}}
      b={{label: "Thực có khoảng", value: "10.100 kg", level1: 0.45, color: P.orange, estimate: "Ước tính", fillFrames: 20}}
    />
  </Backdrop>
);
const Draining = () => (
  <Backdrop chapter={3} tag="recreated">
    <TankGauge label="Bình nhiên liệu" value="10.100 kg" level0={0.45} level1={0.02} fillFrames={50} color={P.orange} left={300} top={520} width={480} />
  </Backdrop>
);
const GaugesBlank = () => (
  <Backdrop chapter={1}>
    <CockpitGauges labels={["Trái", "Giữa", "Phải"]} values={["--", "--", "--"]} unit="kg" blankText="Trống" state="blank" accent={P.orange} top={520} />
  </Backdrop>
);
const GaugesFade = () => (
  <Backdrop chapter={3}>
    <CockpitGauges labels={["Trái", "Giữa", "Phải"]} values={["4.200", "1.700", "4.200"]} unit="kg" blankText="Tắt" state="fade" offAt={[10, 22, 34]} dials={{labels: ["La bàn", "Chân trời", "Tốc độ", "Độ cao"], values: [0.15, 0.55, 0.4, 0.7], from: 38}} accent={P.orange} top={520} />
  </Backdrop>
);

const LedgerQ = () => {
  const f = useCurrentFrame();
  return (
    <Backdrop chapter={1} tag="simplified">
      <FuelLedger
        wrongTitle="Tính sai"
        rightTitle="Tính đúng"
        bad="#FF5A4D"
        good="#5BD68A"
        from={0}
        rows={[
          {label: "Que đo ra lít", at: 4, wrong: {expr: "62 + 64 cm", value: "7.682", unit: "lít"}, right: {expr: "62 + 64 cm", value: "7.682", unit: "lít"}},
          {label: "Nhân hệ số", at: 16, flag: true, flagAt: 50, wrong: {expr: "hệ số đưa cho phi công", value: "1,77", unit: "lb/lít", revealAt: 40}, right: {expr: "1,77 ÷ 2,2", value: "≈ 0,8", unit: "kg/lít", revealAt: 40}},
        ]}
      />
      <div style={{position: "absolute", left: 48, top: 1500, color: "#999", fontSize: 30}}>f={f}</div>
    </Backdrop>
  );
};

const WorldBase: React.FC<{rig: CameraRig; children?: React.ReactNode}> = ({rig, children}) => (
  <ThreeCanvas width={1080} height={1920} camera={{fov: 36, near: 1, far: 6200, position: [0, 20, -200]}}>
    <Lighting />
    <PathCamera rig={rig} />
    <Runway />
    <Pines />
    {children}
  </ThreeCanvas>
);
const rigAt = (pos: Vec3, target: Vec3, fov = 36): CameraRig => () => ({position: new THREE.Vector3(...pos), target: new THREE.Vector3(...target), fov});

const DipScene = () => {
  const f = useCurrentFrame();
  const pull = interpolate(f, [8, 40], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const rig = rigAt([34, 1.5, 254], [5, 4, 280], 38);
  return (
    <Backdrop chapter={1} tag="recreated" world={<WorldBase rig={rig}>
        <group position={[0, 5.5, 280]}><Airliner gear="down"><Dipstick pull={pull} /></Airliner></group>
      </WorldBase>}>
      <Callout3D rig={rig} point={[6, 5.5 - 1.85 - 4 * pull, 278.5]} label="Que đo" color={P.orange} from={20} offset={{x: -140, y: 220}} align="right" />
    </Backdrop>
  );
};

const GLIDE: Vec3[] = [[0, 600, -2200], [-500, 450, -1700], [-700, 300, -900], [-250, 120, -300], [0, 3, 120]];
const GlideScene = () => {
  const f = useCurrentFrame();
  const prog = interpolate(f, [6, 50], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const rig = rigAt([1100, 900, -2900], [-150, 100, -500], 42);
  const head = pathPoint(GLIDE, prog);
  return (
    <Backdrop chapter={4} tag="recreated" world={<WorldBase rig={rig}>
        <GlidePath points={GLIDE} progress={prog} color={P.orange} width={14} dash={90} gap={60} />
        <group position={head} rotation={[0.1, 0.2, 0]} scale={6}><Airliner gear="up" /></group>
      </WorldBase>}>
      <Callout3D rig={rig} point={[0, 0, 120]} label="Gimli" color={P.blue} from={30} offset={{x: -200, y: 170}} align="right" />
    </Backdrop>
  );
};

const CampScene = () => {
  const f = useCurrentFrame();
  const rig = rigAt([60, 70, 160], [0, 0, 420], 40);
  return (
    <Backdrop chapter={5} tag="recreated" world={<WorldBase rig={rig}>
        <group position={[0, 0, 260]}><CampSite carDrift={f * 0.4} /></group>
      </WorldBase>}>
      <Callout3D rig={rig} point={[0, 0, 470]} label="Đường đua" color={P.blue} from={10} offset={{x: -140, y: 220}} align="right" />
      <Callout3D rig={rig} point={[40, 3, 380]} label="Cắm trại" color={P.orange} from={22} offset={{x: 90, y: 160}} align="left" />
    </Backdrop>
  );
};

const RefuelScene = () => {
  const f = useCurrentFrame();
  const connect = interpolate(f, [8, 44], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const PY = 5.4;
  const plane: Vec3 = [0, PY, 260];
  const truck: Vec3 = [13, 0, 264];
  const rig = rigAt([52, 12, 214], [9, 2.5, 262], 40);
  return (
    <Backdrop chapter={2} tag="illustrative" world={<WorldBase rig={rig}>
        <group position={plane}><Airliner gear="down" /></group>
        <FuelTruck position={truck} />
        <FuelHose from={truckPort(truck)} to={[plane[0] + REFUEL_POINT[0], plane[1] + REFUEL_POINT[1], plane[2] + REFUEL_POINT[2]]} connect={connect} />
      </WorldBase>}>
      <Callout3D rig={rig} point={[13, 3.2, 262]} label="Xe bồn" color={P.orange} from={20} offset={{x: 110, y: -200}} align="left" />
    </Backdrop>
  );
};

const TerminalScene = () => {
  const rig = rigAt([-70, 12, 130], [10, 5, 262], 40);
  return (
    <Backdrop chapter={0} tag="illustrative" world={<WorldBase rig={rig}>
        <Terminal position={[0, 0, 330]} rotationY={Math.PI} length={90} />
        <ApronLights points={[[-60, 0, 290], [-20, 0, 290], [20, 0, 290], [60, 0, 290]]} />
        <group position={[-10, 5.4, 250]} rotation={[0, 0.5, 0]}><Airliner gear="down" /></group>
      </WorldBase>}>
    </Backdrop>
  );
};

const Claims = () => (
  <Backdrop chapter={5} tag="illustrative">
    <ClaimCard cards={[{kicker: "Người ta nhớ", text: "Nhầm pound với ký"}, {kicker: "Báo cáo Lockwood, 1985", text: "Đơn giản hoá"}]} strikeAt={34} bad="#FF5A4D" good="#5BD68A" top={520} />
  </Backdrop>
);
const Layers = () => (
  <Backdrop chapter={5} tag="illustrative">
    <LayerBars top={520} ok="#2C7C8A" bad="#FF5A4D" layers={[{label: "Đồng hồ", fail: "dark", failAt: 22}, {label: "Luật", fail: "snap", failAt: 34}, {label: "Kiểm tra bằng que đo", fail: "cross", failAt: 46, badge: "1,77"}]} />
  </Backdrop>
);

export const Parts: React.FC = () => {
  loadChannelFont();
  const items = [Tanks, Draining, GaugesBlank, GaugesFade, LedgerQ, DipScene, GlideScene, CampScene, Claims, Layers, RefuelScene, TerminalScene];
  return (
    <AbsoluteFill>
      {items.map((C, i) => (
        <Sequence key={i} from={i * PART} durationInFrames={PART}><C /></Sequence>
      ))}
    </AbsoluteFill>
  );
};
