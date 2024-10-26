import { GroupProps } from '@react-three/fiber'
import { forwardRef, useImperativeHandle, useRef } from 'react'
import { Group } from 'three'
import { HandleOptions, useHandle } from './hook.js'

export const Handle = forwardRef<Group, GroupProps & HandleOptions<any>>((props, ref) => {
  const internalRef = useRef<Group>(null)
  useImperativeHandle(ref, () => internalRef.current!, [])
  useHandle(internalRef, props)
  return <group ref={internalRef}>{props.children}</group>
})
