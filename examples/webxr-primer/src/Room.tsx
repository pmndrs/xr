import * as THREE from "three";
import React from "react";
import { Edges, Outlines } from "@react-three/drei";
import {
  HighlightAndSelectableElement,
  SelectableComponents,
} from "./SelectableComponents.enum";

const roomColor = "#ffd";

export const Room = (props: HighlightAndSelectableElement) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const showOutlines = props.isSelected || isHovered;

  return (
    <group
      {...props}
      onPointerOver={(e) => {
        setIsHovered(true);
        e.stopPropagation();
      }}
      onPointerLeave={(e) => {
        setIsHovered(false);
        e.stopPropagation();
      }}
      onClick={(e) => {
        props.setIsSelected?.(SelectableComponents.room);
        e.stopPropagation();
      }}
    >
      {/* Floor */}
      <mesh scale={5} position={[0, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry />
        <meshToonMaterial color={roomColor} />
        {showOutlines && (
          <Edges scale={1} lineWidth={7} color="pink" opacity={1} />
        )}
      </mesh>

      {/* Back wall */}
      <mesh scale={5} position={[0, 2.5, -2.5]}>
        <planeGeometry />
        <meshToonMaterial color={roomColor} />
        {showOutlines && (
          <Edges scale={1} lineWidth={7} color="pink" opacity={1} />
        )}
      </mesh>

      {/* Left wall */}
      <mesh scale={5} rotation={[0, Math.PI / 2, 0]} position={[-2.5, 2.5, 0]}>
        <planeGeometry />
        <meshToonMaterial color={roomColor} />
        {showOutlines && (
          <Edges scale={1} lineWidth={7} color="pink" opacity={1} />
        )}
      </mesh>
    </group>
  );
};
