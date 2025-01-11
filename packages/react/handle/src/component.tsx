import { createContext, forwardRef, ReactNode, RefObject, useContext, useImperativeHandle, useRef } from 'react'
import { HandleOptions, useHandle } from './hook.js'
import { Group, Object3D } from 'three'
import { GroupProps } from '@react-three/fiber'
import { HandleStore } from '@pmndrs/handle'

const HandleTargetRefContext = createContext<RefObject<Object3D> | undefined>(undefined)

export const HandleTarget = forwardRef<Object3D, { children?: ReactNode; targetRef?: RefObject<Object3D> }>(
  ({ targetRef, children }, ref) => {
    const internalRef = useRef<Group>(null)
    useImperativeHandle(ref, () => (targetRef ?? internalRef).current!, [targetRef])
    if (targetRef != null) {
      return <HandleTargetRefContext.Provider value={targetRef}>{children}</HandleTargetRefContext.Provider>
    }
    return (
      <HandleTargetRefContext.Provider value={internalRef}>
        <group ref={internalRef}>{children}</group>
      </HandleTargetRefContext.Provider>
    )
  },
)

export const Handle = forwardRef<
  HandleStore<unknown>,
  {
    children?: ReactNode
    handleRef?: RefObject<Object3D>
    getHandleOptions?: () => HandleOptions<unknown>
  } & HandleOptions<unknown>
>(({ children, handleRef: providedHandleRef, getHandleOptions, ...props }, ref) => {
  const handleRef = useRef<Group>(null)
  const handleTargetRef = useContext(HandleTargetRefContext) ?? providedHandleRef ?? handleRef
  const store = useHandle(
    handleTargetRef,
    {
      handle: providedHandleRef ?? handleRef,
      ...props,
    },
    getHandleOptions,
  )
  useImperativeHandle(ref, () => store, [store])
  if (providedHandleRef != null) {
    return children
  }
  return <group ref={handleRef}>{children}</group>
})
