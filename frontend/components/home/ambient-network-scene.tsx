"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const ACCENT = "#FC8337";
const DIM = "#8A8A94";

// Deliberately sparse — fewer nodes than the per-card icons combined (3 cards
// x ~4 nodes = 12), so this reads as quiet atmosphere behind the cards, never
// a second focal point. Density is highest near the top of the section
// (continuing HomeHero's cluster) and fades toward the bottom.
const NODE_COUNT = 9;
const WIDTH = 9;
const HEIGHT = 5;
const DEPTH = 2.5;
const MAX_LINK_DIST = 2.4;

type NodeDatum = {
  position: THREE.Vector3;
  driftSeed: number;
  /** 0 (top, denser/brighter) .. 1 (bottom, sparser/dimmer) */
  depthFade: number;
};

function buildNodes(): NodeDatum[] {
  const nodes: NodeDatum[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    // Bias distribution toward the top of the section so density visually
    // continues from the Hero cluster above and thins out going down.
    const verticalBias = Math.pow(Math.random(), 1.6); // skews toward 0 (top)
    const y = HEIGHT / 2 - verticalBias * HEIGHT;
    const x = (Math.random() - 0.5) * WIDTH;
    const z = (Math.random() - 0.5) * DEPTH;

    nodes.push({
      position: new THREE.Vector3(x, y, z),
      driftSeed: Math.random() * Math.PI * 2,
      depthFade: verticalBias,
    });
  }
  return nodes;
}

function buildLinks(nodes: NodeDatum[]): [number, number][] {
  const links: [number, number][] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[i].position.distanceTo(nodes[j].position) < MAX_LINK_DIST) {
        links.push([i, j]);
      }
    }
  }
  return links;
}

function AmbientNetworkGroup() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();

  const { nodes, links } = useMemo(() => {
    const nodes = buildNodes();
    const links = buildLinks(nodes);
    return { nodes, links };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(DIM), []);
  const coreColor = useMemo(() => new THREE.Color(ACCENT), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const lineGeometry = useMemo(() => {
    const positions = new Float32Array(links.length * 2 * 3);
    links.forEach(([a, b], idx) => {
      const pa = nodes[a].position;
      const pb = nodes[b].position;
      positions.set([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z], idx * 6);
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [links, nodes]);

  useFrame((state, delta) => {
    // Slow but perceptible rotation — still quieter than HomeHero's 0.05 rad/s.
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.032 * delta;
    }

    const mesh = meshRef.current;
    if (!mesh) return;
    const elapsed = state.clock.elapsedTime;

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      // Slow drift only, no pointer interaction per spec.
      const driftX = Math.sin(elapsed * 0.14 + n.driftSeed) * 0.12;
      const driftY = Math.cos(elapsed * 0.11 + n.driftSeed * 1.4) * 0.1;

      dummy.position.set(n.position.x + driftX, n.position.y + driftY, n.position.z);
      dummy.scale.setScalar(0.03);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      // Nodes near the top (depthFade near 0) lean toward accent + brighter;
      // nodes further down fade to dim gray and lower implied brightness.
      tmpColor.copy(color).lerp(coreColor, Math.max(0, 1 - n.depthFade * 1.4));
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group ref={groupRef} scale={Math.min(viewport.width, 10) / 10 + 0.6}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, nodes.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.55} />
      </instancedMesh>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial color={DIM} transparent opacity={0.08} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

type AmbientNetworkSceneProps = {
  /** Renders a single static frame — no rotation/drift loop. */
  staticFrame?: boolean;
};

/**
 * Sparse, dim continuation of HomeHero's node-and-line motif, used as a full
 * -section ambient background behind HowItWorksCards. Intentionally quieter
 * than both the Hero scene and the per-card icons: fewer nodes, lower
 * opacity, no pointer parallax, slower drift. See ambient-network-canvas.tsx
 * for the mount-gating (viewport/mobile/reduced-motion) that wraps this.
 */
export default function AmbientNetworkScene({ staticFrame = false }: AmbientNetworkSceneProps) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 9], fov: 50 }}
      style={{ background: "transparent" }}
      frameloop={staticFrame ? "demand" : "always"}
      dpr={[1, 1.5]}
    >
      <fog attach="fog" args={["#030303", 6, 13]} />
      <AmbientNetworkGroup />
    </Canvas>
  );
}
