import { ReactNode, useEffect, useRef } from 'react'
import {
  HandleOptions,
  createTranslateControlsElements,
  updateTranslateControlsElements,
  bindTranslateControlsElements,
} from '@pmndrs/handle'
import { GroupProps, useFrame } from '@react-three/fiber'
import { Group } from 'three'

export type TranslateControlsProperties<T> = Pick<HandleOptions<T>, 'alwaysUpdate' | 'apply' | 'stopPropagation'> & {
  children?: ReactNode
} & GroupProps

export function TranslateControls<T>({
  children,
  alwaysUpdate,
  apply,
  stopPropagation,
  ...props
}: TranslateControlsProperties<T>) {
  const elementsRef = useRef<ReturnType<typeof createTranslateControlsElements<T>> | undefined>(undefined)
  const ref = useRef<Group>(null)
  const options: Pick<HandleOptions<T>, 'alwaysUpdate' | 'apply' | 'stopPropagation'> = {
    alwaysUpdate,
    apply,
    stopPropagation,
  }
  const propsRef = useRef(options)
  propsRef.current = options
  useEffect(() => {
    if (ref.current == null) {
      return
    }
    elementsRef.current = createTranslateControlsElements<T>(ref.current, () => propsRef.current)
    return bindTranslateControlsElements(elementsRef.current)
  }, [])
  useFrame(
    (state) =>
      elementsRef.current != null && updateTranslateControlsElements(elementsRef.current, state.clock.getElapsedTime()),
  )
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  )
}
