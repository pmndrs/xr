import React, { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { ColorRepresentation } from "three";

interface DashedLineProps {
  start: THREE.Vector3 | [number, number, number];
  end: THREE.Vector3 | [number, number, number];
  color?: string;
  dotSize?: number;
  gapSize?: number;
  opacity?: number;
  thickness?: number;
}

export const DashedLine: React.FC<DashedLineProps> = ({
  start,
  end,
  color = "#ffffff",
  dotSize = 0.05,
  gapSize,
  thickness,
  opacity = 1,
}) => {
  const points = useMemo(() => {
    const s =
      start instanceof THREE.Vector3
        ? start
        : new THREE.Vector3(start[0], start[1], start[2]);
    const e =
      end instanceof THREE.Vector3
        ? end
        : new THREE.Vector3(end[0], end[1], end[2]);
    return [s, e];
  }, [start, end]);

  return (
    <Line
      points={points}
      dashed
      dashSize={dotSize}
      gapSize={gapSize ?? dotSize}
      lineWidth={thickness}
      color={color}
      opacity={opacity}
      transparent={opacity < 1}
    />
  );
};
