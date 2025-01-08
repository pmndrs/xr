import {
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react'
import { Group } from 'three'
import { ControlsContext } from '../context.js'
import { HandleOptions } from '@pmndrs/handle'
import { GroupProps } from '@react-three/fiber'
import { FreeScaleControl } from './free.js'
import { ControlsAxisHighlight } from '../axis.js'
import { AxisScaleHande } from './axis.js'
import { PlaneScaleHandle } from './plane.js'

export type ScaleControlsProperties = Omit<GroupProps, 'scale'> & HandleOptions<any>

export const ScaleControls: ForwardRefExoticComponent<PropsWithoutRef<ScaleControlsProperties> & RefAttributes<Group>> =
  forwardRef<Group, ScaleControlsProperties>(
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
            {/** XY */}
            <PlaneScaleHandle color={0x0000ff} hoverColor={0xffff00} opacity={0.5} hoverOpacity={1} tag="yx" />

            {/** XZ */}
            <PlaneScaleHandle
              rotation-x={Math.PI / 2}
              color={0x00ff00}
              hoverColor={0xffff00}
              opacity={0.5}
              hoverOpacity={1}
              tag="xz"
            />

            {/** YZ */}
            <PlaneScaleHandle
              rotation-y={-Math.PI / 2}
              color={0xff0000}
              hoverColor={0xffff00}
              opacity={0.5}
              hoverOpacity={1}
              tag="zy"
            />
            {/** X */}
            <AxisScaleHande color={0xff0000} hoverColor={0xffff00} opacity={1} tag="x" />
            <AxisScaleHande color={0xff0000} hoverColor={0xffff00} opacity={1} invert showHandleLine={false} tag="x" />
            <ControlsAxisHighlight showWhenHoveringTagsInclude="x" />

            {/** Y */}
            <AxisScaleHande rotation-z={Math.PI / 2} color={0x00ff00} hoverColor={0xffff00} opacity={1} tag="y" />
            <AxisScaleHande
              rotation-z={Math.PI / 2}
              color={0x00ff00}
              hoverColor={0xffff00}
              opacity={1}
              invert
              showHandleLine={false}
              tag="y"
            />
            <ControlsAxisHighlight rotation-z={Math.PI / 2} showWhenHoveringTagsInclude="y" />

            {/** Z */}
            <AxisScaleHande rotation-y={-Math.PI / 2} color={0x0000ff} hoverColor={0xffff00} opacity={1} tag="z" />
            <AxisScaleHande
              rotation-y={-Math.PI / 2}
              color={0x0000ff}
              hoverColor={0xffff00}
              opacity={1}
              invert
              showHandleLine={false}
              tag="z"
            />
            <ControlsAxisHighlight rotation-y={-Math.PI / 2} showWhenHoveringTagsInclude="z" />

            <FreeScaleControl />
            <group ref={groupRef}>{children}</group>
          </group>
        </ControlsContext>
      )
    },
  )

export * from './free.js'
export * from './axis.js'
export * from './plane.js'
