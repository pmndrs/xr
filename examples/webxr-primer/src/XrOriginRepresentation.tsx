import * as THREE from "three";
import React from "react";
import { Edges, Outlines } from "@react-three/drei";
import {
  HighlightAndSelectableElement,
  SelectableComponents,
} from "./SelectableComponents.enum";
import { Gimbal } from "./Gimbal";

interface GroundDiskOwnProps {
  position?: THREE.Vector3;
  isPositionedObjectSelected: boolean;
}

type GroundDiskProps = GroundDiskOwnProps & HighlightAndSelectableElement;

export const GroundDisk = ({
  position,
  isPositionedObjectSelected,
  ...props
}: GroundDiskProps) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const showOutlines = props.isSelected || isHovered;

  return (
    <mesh
      {...props}
      rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
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
        props.setIsSelected?.(SelectableComponents.origin);
        e.stopPropagation();
      }}
    >
      <circleGeometry args={[0.4, 64]} />
      <meshBasicMaterial color="orange" />
      {showOutlines && <Edges lineWidth={7} color="cyan" opacity={1} />}
      {(props.isSelected || isPositionedObjectSelected) && (
        <Gimbal
          colorX={"#FCAE1E"}
          colorY={"#ED7117"}
          colorZ={"#D67229"}
          length={0.5}
        />
      )}
    </mesh>
  );
};
