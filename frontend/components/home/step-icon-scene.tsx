"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const ACCENT = "#FC8337";
const DIM = "#8A8A94";

export type StepIconKind = "upload" | "assessment" | "match";

type StepIconSceneProps = {
  kind: StepIconKind;
  /** Renders a single static frame — no rotation/pulse/drift loop. */
  staticFrame?: boolean;
  /** Card is hovered — icon intensifies glow slightly. */
  hovered?: boolean;
};

function UploadIcon({ hovered }: { hovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.55 * delta;
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.4) * 0.08;
  });

  const emissiveIntensity = hovered ? 1.1 : 0.75;

  return (
    <group ref={groupRef}>
      <mesh>
        <boxGeometry args={[0.62, 0.82, 0.06]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.22} toneMapped={false} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(0.62, 0.82, 0.06)]} />
        <lineBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={emissiveIntensity} />
      </lineSegments>
      {[0.16, 0, -0.16].map((y, i) => (
        <mesh key={i} position={[0, y, 0.04]}>
          <boxGeometry args={[0.34, 0.035, 0.01]} />
          <meshBasicMaterial color={DIM} toneMapped={false} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function AssessmentIcon({ hovered }: { hovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  const nodes = useMemo(
    () => [
      new THREE.Vector3(0, 0.32, 0),
      new THREE.Vector3(0.3, -0.1, 0.12),
      new THREE.Vector3(-0.3, -0.1, -0.12),
      new THREE.Vector3(0, -0.3, 0.05),
    ],
    []
  );

  const linePositions = useMemo(() => {
    const pairs: [THREE.Vector3, THREE.Vector3][] = [
      [nodes[0], nodes[1]],
      [nodes[0], nodes[2]],
      [nodes[0], nodes[3]],
      [nodes[1], nodes[3]],
      [nodes[2], nodes[3]],
    ];
    const positions = new Float32Array(pairs.length * 2 * 3);
    pairs.forEach(([a, b], idx) => {
      positions.set([a.x, a.y, a.z, b.x, b.y, b.z], idx * 6);
    });
    return positions;
  }, [nodes]);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    return geometry;
  }, [linePositions]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += 0.32 * delta;
  });

  const baseGlow = hovered ? 1 : 0.65;

  return (
    <group ref={groupRef}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={ACCENT} transparent opacity={0.35} toneMapped={false} />
      </lineSegments>
      {nodes.map((pos, i) => (
        <PulsingNode key={i} position={pos} seed={i} isCore={i === 0} baseGlow={baseGlow} />
      ))}
    </group>
  );
}

function PulsingNode({
  position,
  seed,
  isCore,
  baseGlow,
}: {
  position: THREE.Vector3;
  seed: number;
  isCore: boolean;
  baseGlow: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;
    const pulse = 0.7 + Math.sin(state.clock.elapsedTime * 2.2 + seed) * 0.3;
    const scale = isCore ? 0.11 * (0.85 + pulse * 0.3) : 0.075;
    meshRef.current.scale.setScalar(scale);
    materialRef.current.opacity = isCore ? Math.min(1, baseGlow * pulse) : baseGlow * 0.7;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial ref={materialRef} color={isCore ? ACCENT : DIM} toneMapped={false} transparent />
    </mesh>
  );
}

function MatchIcon({ hovered }: { hovered: boolean }) {
  const leftRef = useRef<THREE.Mesh>(null);
  const rightRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const t = (Math.sin(state.clock.elapsedTime * 1.3) + 1) / 2; // 0..1 loop
    const offset = 0.22 * (1 - t * 0.75); // drift closer, then apart, looping
    if (leftRef.current) leftRef.current.position.x = -offset;
    if (rightRef.current) rightRef.current.position.x = offset;

    const proximity = 1 - offset / 0.22; // 0 = far, 1 = close
    if (glowRef.current && materialRef.current) {
      const scale = 0.05 + proximity * 0.06;
      glowRef.current.scale.setScalar(scale);
      materialRef.current.opacity = (hovered ? 0.9 : 0.6) * proximity;
    }
  });

  return (
    <group>
      <mesh ref={leftRef}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={hovered ? 0.95 : 0.8} />
      </mesh>
      <mesh ref={rightRef}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshBasicMaterial color={DIM} toneMapped={false} transparent opacity={0.75} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial ref={materialRef} color={ACCENT} toneMapped={false} transparent opacity={0} />
      </mesh>
    </group>
  );
}

function StaticFallback({ kind }: { kind: StepIconKind }) {
  // Single motionless frame per icon kind — same primitives, no useFrame loop.
  if (kind === "upload") {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.62, 0.82, 0.06]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0.22} toneMapped={false} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(0.62, 0.82, 0.06)]} />
          <lineBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={0.85} />
        </lineSegments>
      </group>
    );
  }
  if (kind === "assessment") {
    return (
      <mesh>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={0.85} />
      </mesh>
    );
  }
  return (
    <group>
      <mesh position={[-0.1, 0, 0]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0.1, 0, 0]}>
        <sphereGeometry args={[0.14, 10, 10]} />
        <meshBasicMaterial color={DIM} toneMapped={false} transparent opacity={0.75} />
      </mesh>
    </group>
  );
}

function SceneContent({ kind, staticFrame, hovered = false }: StepIconSceneProps) {
  if (staticFrame) return <StaticFallback kind={kind} />;
  if (kind === "upload") return <UploadIcon hovered={hovered} />;
  if (kind === "assessment") return <AssessmentIcon hovered={hovered} />;
  return <MatchIcon hovered={hovered} />;
}

export default function StepIconScene({ kind, staticFrame = false, hovered = false }: StepIconSceneProps) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 1.8], fov: 40 }}
      style={{ background: "transparent" }}
      frameloop={staticFrame ? "demand" : "always"}
      dpr={[1, 1.5]}
    >
      <SceneContent kind={kind} staticFrame={staticFrame} hovered={hovered} />
    </Canvas>
  );
}
