"use client";

import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";

type IconCanvasProps = {
  children: ReactNode;
  /** Renders a single static frame — no animation loop runs. */
  staticFrame?: boolean;
};

/**
 * Shared Canvas wrapper for small embedded icon-scale R3F scenes (~60-80px),
 * used by HowItWorksCards' step icons and BenefitsSection's benefit icons.
 * Fixes the camera/gl/style boilerplate in one place so each scene file only
 * defines its own primitives.
 */
export function IconCanvas({ children, staticFrame = false }: IconCanvasProps) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 1.8], fov: 40 }}
      style={{ background: "transparent" }}
      frameloop={staticFrame ? "demand" : "always"}
      dpr={[1, 1.5]}
    >
      {children}
    </Canvas>
  );
}
