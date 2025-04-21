import {
  HandleOptions,
  HandlesContext as HandlesContextImpl,
  PivotHandlesHandles as PivotHandlesHandlesImpl,
  HandlesProperties,
} from '@pmndrs/handle'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { createContext, forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { Group } from 'three'
import { useApplyThatDisablesDefaultControls } from './utils.js'

export type PivotHandlesProperties = PivotHandlesContextProperties & PivotHandlesHandlesProperties

export const PivotHandles = forwardRef<Group, PivotHandlesProperties>(
  ({ children, scale, translation, rotation, size, fixed, enabled, ...props }, ref) => {
    return (
      <PivotHandlesContext {...props} ref={ref}>
        <PivotHandlesHandles
          scale={scale}
          translation={translation}
          rotation={rotation}
          size={size}
          fixed={fixed}
          enabled={enabled}
        />
        {children}
      </PivotHandlesContext>
    )
  },
)

const HandlesContext = createContext<HandlesContextImpl | undefined>(undefined)

export type PivotHandlesContextProperties = Omit<ThreeElements['group'], 'scale'> &
  Pick<HandleOptions<any>, 'alwaysUpdate' | 'apply' | 'stopPropagation'>

export const PivotHandlesContext = forwardRef<Group, PivotHandlesContextProperties>(
  ({ alwaysUpdate, apply, stopPropagation, children, ...props }, ref) => {
    const internalRef = useRef<Group>(null)
    useImperativeHandle(ref, () => internalRef.current!, [])
    const applyThatDisablesControls = useApplyThatDisablesDefaultControls(apply)
    const options: HandleOptions<any> = {
      alwaysUpdate,
      apply: applyThatDisablesControls,
      stopPropagation,
    }
    const optionsRef = useRef(options)
    optionsRef.current = options
    const context = useMemo(() => new HandlesContextImpl(internalRef, () => optionsRef.current), [])
    useFrame((state) => context.update(state.clock.getElapsedTime()), -1)
    return (
      <group {...props} ref={internalRef}>
        <HandlesContext.Provider value={context}>{children}</HandlesContext.Provider>
      </group>
    )
  },
)

export type PivotHandlesHandlesProperties = {
  scale?: HandlesProperties
  translation?: HandlesProperties
  rotation?: HandlesProperties
  size?: number | null
  fixed?: boolean | null
  enabled?: boolean
}

function applyEnabled(properties: HandlesProperties | undefined, enabled: boolean) {
  if (properties === false) {
    return false
  }

  if (properties === true) {
    return { enabled }
  }

  if (typeof properties === 'string') {
    return { [properties]: true, enabled }
  }

  return { enabled, ...properties }
}

export const PivotHandlesHandles = forwardRef<PivotHandlesHandlesImpl, PivotHandlesHandlesProperties>(
  ({ size, fixed, scale, rotation, translation, enabled = true }, ref) => {
    const context = useContext(HandlesContext)
    if (context == null) {
      throw new Error('PivotHandlesHandles can only be used inside PivotHandlesContext')
    }
    const handles = useMemo(() => new PivotHandlesHandlesImpl(context), [context])
    useImperativeHandle(ref, () => handles, [handles])
    if (size !== null) {
      handles.size = size
    }
    if (fixed !== null) {
      handles.fixed = fixed
    }
    useEffect(
      () =>
        handles.bind(applyEnabled(translation, enabled), applyEnabled(rotation, enabled), applyEnabled(scale, enabled)),
      [enabled, scale, handles, translation, rotation],
    )
    useFrame((state) => handles.update(state.camera))
    return <primitive object={handles} />
  },
)
