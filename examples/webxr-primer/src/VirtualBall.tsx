import * as THREE from "three";
import React from "react";
import { Outlines } from "@react-three/drei";
import {
  HighlightAndSelectableElement,
  SelectableComponents,
} from "./SelectableComponents.enum";
import { Gimbal } from "./Gimbal";
import { DashedLine } from "./DashedLine";

interface VirtualBallOwnProps {
  position?: THREE.Vector3;
}

type VirtualBallProps = VirtualBallOwnProps & HighlightAndSelectableElement;

export const VirtualBall = ({ position, ...props }: VirtualBallProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const showOutlines = props.isSelected || isHovered;

  return (
    <mesh
      {...props}
      position={position}
      onPointerOver={(e) => {
        setIsHovered(true);
        e.stopPropagation();
      }}
      onPointerLeave={(e) => {
        setIsHovered(false);
        e.stopPropagation();
      }}
      onClick={(e) => {
        props.setIsSelected?.(SelectableComponents.ball);
        e.stopPropagation();
      }}
    >
      <sphereGeometry args={[0.2, 6, 4]} />
      <meshBasicMaterial color="red" wireframe />
      {showOutlines && <Outlines thickness={7} color="yellow" opacity={1} />}
      {props.isSelected && (
        <>
          <DashedLine
            start={[0, 0.0, 0.0]}
            end={[1, -2, -2]}
            thickness={4}
            color={"yellow"}
          />
        </>
      )}
    </mesh>
  );
};
