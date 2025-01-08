import {
  forwardRef,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
  useImperativeHandle,
  useRef,
} from 'react'
import { ControlsAxisHighlight } from '../axis.js'
import { AxisTranslateControl } from './axis.js'
import { Control, ControlsContext, ControlsContextProperties } from '../context.js'
import { TranslateControlsDelta } from './delta.js'
import { MeshControlsMaterial } from '../material.js'
import { HandleOptions } from '@pmndrs/handle'
import { GroupProps } from '@react-three/fiber'
import { Group } from 'three'
import { PlaneTranslateControl } from './plane.js'
import { FreeTranslateControl } from './free.js'

export type TranslateControlsProperties = Omit<GroupProps, 'scale'> & HandleOptions<any>

export const TranslateControls: ForwardRefExoticComponent<
  PropsWithoutRef<TranslateControlsProperties> & RefAttributes<Group>
> = forwardRef<Group, TranslateControlsProperties>(
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
        <group ref={groupRef} {...props}>
          {/** XY */}
          <PlaneTranslateControl color={0x0000ff} hoverColor={0xffff00} opacity={0.5} hoverOpacity={1} tag="yx" />

          {/** XZ */}
          <PlaneTranslateControl
            rotation-x={Math.PI / 2}
            color={0x00ff00}
            hoverColor={0xffff00}
            opacity={0.5}
            hoverOpacity={1}
            tag="xz"
          />

          {/** YZ */}
          <PlaneTranslateControl
            rotation-y={-Math.PI / 2}
            color={0xff0000}
            hoverColor={0xffff00}
            opacity={0.5}
            hoverOpacity={1}
            tag="zy"
          />

          {/** X */}
          <AxisTranslateControl color={0xff0000} hoverColor={0xffff00} opacity={1} tag="x" />
          <AxisTranslateControl
            color={0xff0000}
            hoverColor={0xffff00}
            opacity={1}
            invert
            showArrowBody={false}
            tag="x"
          />
          <ControlsAxisHighlight showWhenHoveringTagsInclude="x" />

          {/** Y */}
          <AxisTranslateControl rotation-z={Math.PI / 2} color={0x00ff00} hoverColor={0xffff00} opacity={1} tag="y" />
          <AxisTranslateControl
            rotation-z={Math.PI / 2}
            color={0x00ff00}
            hoverColor={0xffff00}
            opacity={1}
            invert
            showArrowBody={false}
            tag="y"
          />
          <ControlsAxisHighlight rotation-z={Math.PI / 2} showWhenHoveringTagsInclude="y" />

          {/** Z */}
          <AxisTranslateControl rotation-y={-Math.PI / 2} color={0x0000ff} hoverColor={0xffff00} opacity={1} tag="z" />
          <AxisTranslateControl
            rotation-y={-Math.PI / 2}
            color={0x0000ff}
            hoverColor={0xffff00}
            opacity={1}
            invert
            showArrowBody={false}
            tag="z"
          />
          <ControlsAxisHighlight rotation-y={-Math.PI / 2} showWhenHoveringTagsInclude="z" />

          <TranslateControlsDelta />
          <FreeTranslateControl />
          {children}
        </group>
      </ControlsContext>
    )
  },
)

export * from './free.js'
export * from './axis.js'
export * from './delta.js'
export * from './plane.js'
