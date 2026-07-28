"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { IconCanvas } from "./icon-canvas";

const ACCENT = "#FC8337";
const DIM = "#8A8A94";

export type BenefitIconKind = "extract" | "select" | "connect";

type BenefitIconSceneProps = {
  kind: BenefitIconKind;
  /** Renders a single static frame — no loop. */
  staticFrame?: boolean;
  hovered?: boolean;
};

/** "วิเคราะห์เรซูเม่ด้วย AI": document with particles emanating outward, looping. */
function ExtractIcon({ hovered }: { hovered: boolean }) {
  const particleCount = 6;
  const particleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const seeds = useMemo(
    () => Array.from({ length: particleCount }, () => Math.random() * Math.PI * 2),
    []
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    particleRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const seed = seeds[i];
      const angle = seed + i * ((Math.PI * 2) / particleCount) * 0.3;
      // Loop: particle travels outward then resets (sawtooth via modulo).
      const cycle = ((t * 0.55 + seed) % 1);
      const dist = 0.18 + cycle * 0.42;
      mesh.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist * 0.8, 0.05);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (hovered ? 0.95 : 0.75) * (1 - cycle);
    });
  });

  return (
    <group>
      <mesh>
        <boxGeometry args={[0.5, 0.66, 0.05]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.2} toneMapped={false} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(0.5, 0.66, 0.05)]} />
        <lineBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={hovered ? 0.9 : 0.7} />
      </lineSegments>
      {seeds.map((_, i) => (
        <mesh key={i} ref={(el) => { particleRefs.current[i] = el; }}>
          <sphereGeometry args={[0.028, 6, 6]} />
          <meshBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
}

/** "ประเมินทักษะแบบเลือกตอบ": toggles cycling one-lit-at-a-time, looping. */
function SelectIcon({ hovered }: { hovered: boolean }) {
  const toggleCount = 3;
  const materialRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const positions = useMemo(
    () => [
      new THREE.Vector3(0, 0.24, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.24, 0),
    ],
    []
  );

  useFrame((state) => {
    const cyclePos = (state.clock.elapsedTime * 0.95) % toggleCount;
    materialRefs.current.forEach((mat, i) => {
      if (!mat) return;
      const dist = Math.min(Math.abs(cyclePos - i), toggleCount - Math.abs(cyclePos - i));
      const lit = Math.max(0, 1 - dist * 2.2);
      mat.opacity = 0.3 + lit * (hovered ? 0.7 : 0.55);
    });
  });

  return (
    <group>
      {positions.map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <torusGeometry args={[0.09, 0.02, 8, 16]} />
            <meshBasicMaterial
              ref={(el) => { materialRefs.current[i] = el; }}
              color={ACCENT}
              toneMapped={false}
              transparent
              opacity={0.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** "จับคู่ฝึกงานที่แม่นยำ": two shapes align and lock with a soft glow pulse, looping. */
function ConnectIcon({ hovered }: { hovered: boolean }) {
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const pulseMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    // 0..1..0 loop: approach, lock (dwell), separate, repeat.
    const cycle = (state.clock.elapsedTime * 0.65) % 1;
    const approach = cycle < 0.6 ? Math.min(1, cycle / 0.6) : 1 - (cycle - 0.6) / 0.4;
    const offset = 0.24 * (1 - approach);

    if (leftRef.current) leftRef.current.position.x = -0.02 - offset;
    if (rightRef.current) rightRef.current.position.x = 0.02 + offset;

    const locked = approach > 0.92;
    if (pulseRef.current && pulseMatRef.current) {
      const pulseScale = locked
        ? 0.14 + Math.sin(state.clock.elapsedTime * 9.5) * 0.03
        : 0.001;
      pulseRef.current.scale.setScalar(Math.max(0.001, pulseScale));
      pulseMatRef.current.opacity = locked ? (hovered ? 0.85 : 0.6) : 0;
    }
  });

  return (
    <group>
      <mesh ref={leftRef}>
        <boxGeometry args={[0.16, 0.16, 0.16]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={hovered ? 0.95 : 0.8} />
      </mesh>
      <mesh ref={rightRef} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshBasicMaterial color={DIM} toneMapped={false} transparent opacity={0.75} />
      </mesh>
      <mesh ref={pulseRef}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial ref={pulseMatRef} color={ACCENT} toneMapped={false} transparent opacity={0} />
      </mesh>
    </group>
  );
}

function StaticFallback({ kind }: { kind: BenefitIconKind }) {
  if (kind === "extract") {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.5, 0.66, 0.05]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.2} toneMapped={false} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(0.5, 0.66, 0.05)]} />
          <lineBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={0.85} />
        </lineSegments>
      </group>
    );
  }
  if (kind === "select") {
    return (
      <mesh>
        <torusGeometry args={[0.09, 0.02, 8, 16]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={0.85} />
      </mesh>
    );
  }
  return (
    <group>
      <mesh position={[-0.09, 0, 0]}>
        <boxGeometry args={[0.16, 0.16, 0.16]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0.09, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.14, 0.14, 0.14]} />
        <meshBasicMaterial color={DIM} toneMapped={false} transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

function SceneContent({ kind, staticFrame, hovered = false }: BenefitIconSceneProps) {
  if (staticFrame) return <StaticFallback kind={kind} />;
  if (kind === "extract") return <ExtractIcon hovered={hovered} />;
  if (kind === "select") return <SelectIcon hovered={hovered} />;
  return <ConnectIcon hovered={hovered} />;
}

export default function BenefitIconScene({ kind, staticFrame = false, hovered = false }: BenefitIconSceneProps) {
  return (
    <IconCanvas staticFrame={staticFrame}>
      <SceneContent kind={kind} staticFrame={staticFrame} hovered={hovered} />
    </IconCanvas>
  );
}
