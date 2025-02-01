import {
  HandleOptions,
  HandlesContext as HandlesContextImpl,
  PivotHandlesHandles as PivotHandlesHandlesImpl,
  HandlesProperties,
} from '@pmndrs/handle'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { createContext, forwardRef, useContext, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { Group } from 'three'

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
    const options: HandleOptions<any> = {
      alwaysUpdate,
      apply,
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
    useEffect(() => (enabled ? handles.scaleX.bind(0xff2060, scale) : undefined), [enabled, scale, handles])
    useEffect(() => (enabled ? handles.scaleY.bind(0x20df80, scale) : undefined), [enabled, scale, handles])
    useEffect(() => (enabled ? handles.scaleZ.bind(0x2080ff, scale) : undefined), [enabled, scale, handles])
    useEffect(() => (enabled ? handles.rotationX.bind(0xff2060, rotation) : undefined), [enabled, rotation, handles])
    useEffect(() => (enabled ? handles.rotationY.bind(0x20df80, rotation) : undefined), [enabled, rotation, handles])
    useEffect(() => (enabled ? handles.rotationZ.bind(0x2080ff, rotation) : undefined), [enabled, rotation, handles])
    useEffect(
      () => (enabled ? handles.translationX.bind(0xff2060, 0xffff40, translation) : undefined),
      [enabled, translation, handles],
    )
    useEffect(
      () => (enabled ? handles.translationY.bind(0x20df80, 0xffff40, translation) : undefined),
      [enabled, translation, handles],
    )
    useEffect(
      () => (enabled ? handles.translationZ.bind(0x2080ff, 0xffff40, translation) : undefined),
      [enabled, translation, handles],
    )
    useEffect(
      () => (enabled ? handles.translationXY.bind(0xff2060, 0xffff40, translation) : undefined),
      [enabled, translation, handles],
    )
    useEffect(
      () => (enabled ? handles.translationYZ.bind(0x2080ff, 0xffff40, translation) : undefined),
      [enabled, translation, handles],
    )
    useEffect(
      () => (enabled ? handles.translationXZ.bind(0x20df80, 0xffff40, translation) : undefined),
      [enabled, translation, handles],
    )
    useFrame((state) => handles.update(state.camera))
    return <primitive object={handles} />
  },
)
