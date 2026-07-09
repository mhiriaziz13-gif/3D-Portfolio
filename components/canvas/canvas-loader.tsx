import { Html, useProgress } from "@react-three/drei";

export const CanvasLoader = () => {
  const { progress } = useProgress();

  return (
    <Html center>
      <span className="canvas-loader" aria-label="Loading 3D scene" />
      <span className="sr-only">{Math.round(progress)} percent loaded</span>
    </Html>
  );
};
