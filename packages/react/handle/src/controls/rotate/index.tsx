import { HandleOptions } from '@pmndrs/handle'
import { GroupProps } from '@react-three/fiber'
import {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react'
import { Group, TorusGeometry } from 'three'
import { ControlsContext } from '../context.js'
import { AxisRotateControl } from './axis.js'
import { ControlsAxisHighlight } from '../axis.js'
import { FreeRotateControl } from './free.js'
import { ScreenSpaceRotateControl } from './screen.js'

export type RotateControlsProperties = Omit<GroupProps, 'scale'> & HandleOptions<any>

export function createCircleGeometry(radius: number, arc: number) {
  const geometry = new TorusGeometry(radius, 0.0075, 3, 64, arc * Math.PI * 2)
  geometry.rotateY(Math.PI / 2)
  geometry.rotateX(Math.PI / 2)
  return geometry
}

export const RotateControls: ForwardRefExoticComponent<
  PropsWithoutRef<RotateControlsProperties> & RefAttributes<Group>
> = forwardRef<Group, RotateControlsProperties>(
  ({ children, alwaysUpdate, scale, rotate, translate, multitouch, apply, stopPropagation, ...props }, ref) => {
    const groupRef = useRef<Group>(null)
    useImperativeHandle(ref, () => groupRef.current!, [])
    return (
      <ControlsContext
        alwaysUpdate={alwaysUpdate}
        scale={scale}
        rotate={rotate}
        translate={translate}
        multitouch={multitouch}
        apply={apply}
        stopPropagation={stopPropagation}
        targetRef={groupRef}
      >
        <group {...props}>
          {/* X */}
          <AxisRotateControl color={0xff0000} opacity={1} tag="x" hoverColor={0xffff00} />
          <ControlsAxisHighlight showWhenHoveringTagsInclude="x" />

          {/* Y */}
          <AxisRotateControl color={0x00ff00} opacity={1} tag="y" hoverColor={0xffff00} />
          <ControlsAxisHighlight rotation-z={-Math.PI / 2} showWhenHoveringTagsInclude="y" />

          {/* Z */}
          <AxisRotateControl color={0x0000ff} opacity={1} tag="z" hoverColor={0xffff00} />
          <ControlsAxisHighlight rotation-y={Math.PI / 2} showWhenHoveringTagsInclude="z" />

          <FreeRotateControl />

          <ScreenSpaceRotateControl />

          <group ref={groupRef}>{children}</group>
        </group>
      </ControlsContext>
    )
  },
)
