// Gimbal.tsx ---------------------------------------------------------------
import React from "react";
import { ColorRepresentation } from "three";

interface GimbalProps {
  /** Full length of each axis (default = 1) */
  length?: number;
  scale?: number;
  position?: [number, number, number];
  /** Arrow colours */
  colorX?: ColorRepresentation;
  colorY?: ColorRepresentation;
  colorZ?: ColorRepresentation;
}

export const Gimbal: React.FC<GimbalProps> = ({
  length = 1,
  colorX = "#ff4040",
  colorY = "#40ff40",
  colorZ = "#4040ff",
  position = [0, 0, 0],
  scale,
}) => {
  const headLen = length * 0.25;
  const shaftLen = length - headLen;
  const headRadius = length * 0.06;
  const shaftRadius = length * 0.02;

  /** Helper that renders one arrow given its orientation */
  const Arrow = ({
    dir,
    color,
  }: {
    dir: "x" | "y" | "z";
    color: ColorRepresentation;
  }) => {
    // Rotation that aligns a cylinder (which points up the Y-axis) to the desired axis
    const rot =
      dir === "x"
        ? [0, 0, -Math.PI / 2]
        : dir === "y"
        ? [Math.PI / 2, 0, 0]
        : [0, 0, 0];

    // Position the parts along that axis
    const shaftPos =
      dir === "x"
        ? [shaftLen / 2, 0, 0]
        : dir === "y"
        ? [0, 0, shaftLen / 2]
        : [0, shaftLen / 2, 0];

    const headPos =
      dir === "x"
        ? [length - headLen / 2, 0, 0]
        : dir === "y"
        ? [0, 0, length - headLen / 2]
        : [0, length - headLen / 2, 0];

    return (
      <>
        {/* shaft */}
        <mesh position={shaftPos as any} rotation={rot as any}>
          <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLen, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* arrow head */}
        <mesh position={headPos as any} rotation={rot as any}>
          <coneGeometry args={[headRadius, headLen, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </>
    );
  };

  return (
    <group scale={scale} position={position}>
      <Arrow dir="x" color={colorX} />
      <Arrow dir="y" color={colorZ} />
      <Arrow dir="z" color={colorY} />
    </group>
  );
};
