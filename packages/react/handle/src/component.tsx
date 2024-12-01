import { createContext, forwardRef, ReactNode, RefObject, useContext, useImperativeHandle, useRef } from 'react'
import { HandleOptions, useHandle } from './hook.js'
import { Group, Object3D } from 'three'
import { GroupProps } from '@react-three/fiber'
import { HandleStore } from '@pmndrs/handle'

const HandleTargetRefContext = createContext<RefObject<Object3D> | undefined>(undefined)

export const HandleTarget = forwardRef<Group, GroupProps>((props, ref) => {
  const internalRef = useRef<Group>(null)
  useImperativeHandle(ref, () => internalRef.current!, [])
  return (
    <HandleTargetRefContext.Provider value={internalRef}>
      <group {...props} ref={internalRef} />
    </HandleTargetRefContext.Provider>
  )
})

export const Handle = forwardRef<HandleStore<unknown>, { children?: ReactNode } & HandleOptions<unknown>>(
  ({ children, ...props }, ref) => {
    const internalRef = useRef<Group>(null)
    const handleTargetRef = useContext(HandleTargetRefContext) ?? internalRef
    const store = useHandle(handleTargetRef, {
      handle: internalRef,
      ...props,
    })
    useImperativeHandle(ref, () => store, [store])
    return <group ref={internalRef}>{children}</group>
  },
)
