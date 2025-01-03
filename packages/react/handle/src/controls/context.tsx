import { ControlsContext as ControlsContextImpl, HandleOptions } from '@pmndrs/handle'
import { GroupProps, useFrame } from '@react-three/fiber'
import {
  createContext,
  FC,
  forwardRef,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  ReactNode,
  RefAttributes,
  RefObject,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import { Group, Object3D } from 'three'

const controlsContext = createContext<ControlsContextImpl | undefined>(undefined)

export type ControlsContextProperties = HandleOptions<any> & {
  targetRef: RefObject<Object3D | undefined>
  children?: ReactNode
}

export function ControlsContext({
  children,
  alwaysUpdate,
  apply,
  multitouch,
  scale,
  rotate,
  translate,
  stopPropagation,
  targetRef,
}: ControlsContextProperties) {
  const options: HandleOptions<any> = {
    alwaysUpdate,
    apply,
    multitouch,
    rotate,
    scale,
    stopPropagation,
    translate,
  }
  const optionsRef = useRef(options)
  optionsRef.current = options
  const impl = useMemo(() => new ControlsContextImpl(targetRef, () => optionsRef.current), [])
  useFrame((state) => impl.update(state.clock.getElapsedTime()))
  return <controlsContext.Provider value={impl}>{children}</controlsContext.Provider>
}

export function useControlsContext(): ControlsContextImpl {
  const context = useContext(controlsContext)
  if (context == null) {
    throw new Error(`useControlsContext can only be used inside a 'ControlsContext' component`)
  }
  return context
}

export type ControlProperties = Omit<GroupProps, 'scale'> & HandleOptions<any> & { tag: string }

export const Control: ForwardRefExoticComponent<PropsWithoutRef<ControlProperties> & RefAttributes<Group>> = forwardRef<
  Group,
  ControlProperties
>(({ children, tag, alwaysUpdate, apply, multitouch, scale, rotate, translate, stopPropagation, ...props }, ref) => {
  const internalRef = useRef<Group>(null)
  useImperativeHandle(ref, () => internalRef.current!, [])
  const context = useControlsContext()
  const overrideOptions: HandleOptions<any> = {
    alwaysUpdate,
    apply,
    multitouch,
    rotate,
    scale,
    stopPropagation,
    translate,
  }
  const overrideOptionsRef = useRef(overrideOptions)
  overrideOptionsRef.current = overrideOptions
  useEffect(() => context.registerControl(internalRef.current!, tag, () => overrideOptionsRef.current), [context, tag])
  return (
    <group {...props} ref={internalRef}>
      {children}
    </group>
  )
})
