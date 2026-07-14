"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useLoader } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { Suspense, useEffect, useMemo } from "react";
import type { Material, Mesh, Object3D, Texture } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { CanvasLoader } from "@/components/canvas/canvas-loader";

const EARTH_MODEL_URL = "/planet/scene.gltf";

const Earth = () => {
  // This model has no Draco or Meshopt compression. Loading it directly keeps
  // both optional decoders (and Meshopt's WebAssembly) out of the bundle.
  const earth = useLoader(GLTFLoader, EARTH_MODEL_URL);
  const scene = useMemo(() => {
    const clonedScene = earth.scene.clone(true);

    clonedScene.traverse((object: Object3D) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;

      mesh.geometry = mesh.geometry.clone();
      const sourceMaterial = mesh.material;
      const hasMaterialArray = Array.isArray(sourceMaterial);
      const materials: Material[] = Array.isArray(sourceMaterial)
        ? sourceMaterial
        : [sourceMaterial];

      const clonedMaterials = materials.map((sourceMaterial) => {
        const material = sourceMaterial.clone();
        const properties = material as unknown as Record<string, unknown>;

        Object.keys(properties).forEach((key) => {
          const value = properties[key];
          if (value && typeof value === "object" && "isTexture" in value) {
            const texture = (value as Texture).clone();
            texture.needsUpdate = true;
            properties[key] = texture;
          }
        });

        return material;
      });

      mesh.material = hasMaterialArray
        ? clonedMaterials
        : clonedMaterials[0];
    });

    return clonedScene;
  }, [earth.scene]);

  useEffect(
    () => () => {
      const disposedTextures = new Set<Texture>();

      scene.traverse((object: Object3D) => {
        const mesh = object as Mesh;
        if (!mesh.isMesh) return;

        mesh.geometry.dispose();
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        materials.forEach((material) => {
          const properties = material as unknown as Record<string, unknown>;
          Object.values(properties).forEach((value) => {
            if (
              value &&
              typeof value === "object" &&
              "isTexture" in value &&
              !disposedTextures.has(value as Texture)
            ) {
              disposedTextures.add(value as Texture);
              (value as Texture).dispose();
            }
          });
          material.dispose();
        });
      });

      // Drop the suspense loader entry so an SPA route unmount does not retain
      // the original, unrendered GLTF graph after the cloned scene is disposed.
      useLoader.clear(GLTFLoader, EARTH_MODEL_URL);
    },
    [scene],
  );

  return (
    <primitive object={scene} scale={2.45} position-y={0} rotation-y={0} />
  );
};

export const EarthCanvas = ({
  active,
  lowPower,
}: {
  active: boolean;
  lowPower: boolean;
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Canvas
      shadows={!lowPower}
      dpr={lowPower ? 1 : [1, 1.5]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: !lowPower, powerPreference: "low-power" }}
      camera={{
        fov: 45,
        near: 0.1,
        far: 200,
        position: [-4, 3, 6],
      }}
    >
      <Suspense fallback={<CanvasLoader />}>
        <OrbitControls
          autoRotate={active && !shouldReduceMotion}
          autoRotateSpeed={1.4}
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
        <Earth />
      </Suspense>
    </Canvas>
  );
};
