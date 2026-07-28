"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const ACCENT = "#FC8337";
const DIM = "#8A8A94";

const NODE_COUNT = 42;
const RADIUS = 3.4;
const MAX_LINK_DIST = 1.55;
const CORE_LINK_DIST = 1.9; // nodes within this distance of center pulse brighter

type NodeDatum = {
  position: THREE.Vector3;
  isCore: boolean;
  pulseSeed: number;
  pulseSpeed: number;
};

function buildNodes(): NodeDatum[] {
  const nodes: NodeDatum[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    // Distribute inside a sphere with slight bias toward mid-radius (looks
    // more like a "cluster" than a uniform ball or a hollow shell).
    const u = Math.random();
    const r = RADIUS * Math.cbrt(u) * (0.55 + Math.random() * 0.45);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    const position = new THREE.Vector3(x, y, z);
    const isCore = position.length() < CORE_LINK_DIST * 0.55;

    nodes.push({
      position,
      isCore,
      pulseSeed: Math.random() * Math.PI * 2,
      pulseSpeed: 0.6 + Math.random() * 0.8,
    });
  }
  return nodes;
}

function buildLinks(nodes: NodeDatum[]): [number, number][] {
  const links: [number, number][] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = nodes[i].position.distanceTo(nodes[j].position);
      if (dist < MAX_LINK_DIST) {
        links.push([i, j]);
      }
    }
  }
  return links;
}

function NetworkGroup() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport, pointer } = useThree();

  const { nodes, links } = useMemo(() => {
    const nodes = buildNodes();
    const links = buildLinks(nodes);
    return { nodes, links };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorCore = useMemo(() => new THREE.Color(ACCENT), []);
  const colorDim = useMemo(() => new THREE.Color(DIM), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const lineGeometry = useMemo(() => {
    const positions = new Float32Array(links.length * 2 * 3);
    links.forEach(([a, b], idx) => {
      const pa = nodes[a].position;
      const pb = nodes[b].position;
      positions[idx * 6 + 0] = pa.x;
      positions[idx * 6 + 1] = pa.y;
      positions[idx * 6 + 2] = pa.z;
      positions[idx * 6 + 3] = pb.x;
      positions[idx * 6 + 4] = pb.y;
      positions[idx * 6 + 5] = pb.z;
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [links, nodes]);

  // Smoothed pointer target for parallax tilt (damped, not snappy).
  const targetTilt = useRef({ x: 0, y: 0 });
  const currentTilt = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;

    // Idle auto-rotation, ~0.05 rad/s.
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.05 * delta;

      // Pointer parallax: max ~6deg tilt, smoothed with exponential damping.
      const maxTiltRad = THREE.MathUtils.degToRad(6);
      targetTilt.current.x = -pointer.y * maxTiltRad;
      targetTilt.current.y = pointer.x * maxTiltRad;

      const dampFactor = 1 - Math.pow(0.001, delta);
      currentTilt.current.x += (targetTilt.current.x - currentTilt.current.x) * dampFactor;
      currentTilt.current.y += (targetTilt.current.y - currentTilt.current.y) * dampFactor;

      groupRef.current.rotation.x = currentTilt.current.x;
      groupRef.current.rotation.z = currentTilt.current.y * 0.4;
    }

    // Per-node subtle drift + pulse brightness on the InstancedMesh.
    const mesh = meshRef.current;
    if (mesh) {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const driftX = Math.sin(elapsed * 0.3 + n.pulseSeed) * 0.04;
        const driftY = Math.cos(elapsed * 0.25 + n.pulseSeed * 1.3) * 0.04;
        const driftZ = Math.sin(elapsed * 0.2 + n.pulseSeed * 0.7) * 0.04;

        dummy.position.set(
          n.position.x + driftX,
          n.position.y + driftY,
          n.position.z + driftZ
        );

        const pulse = n.isCore
          ? 0.75 + Math.sin(elapsed * n.pulseSpeed + n.pulseSeed) * 0.35
          : 1;
        const scale = n.isCore ? 0.055 * (0.85 + pulse * 0.3) : 0.032;
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        tmpColor.copy(n.isCore ? colorCore : colorDim);
        if (n.isCore) {
          const brightness = 0.6 + Math.max(0, pulse) * 0.6;
          tmpColor.multiplyScalar(brightness);
        }
        mesh.setColorAt(i, tmpColor);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} scale={Math.min(viewport.width, 6) / 6 + 0.7}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color={ACCENT}
          transparent
          opacity={0.16}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

type HeroSceneProps = {
  /** Renders a single static frame (no rotation/drift/pulse/parallax). */
  staticFrame?: boolean;
};

export default function HeroScene({ staticFrame = false }: HeroSceneProps) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 8], fov: 45 }}
      style={{ background: "transparent" }}
      frameloop={staticFrame ? "demand" : "always"}
    >
      <fog attach="fog" args={["#030303", 5, 11]} />
      <NetworkGroup />
    </Canvas>
  );
}
