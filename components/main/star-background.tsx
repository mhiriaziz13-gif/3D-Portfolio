"use client";

import {
  Points,
  PointMaterial,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import * as random from "maath/random";
import { Suspense, useRef, useState } from "react";
import type { Points as PointsType } from "three";

const createStarPositions = (count: number) => {
  const positions = new Float32Array(
    random.inSphere(new Float32Array(count * 3), { radius: 1.2 }),
  );
  const invalidIndices: number[] = [];

  for (let index = 0; index < positions.length; index += 1) {
    if (!Number.isFinite(positions[index])) {
      invalidIndices.push(index);
      positions[index] = 0;
    }
  }

  if (
    process.env.NODE_ENV !== "production" &&
    (positions.length % 3 !== 0 || invalidIndices.length > 0)
  ) {
    console.warn("[StarBackground] Invalid position geometry was sanitized", {
      geometry: "portfolio-star-field",
      itemSize: 3,
      positionLength: positions.length,
      invalidIndices: invalidIndices.slice(0, 10),
    });
  }

  return positions;
};

const StarBackground = ({
  active,
  count,
}: {
  active: boolean;
  count: number;
}) => {
  const ref = useRef<PointsType | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const [sphere] = useState(() => createStarPositions(count));

  useFrame((_state, delta) => {
    if (!active || shouldReduceMotion) {
      return;
    }

    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points
        ref={ref}
        stride={3}
        positions={sphere}
        frustumCulled
      >
        <PointMaterial
          transparent
          color="#fff"
          size={0.002}
          sizeAttenuation
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

export const StarsCanvas = ({
  active,
  lowPower,
  onReady,
}: {
  active: boolean;
  lowPower: boolean;
  onReady?: () => void;
}) => (
  <div className="absolute inset-0 h-full w-full" aria-hidden="true">
    <Canvas
      camera={{ position: [0, 0, 1] }}
      dpr={lowPower ? 1 : [1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{
        antialias: !lowPower,
        powerPreference: "low-power",
      }}
      onCreated={onReady}
    >
      <Suspense fallback={null}>
        <StarBackground active={active} count={lowPower ? 700 : 1400} />
      </Suspense>
    </Canvas>
  </div>
);
